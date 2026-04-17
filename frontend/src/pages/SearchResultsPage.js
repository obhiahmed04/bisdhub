import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, MagnifyingGlass, Heart, ChatCircle } from '@phosphor-icons/react';
import api, { buildAssetUrl, getPublicHandle } from '../utils/api';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { if (initialQuery.trim()) doSearch(initialQuery); }, [initialQuery]);
  const doSearch = async (q) => { if (!q.trim()) return; setLoading(true); try { const [u,p] = await Promise.all([api.get(`/users/search?query=${encodeURIComponent(q)}`), api.get(`/posts/search?query=${encodeURIComponent(q)}`)]); setUsers(u.data); setPosts(p.data);} finally { setLoading(false);} };
  const handleSubmit = (e) => { e.preventDefault(); if (!query.trim()) return; navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true }); doSearch(query); };
  const formatTime = (d) => { if (!d) return ''; const dt = new Date(d); const diff = Math.floor((Date.now() - dt.getTime())/1000); if (diff<60) return 'now'; if (diff<3600) return `${Math.floor(diff/60)}m`; if (diff<86400) return `${Math.floor(diff/3600)}h`; return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'}); };

  return <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111111]"><div className="max-w-3xl mx-auto p-4">
    <div className="flex items-center gap-3 mb-6"><Button onClick={() => navigate('/')} className="bg-white text-[#111111] border-2 border-[#111111]"><ArrowLeft size={16} weight="bold" /></Button><h1 className="text-xl font-black">Search</h1></div>
    <form onSubmit={handleSubmit} className="mb-6"><div className="relative"><Input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search users, posts..." className="border-2 border-[#111111] rounded-xl px-4 py-3 pr-12 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] w-full text-sm" /><button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#2563EB] text-white border-2 border-[#111111]"><MagnifyingGlass size={16} weight="bold" /></button></div></form>
    {loading ? <p className="text-center text-sm">Searching...</p> : null}
    {!loading && (users.length>0 || posts.length>0) ? <Tabs defaultValue="all"><TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1 mb-4"><TabsTrigger value="all">All ({users.length+posts.length})</TabsTrigger><TabsTrigger value="users">Users ({users.length})</TabsTrigger><TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger></TabsList>
      <TabsContent value="all"><div className="space-y-4">{!!users.length && <Section title="People">{users.slice(0,5).map(u => <UserCard key={u.user_id} user={u} navigate={navigate} />)}</Section>}{!!posts.length && <Section title="Posts">{posts.slice(0,10).map(p => <PostCard key={p.post_id} post={p} navigate={navigate} formatTime={formatTime} />)}</Section>}</div></TabsContent>
      <TabsContent value="users"><ScrollArea className="max-h-[600px]"><div className="space-y-2">{users.map(u => <UserCard key={u.user_id} user={u} navigate={navigate} />)}</div></ScrollArea></TabsContent>
      <TabsContent value="posts"><ScrollArea className="max-h-[600px]"><div className="space-y-3">{posts.map(p => <PostCard key={p.post_id} post={p} navigate={navigate} formatTime={formatTime} />)}</div></ScrollArea></TabsContent></Tabs> : null}
    {!loading && !users.length && !posts.length && initialQuery ? <div className="text-center py-16"><MagnifyingGlass size={48} className="mx-auto mb-3 opacity-30" /><p className="font-bold">No results found for "{initialQuery}"</p></div> : null}
  </div></div>;
};
const Section = ({title, children}) => <div><h3 className="text-[10px] font-bold uppercase tracking-wider mb-3 text-[#4B4B4B]">{title}</h3><div className="space-y-2">{children}</div></div>;
const UserCard = ({ user, navigate }) => <div onClick={() => navigate(`/profile/${user.id_number}`)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-white border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"><Avatar className="w-11 h-11 border-2 border-[#111111]"><AvatarImage src={buildAssetUrl(user.profile_picture)} /><AvatarFallback>{getPublicHandle(user)[0]?.toUpperCase()}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-sm truncate">@{getPublicHandle(user)}</p>{user.badges?.filter(b => b !== 'Superior').map((b, i) => <span key={i} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-[#111111] bg-[#FF6B6B] text-white">{b}</span>)}</div><p className="text-xs text-[#4B4B4B]">{user.id_number}</p><p className="text-xs text-[#6B7280] truncate">{user.full_name}</p></div></div>;
const PostCard = ({ post, navigate, formatTime }) => <div className="p-4 rounded-xl bg-white border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"><div className="flex items-center gap-2 mb-2"><Avatar className="w-8 h-8 border border-[#111111] cursor-pointer" onClick={() => navigate(`/profile/${post.user?.id_number}`)}><AvatarImage src={buildAssetUrl(post.user?.profile_picture)} /><AvatarFallback>{getPublicHandle(post.user)[0]?.toUpperCase()}</AvatarFallback></Avatar><div><span className="font-bold text-sm cursor-pointer hover:underline" onClick={() => navigate(`/profile/${post.user?.id_number}`)}>@{getPublicHandle(post.user)}</span><span className="text-xs text-[#4B4B4B] ml-2">{post.user?.id_number} · {formatTime(post.created_at)}</span></div></div><p className="text-sm whitespace-pre-wrap break-words mb-2">{post.content}</p>{post.images?.length > 0 ? <img src={buildAssetUrl(post.images[0])} alt="" className="rounded-lg border border-[#111111] max-h-48 object-cover mb-2" /> : null}<div className="flex gap-4 text-xs text-[#4B4B4B]"><span className="flex items-center gap-1"><Heart size={14} /> {post.likes?.length || 0}</span><span className="flex items-center gap-1"><ChatCircle size={14} /> {post.comments?.length || 0}</span></div></div>;
export default SearchResultsPage;
