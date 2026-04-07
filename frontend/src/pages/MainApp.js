import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  House, ChatCircleDots, PaperPlaneTilt, User, MagnifyingGlass, 
  SignOut, Heart, ChatCircle, UsersThree, PaperPlaneRight 
} from '@phosphor-icons/react';
import api from '../utils/api';
import { API_BASE } from '../utils/api';

const MainApp = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [feedType, setFeedType] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [activeChatRoom, setActiveChatRoom] = useState('general');
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [dmConversations, setDmConversations] = useState([]);
  const [activeDM, setActiveDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [newDMMessage, setNewDMMessage] = useState('');
  const [ws, setWs] = useState(null);
  const [wsReady, setWsReady] = useState(false);
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadFeed();
    loadDMConversations();
    connectWebSocket();
  }, []);

  useEffect(() => {
    loadFeed();
  }, [feedType]);

  useEffect(() => {
    if (activeChatRoom) {
      loadChatMessages();
    }
  }, [activeChatRoom]);

  useEffect(() => {
    if (activeDM) {
      loadDMMessages();
    }
  }, [activeDM]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, dmMessages]);

  const connectWebSocket = () => {
    const wsUrl = `${API_BASE.replace('http', 'ws').replace('/api', '')}/ws/${user.user_id}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setWsReady(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.chat_room === activeChatRoom) {
        setChatMessages(prev => [...prev, data]);
      }
      if (data.dm_id && (data.sender_id === activeDM || data.receiver_id === activeDM)) {
        setDmMessages(prev => [...prev, data]);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsReady(false);
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      setWsReady(false);
    };

    setWs(socket);

    return () => {
      socket.close();
      setWsReady(false);
    };
  };

  const loadFeed = async () => {
    try {
      const response = await api.get(`/posts/feed/${feedType}`);
      setPosts(response.data);
    } catch (error) {
      toast.error('Failed to load feed');
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await api.post('/posts', { content: newPostContent, images: [] });
      toast.success('Post created!');
      setNewPostContent('');
      loadFeed();
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const likePost = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      loadFeed();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const searchContent = async () => {
    if (!searchQuery.trim()) return;

    try {
      const [usersRes, postsRes] = await Promise.all([
        api.get(`/users/search?query=${searchQuery}`),
        api.get(`/posts/search?query=${searchQuery}`)
      ]);
      setSearchResults({ users: usersRes.data, posts: postsRes.data });
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await api.get(`/chat/${activeChatRoom}/messages`);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Failed to load chat messages');
    }
  };

  const sendChatMessage = () => {
    if (!newChatMessage.trim() || !ws || !wsReady) {
      if (!wsReady) {
        toast.error('Chat connection not ready. Please wait...');
      }
      return;
    }

    ws.send(JSON.stringify({
      type: 'chat_message',
      chat_room: activeChatRoom,
      content: newChatMessage
    }));

    setNewChatMessage('');
    setTimeout(loadChatMessages, 100);
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
      toast.error('Failed to load messages');
    }
  };

  const sendDMMessage = async () => {
    if (!newDMMessage.trim()) return;

    try {
      await api.post(`/dm/${activeDM}/send`, { content: newDMMessage });
      setNewDMMessage('');
      loadDMMessages();
      loadDMConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getChatRooms = () => {
    const rooms = [{ id: 'general', name: 'General Chat', color: '#2563EB' }];
    
    if (user.section?.endsWith('B1') || user.section?.endsWith('B2')) {
      rooms.push({ id: 'boys_only', name: 'Boys Only', color: '#FF6B6B' });
    }
    if (user.section?.endsWith('G1') || user.section?.endsWith('G2')) {
      rooms.push({ id: 'girls_only', name: 'Girls Only', color: '#A7F3D0' });
    }
    if (!user.is_ex_student) {
      rooms.push({ id: `class_${user.current_class}`, name: `Class ${user.current_class}`, color: '#E8E6F4' });
      rooms.push({ id: `section_${user.section}`, name: `Section ${user.section}`, color: '#FFC107' });
    }
    if (user.is_ex_student) {
      rooms.push({ id: 'ex_students', name: 'EX Students', color: '#9C27B0' });
    }
    
    return rooms;
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7]">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-white border-r-2 border-[#111111] p-4 flex flex-col">
        <h1 className="text-2xl font-black mb-8" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="app-logo">
          BISD HUB
        </h1>

        <nav className="flex-1 space-y-2">
          <button
            data-testid="nav-home"
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] ${
              activeTab === 'home' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#111111]'
            } shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]`}
          >
            <House size={24} weight="bold" />
            Home
          </button>

          <button
            data-testid="nav-global-chat"
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] ${
              activeTab === 'chat' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#111111]'
            } shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]`}
          >
            <ChatCircleDots size={24} weight="bold" />
            Global Chat
          </button>

          <button
            data-testid="nav-dms"
            onClick={() => setActiveTab('dm')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] ${
              activeTab === 'dm' ? 'bg-[#2563EB] text-white' : 'bg-white text-[#111111]'
            } shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]`}
          >
            <PaperPlaneTilt size={24} weight="bold" />
            DMs
          </button>

          <button
            data-testid="nav-profile"
            onClick={() => navigate(`/profile/${user.id_number}`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]"
          >
            <User size={24} weight="bold" />
            Profile
          </button>

          {user.is_admin && (
            <button
              data-testid="nav-admin"
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]"
            >
              Admin Panel
            </button>
          )}
        </nav>

        <button
          data-testid="logout-button"
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]"
        >
          <SignOut size={24} weight="bold" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'home' && (
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-6">
              {/* Create Post */}
              <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-6 mb-6">
                <Textarea
                  data-testid="create-post-input"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 mb-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] resize-none"
                  rows={3}
                />
                <Button
                  data-testid="create-post-button"
                  onClick={createPost}
                  className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl"
                >
                  Post
                </Button>
              </div>

              {/* Feed Tabs */}
              <Tabs value={feedType} onValueChange={setFeedType} className="mb-4">
                <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1">
                  <TabsTrigger value="official" data-testid="feed-official">Official</TabsTrigger>
                  <TabsTrigger value="feed" data-testid="feed-public">Feed</TabsTrigger>
                  <TabsTrigger value="following" data-testid="feed-following">Following</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Posts Feed */}
              <ScrollArea className="flex-1">
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.post_id} data-testid={`post-${post.post_id}`} className="bg-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] rounded-xl p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="border-2 border-[#111111]">
                          <AvatarImage src={post.user?.profile_picture} />
                          <AvatarFallback>{post.user?.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{post.user?.display_name}</h3>
                            {post.user?.badges?.map((badge, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white">
                                {badge}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-[#4B4B4B]">@{post.user?.id_number}</p>
                        </div>
                      </div>
                      <p className="text-base mb-4">{post.content}</p>
                      <div className="flex gap-4">
                        <button
                          data-testid={`like-post-${post.post_id}`}
                          onClick={() => likePost(post.post_id, post.likes?.includes(user.user_id))}
                          className="flex items-center gap-2 text-[#111111] hover:text-[#FF6B6B] font-medium"
                        >
                          <Heart size={20} weight={post.likes?.includes(user.user_id) ? 'fill' : 'bold'} />
                          {post.likes?.length || 0}
                        </button>
                        <button className="flex items-center gap-2 text-[#111111] hover:text-[#2563EB] font-medium">
                          <ChatCircle size={20} weight="bold" />
                          {post.comments?.length || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Sidebar - Search */}
            <div className="w-80 bg-white border-l-2 border-[#111111] p-6">
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <Input
                    data-testid="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchContent()}
                    placeholder="Search users, posts..."
                    className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  />
                  <Button
                    data-testid="search-button"
                    onClick={searchContent}
                    className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 rounded-xl"
                  >
                    <MagnifyingGlass size={20} weight="bold" />
                  </Button>
                </div>

                {searchResults.users.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Users</h3>
                    <div className="space-y-2">
                      {searchResults.users.map((u) => (
                        <div
                          key={u.user_id}
                          onClick={() => navigate(`/profile/${u.id_number}`)}
                          className="flex items-center gap-2 p-2 rounded-lg border-2 border-[#111111] bg-white hover:bg-[#A7F3D0] cursor-pointer"
                        >
                          <Avatar className="border-2 border-[#111111] w-8 h-8">
                            <AvatarImage src={u.profile_picture} />
                            <AvatarFallback>{u.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold">{u.display_name}</p>
                            <p className="text-xs text-[#4B4B4B]">@{u.id_number}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 flex">
            {/* Chat Rooms List */}
            <div className="w-64 bg-white border-r-2 border-[#111111] p-4">
              <h2 className="text-lg font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Chat Rooms</h2>
              <div className="space-y-2">
                {getChatRooms().map((room) => (
                  <button
                    key={room.id}
                    data-testid={`chat-room-${room.id}`}
                    onClick={() => setActiveChatRoom(room.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px]`}
                    style={{
                      backgroundColor: activeChatRoom === room.id ? room.color : 'white',
                      color: activeChatRoom === room.id ? 'white' : '#111111'
                    }}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col p-6">
              <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 flex flex-col p-6">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.message_id} className={`flex ${msg.user_id === user.user_id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${
                          msg.user_id === user.user_id
                            ? 'bg-[#E6F4EA] border-2 border-[#111111] rounded-2xl rounded-tr-none px-4 py-3'
                            : 'bg-white border-2 border-[#111111] rounded-2xl rounded-tl-none px-4 py-3'
                        }`}>
                          {msg.user_id !== user.user_id && (
                            <p className="text-xs font-bold text-[#4B4B4B] mb-1">{msg.user?.display_name}</p>
                          )}
                          <p className="text-base">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    data-testid="chat-message-input"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  />
                  <Button
                    data-testid="send-chat-message"
                    onClick={sendChatMessage}
                    className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 rounded-xl"
                  >
                    <PaperPlaneRight size={20} weight="bold" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dm' && (
          <div className="flex-1 flex">
            {/* DM Conversations List */}
            <div className="w-80 bg-white border-r-2 border-[#111111] p-4">
              <h2 className="text-lg font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Direct Messages</h2>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {dmConversations.map((conv) => (
                    <button
                      key={conv.user.user_id}
                      data-testid={`dm-conversation-${conv.user.user_id}`}
                      onClick={() => setActiveDM(conv.user.user_id)}
                      className={`w-full text-left p-3 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] ${
                        activeDM === conv.user.user_id ? 'bg-[#2563EB] text-white' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-[#111111]">
                          <AvatarImage src={conv.user.profile_picture} />
                          <AvatarFallback>{conv.user.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-bold">{conv.user.display_name}</p>
                          <p className="text-xs opacity-75 truncate">{conv.last_message.content}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-[#FF6B6B] text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-[#111111]">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* DM Messages */}
            {activeDM && (
              <div className="flex-1 flex flex-col p-6">
                <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] flex-1 flex flex-col p-6">
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-4">
                      {dmMessages.map((msg) => (
                        <div key={msg.dm_id} className={`flex ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${
                            msg.sender_id === user.user_id
                              ? 'bg-[#E6F4EA] border-2 border-[#111111] rounded-2xl rounded-tr-none px-4 py-3'
                              : 'bg-white border-2 border-[#111111] rounded-2xl rounded-tl-none px-4 py-3'
                          }`}>
                            <p className="text-base">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      data-testid="dm-message-input"
                      value={newDMMessage}
                      onChange={(e) => setNewDMMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendDMMessage()}
                      placeholder="Type a message..."
                      className="border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                    />
                    <Button
                      data-testid="send-dm-message"
                      onClick={sendDMMessage}
                      className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 rounded-xl"
                    >
                      <PaperPlaneRight size={20} weight="bold" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainApp;
