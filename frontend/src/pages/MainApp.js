import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  House, ChatCircleDots, PaperPlaneTilt, User, MagnifyingGlass, 
  SignOut, Heart, ChatCircle, PaperPlaneRight, Flag, ShieldCheck, Crown,
  Moon, Sun, GearSix, ShareNetwork, ArrowsClockwise, UserPlus, Copy
} from '@phosphor-icons/react';
import api from '../utils/api';
import { API_BASE } from '../utils/api';
import NotificationBell from '../components/NotificationBell';
import CreatePostDialog from '../components/CreatePostDialog';
import CommentSection from '../components/CommentSection';
import ReportDialog from '../components/ReportDialog';
import { useTheme } from '../App';

const MainApp = ({ user, onLogout, updateUser }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [feedType, setFeedType] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [activeChatRoom, setActiveChatRoom] = useState('general');
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [dmConversations, setDmConversations] = useState([]);
  const [activeDM, setActiveDM] = useState(null);
  const [activeDMUser, setActiveDMUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [newDMMessage, setNewDMMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [wsReady, setWsReady] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);
  const wsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    loadFeed();
    loadDMConversations();
    const cleanup = connectWebSocket();
    return cleanup;
  }, []);

  // Handle incoming DM navigation from profile page
  useEffect(() => {
    if (location.state?.startDM) {
      setActiveTab('dm');
      setActiveDM(location.state.startDM.user_id);
      setActiveDMUser(location.state.startDM);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => { loadFeed(); }, [feedType]);

  useEffect(() => {
    if (activeChatRoom && wsRef.current?.readyState === WebSocket.OPEN) {
      loadChatMessages();
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: activeChatRoom }));
    }
  }, [activeChatRoom]);

  useEffect(() => {
    if (activeDM) loadDMMessages();
  }, [activeDM]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, dmMessages]);

  // Real-time search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => searchContent(), 300);
    } else {
      setSearchResults({ users: [], posts: [] });
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  const connectWebSocket = () => {
    const wsUrl = `${API_BASE.replace('https', 'wss').replace('http', 'ws')}/ws/${user.user_id}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setWsReady(true);
      socket.send(JSON.stringify({ type: 'join_room', room: activeChatRoom }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setChatMessages(prev => {
          if (prev.some(m => m.message_id === data.message_id)) return prev;
          return [...prev, data];
        });
      }
      if (data.type === 'dm') {
        setDmMessages(prev => {
          if (prev.some(m => m.dm_id === data.dm_id)) return prev;
          return [...prev, data];
        });
        loadDMConversations();
      }
    };

    socket.onerror = () => setWsReady(false);
    socket.onclose = () => {
      setWsReady(false);
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };

    setWs(socket);
    return () => { socket.close(); };
  };

  const loadFeed = async () => {
    try {
      const response = await api.get(`/posts/feed/${feedType}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load feed');
    }
  };

  const likePost = async (postId, isLiked) => {
    try {
      if (isLiked) await api.delete(`/posts/${postId}/like`);
      else await api.post(`/posts/${postId}/like`);
      loadFeed();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) return;
    try {
      const [usersRes, postsRes] = await Promise.all([
        api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`),
        api.get(`/posts/search?query=${encodeURIComponent(searchQuery)}`)
      ]);
      setSearchResults({ users: usersRes.data, posts: postsRes.data });
    } catch (error) {
      console.error('Search failed');
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await api.get(`/chat/${activeChatRoom}/messages`);
      setChatMessages(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have access to this room');
        setActiveChatRoom('general');
      }
    }
  };

  const sendChatMessage = () => {
    if (!newChatMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (!wsReady) toast.error('Chat connection not ready');
      return;
    }
    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      chat_room: activeChatRoom,
      content: newChatMessage
    }));
    setNewChatMessage('');
  };

  const loadDMConversations = async () => {
    try {
      const response = await api.get('/dm/conversations');
      setDmConversations(response.data);
    } catch (error) {
      console.error('Failed to load DM conversations');
    }
  };

  const loadDMMessages = async () => {
    try {
      const response = await api.get(`/dm/${activeDM}/messages`);
      setDmMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const sendDMMessage = async () => {
    if (!newDMMessage.trim() || !activeDM) return;
    try {
      await api.post(`/dm/${activeDM}/send`, { content: newDMMessage });
      setNewDMMessage('');
      loadDMMessages();
      loadDMConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const startDMWithUser = (targetUser) => {
    setActiveTab('dm');
    setActiveDM(targetUser.user_id);
    setActiveDMUser(targetUser);
  };

  const repostPost = async (postId) => {
    try {
      await api.post(`/posts/${postId}/repost`);
      toast.success('Post reposted!');
      loadFeed();
    } catch (error) {
      toast.error('Failed to repost');
    }
  };

  const sharePost = (postId) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Post link copied to clipboard!');
    }).catch(() => {
      toast.info('Share link: ' + url);
    });
  };

  const getChatRooms = () => {
    const rooms = [{ id: 'general', name: 'General', color: '#3b82f6' }];
    rooms.push({ id: 'boys_only', name: 'Boys Only', color: '#ef4444' });
    rooms.push({ id: 'girls_only', name: 'Girls Only', color: '#ec4899' });
    if (!user.is_ex_student) {
      rooms.push({ id: `class_${user.current_class}`, name: `Class ${user.current_class}`, color: '#8b5cf6' });
      rooms.push({ id: `section_${user.section}`, name: `Section ${user.section}`, color: '#f59e0b' });
    }
    if (user.is_ex_student) {
      rooms.push({ id: 'ex_students', name: 'EX Students', color: '#a855f7' });
    }
    return rooms;
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FDFBF7]" data-testid="main-app">
      {/* Left Sidebar */}
      <div className="hidden md:flex md:w-60 bg-white border-r-2 border-[#111111] p-4 flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="app-logo">BISD HUB</h1>
          <div className="flex gap-1">
            <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" data-testid="dark-mode-toggle">
              {darkMode ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>
            <NotificationBell user={user} ws={ws} />
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {[
            { id: 'home', icon: House, label: 'Home' },
            { id: 'chat', icon: ChatCircleDots, label: 'Global Chat' },
            { id: 'dm', icon: PaperPlaneTilt, label: 'Messages' },
          ].map(item => (
            <button
              key={item.id}
              data-testid={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] text-sm transition-all ${
                activeTab === item.id ? 'bg-[#2563EB] text-white' : 'bg-white text-[#111111]'
              } shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]`}
            >
              <item.icon size={18} weight="bold" />
              {item.label}
            </button>
          ))}

          <button
            data-testid="nav-profile"
            onClick={() => navigate(`/profile/${user.id_number}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm"
          >
            <User size={18} weight="bold" /> Profile
          </button>

          <button
            data-testid="nav-settings"
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm"
          >
            <GearSix size={18} weight="bold" /> Settings
          </button>

          {(user.role === 'Project Owner' || user.role === 'Management') && (
            <button data-testid="nav-management" onClick={() => navigate('/management')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm">
              <Crown size={18} weight="bold" /> Management
            </button>
          )}

          {user.is_admin && (
            <button data-testid="nav-admin" onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-[#A7F3D0] text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm">
              Admin Panel
            </button>
          )}

          {user.is_moderator && (
            <button data-testid="nav-moderation" onClick={() => navigate('/moderation')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-[#2563EB] text-white shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm">
              <ShieldCheck size={18} weight="bold" /> Moderation
            </button>
          )}
        </nav>

        <button data-testid="logout-button" onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] text-sm">
          <SignOut size={18} weight="bold" /> Logout
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#111111] flex justify-around py-2 z-50">
        {[
          { id: 'home', icon: House },
          { id: 'chat', icon: ChatCircleDots },
          { id: 'dm', icon: PaperPlaneTilt },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`p-2 rounded-lg ${activeTab === item.id ? 'text-[#2563EB]' : 'text-[#4B4B4B]'}`}>
            <item.icon size={24} weight={activeTab === item.id ? 'fill' : 'bold'} />
          </button>
        ))}
        <button onClick={() => navigate(`/profile/${user.id_number}`)} className="p-2 text-[#4B4B4B]">
          <User size={24} weight="bold" />
        </button>
        <button onClick={() => navigate('/settings')} className="p-2 text-[#4B4B4B]">
          <GearSix size={24} weight="bold" />
        </button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b-2 border-[#111111] p-3 flex items-center justify-between">
        <h1 className="text-lg font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>BISD HUB</h1>
        <div className="flex gap-2 items-center">
          <button onClick={toggleDarkMode} className="p-1.5" data-testid="mobile-dark-toggle">
            {darkMode ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
          </button>
          <NotificationBell user={user} ws={ws} />
          <button onClick={onLogout} className="p-1.5 border-2 border-[#111111] rounded-lg">
            <SignOut size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {activeTab === 'home' && (
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4">
              {/* Create Post */}
              <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
                <CreatePostDialog user={user} onPostCreated={loadFeed} />
              </div>

              {/* Feed Tabs */}
              <Tabs value={feedType} onValueChange={setFeedType} className="mb-3">
                <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1">
                  <TabsTrigger value="official" data-testid="feed-official">Official</TabsTrigger>
                  <TabsTrigger value="feed" data-testid="feed-public">Public</TabsTrigger>
                  <TabsTrigger value="following" data-testid="feed-following">Following</TabsTrigger>
                  <TabsTrigger value="friends" data-testid="feed-friends">Friends</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Posts */}
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {posts.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-[#4B4B4B]">No posts yet. Be the first to post!</p>
                    </div>
                  )}
                  {posts.map((post) => (
                    <div key={post.post_id} data-testid={`post-${post.post_id}`} className="bg-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="border-2 border-[#111111] cursor-pointer hover:opacity-80 w-10 h-10"
                          onClick={() => navigate(`/profile/${post.user?.id_number}`)}>
                          <AvatarImage src={post.user?.profile_picture} />
                          <AvatarFallback>{post.user?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-sm cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile/${post.user?.id_number}`)}>
                              {post.user?.display_name}
                            </span>
                            {post.user?.badges?.filter(b => b !== "Superior").map((badge, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-[#111111] bg-[#FF6B6B] text-white">
                                {badge}
                              </span>
                            ))}
                            {post.visibility === 'official' && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-[#111111] bg-[#2563EB] text-white">Official</span>
                            )}
                          </div>
                          <p className="text-xs text-[#4B4B4B] cursor-pointer hover:underline"
                            onClick={() => navigate(`/profile/${post.user?.id_number}`)}>
                            @{post.user?.id_number} {post.serial_number && `#${post.serial_number}`}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-3 break-words whitespace-pre-wrap">{post.content}</p>
                      
                      {/* Post Images */}
                      {post.images?.length > 0 && (
                        <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="w-full rounded-lg border-2 border-[#111111] object-cover max-h-64" />
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <button data-testid={`like-post-${post.post_id}`}
                          onClick={() => likePost(post.post_id, post.likes?.includes(user.user_id))}
                          className={`flex items-center gap-1.5 font-medium ${post.likes?.includes(user.user_id) ? 'text-[#FF6B6B]' : 'text-[#4B4B4B] hover:text-[#FF6B6B]'}`}>
                          <Heart size={18} weight={post.likes?.includes(user.user_id) ? 'fill' : 'bold'} />
                          {post.likes?.length || 0}
                        </button>
                        <button onClick={() => setExpandedComments({...expandedComments, [post.post_id]: !expandedComments[post.post_id]})}
                          className="flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#2563EB] font-medium">
                          <ChatCircle size={18} weight="bold" />
                          {post.comments?.length || 0}
                        </button>
                        <button onClick={() => repostPost(post.post_id)}
                          className="flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#16a34a] font-medium" data-testid={`repost-${post.post_id}`}>
                          <ArrowsClockwise size={18} weight="bold" />
                          {post.share_count || 0}
                        </button>
                        <button onClick={() => sharePost(post.post_id)}
                          className="flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#2563EB] font-medium" data-testid={`share-${post.post_id}`}>
                          <Copy size={18} weight="bold" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                        {post.user_id !== user.user_id && (
                          <button onClick={() => startDMWithUser(post.user)}
                            className="flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#2563EB] font-medium">
                            <PaperPlaneTilt size={18} weight="bold" />
                            <span className="hidden sm:inline">DM</span>
                          </button>
                        )}
                        {post.user_id !== user.user_id && (
                          <ReportDialog postId={post.post_id} onReported={loadFeed} />
                        )}
                      </div>
                      
                      {/* Repost indicator */}
                      {post.repost_of && (
                        <p className="text-[10px] text-[#4B4B4B] mt-1 flex items-center gap-1">
                          <ArrowsClockwise size={10} weight="bold" /> Reposted
                        </p>
                      )}
                      
                      {expandedComments[post.post_id] && (
                        <CommentSection post={post} user={user} />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Sidebar - Search */}
            <div className="hidden lg:block w-72 bg-white border-l-2 border-[#111111] p-4">
              <div className="mb-4">
                <div className="relative">
                  <Input
                    data-testid="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users, posts..."
                    className="border-2 border-[#111111] rounded-xl px-4 py-2 pr-10 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] w-full"
                  />
                  <MagnifyingGlass size={18} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B4B4B]" />
                </div>
              </div>

              {searchResults.users.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-[#4B4B4B]">Users</h3>
                  <div className="space-y-1.5">
                    {searchResults.users.slice(0, 5).map((u) => (
                      <div key={u.user_id} onClick={() => navigate(`/profile/${u.id_number}`)}
                        className="flex items-center gap-2 p-2 rounded-lg border border-[#111111] hover:bg-[#A7F3D0] cursor-pointer">
                        <Avatar className="w-8 h-8 border border-[#111111]">
                          <AvatarImage src={u.profile_picture} />
                          <AvatarFallback className="text-xs">{u.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{u.display_name}</p>
                          <p className="text-xs text-[#4B4B4B]">@{u.id_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.posts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-[#4B4B4B]">Posts</h3>
                  <div className="space-y-1.5">
                    {searchResults.posts.slice(0, 3).map((p) => (
                      <div key={p.post_id} className="p-2 rounded-lg border border-[#111111] text-sm">
                        <p className="font-bold text-xs">{p.user?.display_name}</p>
                        <p className="text-xs truncate">{p.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GLOBAL CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-48 md:w-56 bg-white border-r-2 border-[#111111] p-3 flex-shrink-0">
              <h2 className="text-sm font-black mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Chat Rooms</h2>
              <div className="space-y-1.5">
                {getChatRooms().map((room) => (
                  <button key={room.id} data-testid={`chat-room-${room.id}`}
                    onClick={() => setActiveChatRoom(room.id)}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold border-2 border-[#111111] text-xs shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] transition-all"
                    style={{
                      backgroundColor: activeChatRoom === room.id ? room.color : 'white',
                      color: activeChatRoom === room.id ? 'white' : '#111111'
                    }}>
                    {room.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4">
              <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D1D1D1]">
                  <h3 className="font-bold text-sm">{getChatRooms().find(r => r.id === activeChatRoom)?.name || 'Chat'}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${wsReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {wsReady ? 'Connected' : 'Reconnecting...'}
                  </span>
                </div>
                <ScrollArea className="flex-1 mb-3">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.message_id} className={`flex ${msg.user_id === user.user_id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${
                          msg.user_id === user.user_id
                            ? 'bg-[#2563EB] text-white rounded-2xl rounded-br-sm px-3 py-2'
                            : 'bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-3 py-2'
                        }`}>
                          {msg.user_id !== user.user_id && (
                            <p className="text-[10px] font-bold opacity-70 mb-0.5">{msg.user?.display_name}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-0.5 ${msg.user_id === user.user_id ? 'text-white/60' : 'text-[#4B4B4B]'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input data-testid="chat-message-input"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="border-2 border-[#111111] rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]" />
                  <Button data-testid="send-chat-message" onClick={sendChatMessage}
                    className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 rounded-xl">
                    <PaperPlaneRight size={18} weight="bold" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DMs */}
        {activeTab === 'dm' && (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-white border-r-2 border-[#111111] p-3 flex-shrink-0">
              <h2 className="text-sm font-black mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Direct Messages</h2>
              <ScrollArea className="h-full">
                <div className="space-y-1.5">
                  {dmConversations.map((conv) => (
                    <button key={conv.user?.user_id} data-testid={`dm-conversation-${conv.user?.user_id}`}
                      onClick={() => { setActiveDM(conv.user?.user_id); setActiveDMUser(conv.user); }}
                      className={`w-full text-left p-2.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] ${
                        activeDM === conv.user?.user_id ? 'bg-[#2563EB] text-white' : 'bg-white'
                      }`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-9 h-9 border-2 border-[#111111]">
                          <AvatarImage src={conv.user?.profile_picture} />
                          <AvatarFallback className="text-xs">{conv.user?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{conv.user?.display_name}</p>
                          <p className="text-xs opacity-60 truncate">{conv.last_message?.content}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-[#FF6B6B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#111111]">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {dmConversations.length === 0 && (
                    <p className="text-xs text-[#4B4B4B] text-center py-8">No conversations yet</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {activeDM ? (
              <div className="flex-1 flex flex-col p-4">
                <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 flex flex-col p-4 overflow-hidden">
                  {/* DM Header */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#D1D1D1]">
                    <Avatar className="w-8 h-8 border border-[#111111] cursor-pointer"
                      onClick={() => activeDMUser?.id_number && navigate(`/profile/${activeDMUser.id_number}`)}>
                      <AvatarImage src={activeDMUser?.profile_picture} />
                      <AvatarFallback className="text-xs">{activeDMUser?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm cursor-pointer hover:underline"
                      onClick={() => activeDMUser?.id_number && navigate(`/profile/${activeDMUser.id_number}`)}>
                      {activeDMUser?.display_name}
                    </span>
                  </div>

                  <ScrollArea className="flex-1 mb-3">
                    <div className="space-y-3">
                      {dmMessages.map((msg) => (
                        <div key={msg.dm_id} className={`flex ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] ${
                            msg.sender_id === user.user_id
                              ? 'bg-[#2563EB] text-white rounded-2xl rounded-br-sm px-3 py-2'
                              : 'bg-[#F5F5F5] rounded-2xl rounded-bl-sm px-3 py-2'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-[10px] mt-0.5 ${msg.sender_id === user.user_id ? 'text-white/60' : 'text-[#4B4B4B]'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input data-testid="dm-message-input"
                      value={newDMMessage}
                      onChange={(e) => setNewDMMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendDMMessage()}
                      placeholder="Type a message..."
                      className="border-2 border-[#111111] rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]" />
                    <Button data-testid="send-dm-message" onClick={sendDMMessage}
                      className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 rounded-xl">
                      <PaperPlaneRight size={18} weight="bold" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#4B4B4B]">Select a conversation or start a new one from a user's profile</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainApp;
