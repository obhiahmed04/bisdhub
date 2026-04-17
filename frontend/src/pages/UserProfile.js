import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Heart, ChatCircle, UserPlus, UserMinus, Lock } from '@phosphor-icons/react';
import api, { buildAssetUrl, getPublicHandle } from '../utils/api';
import EditProfileDialog from '../components/EditProfileDialog';
import CommentSection from '../components/CommentSection';

const UserProfile = ({ currentUser, updateUser }) => {
  const { idNumber } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [tab, setTab] = useState('posts');
  const isOwnProfile = currentUser?.id_number === idNumber;

  useEffect(() => { loadAll(); }, [idNumber]);

  const loadAll = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${idNumber}`),
        api.get(`/posts/user/${idNumber}`),
      ]);
      setProfileUser(profileRes.data);
      setPosts(postsRes.data);
      loadFollowers();
      loadFollowing();
    } catch (e) {
      toast.error('Failed to load profile');
    }
  };

  const loadFollowers = async () => { try { const r = await api.get(`/users/${idNumber}/followers`); setFollowers(r.data); } catch { setFollowers([]); } };
  const loadFollowing = async () => { try { const r = await api.get(`/users/${idNumber}/following`); setFollowing(r.data); } catch { setFollowing([]); } };

  const isFollowing = useMemo(() => !!profileUser?.followers?.includes(currentUser?.user_id), [profileUser, currentUser]);
  const isFriend = useMemo(() => !!profileUser?.friends?.includes(currentUser?.user_id), [profileUser, currentUser]);
  const friendRequestReceived = useMemo(() => !!currentUser?.friend_requests_received?.includes(profileUser?.user_id), [currentUser, profileUser]);
  const friendRequestSent = useMemo(() => !!profileUser?.friend_requests_received?.includes(currentUser?.user_id), [currentUser, profileUser]);

  const onProfileUpdated = (updated) => { setProfileUser(updated); updateUser?.(updated); };

  const toggleFollow = async () => {
    try {
      if (isFollowing) await api.delete(`/users/${idNumber}/follow`);
      else await api.post(`/users/${idNumber}/follow`);
      await loadAll();
      toast.success(isFollowing ? 'Unfollowed' : 'Followed');
    } catch (e) { toast.error('Failed to update follow'); }
  };

  const sendFriendRequest = async () => { try { await api.post(`/friends/request/${idNumber}`); await loadAll(); toast.success('Friend request sent'); } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); } };
  const acceptFriendRequest = async () => { try { await api.post(`/friends/accept/${profileUser.user_id}`); await loadAll(); toast.success('Friend request accepted'); } catch { toast.error('Failed'); } };
  const removeFriend = async () => { try { await api.delete(`/friends/${profileUser.user_id}`); await loadAll(); toast.success('Friend removed'); } catch { toast.error('Failed'); } };
  const likePost = async (postId, isLiked) => { try { if (isLiked) await api.delete(`/posts/${postId}/like`); else await api.post(`/posts/${postId}/like`); loadAll(); } catch { toast.error('Failed'); } };

  if (!profileUser) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const visiblePosts = tab === 'reposts' ? posts.filter(p => p.repost_of) : posts.filter(p => !p.repost_of);
  const handle = getPublicHandle(profileUser);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111111]">
      <div className="max-w-3xl mx-auto pb-8">
        <div className="p-3 sm:p-4">
          <Button onClick={() => navigate('/')} className="bg-white text-[#111111] border-2 border-[#111111]">
            <ArrowLeft size={16} weight="bold" /> Back
          </Button>
        </div>
        <div className="mx-3 sm:mx-4 mb-4 bg-white dark:bg-[#171717] border-2 border-[#111111] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
          <div className="h-32 sm:h-44 border-b-2 border-[#111111] bg-gradient-to-r from-blue-400 to-purple-500" style={profileUser.banner_image ? { backgroundImage: `url(${buildAssetUrl(profileUser.banner_image)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Avatar className="w-20 h-20 border-4 border-[#111111] -mt-14 bg-white">
                <AvatarImage src={buildAssetUrl(profileUser.profile_picture)} />
                <AvatarFallback className="text-2xl font-black">{handle?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black">@{handle}</h1>
                  {profileUser.badges?.filter(b => b !== 'Superior').map((badge, i) => <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#111111] bg-[#FF6B6B] text-white">{badge}</span>)}
                  {profileUser.profile_locked && <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border border-[#111111] bg-[#F5F5F5]"><Lock size={12} /> Private</span>}
                </div>
                <p className="text-sm text-[#4B4B4B] mt-1">ID: {profileUser.id_number}</p>
                <p className="text-sm text-[#4B4B4B]">{profileUser.full_name}</p>
                {profileUser.bio ? <p className="text-sm mt-3">{profileUser.bio}</p> : null}
                <div className="flex flex-wrap gap-4 mt-3 text-sm">
                  <button onClick={() => setShowFollowers(true)}><span className="font-black">{followers.length}</span> Followers</button>
                  <button onClick={() => setShowFollowing(true)}><span className="font-black">{following.length}</span> Following</button>
                  <span><span className="font-black">{profileUser.friends?.length || 0}</span> Friends</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {isOwnProfile ? <EditProfileDialog user={profileUser} onProfileUpdated={onProfileUpdated} /> : (<>
                    <Button onClick={toggleFollow} className={`${isFollowing ? 'bg-white text-[#111111]' : 'bg-[#2563EB] text-white'} border-2 border-[#111111]`}>{isFollowing ? 'Unfollow' : 'Follow'}</Button>
                    {isFriend ? <Button onClick={removeFriend} className="bg-[#FF6B6B] text-white border-2 border-[#111111]"><UserMinus size={14} /> Unfriend</Button> : friendRequestReceived ? <Button onClick={acceptFriendRequest} className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111]"><UserPlus size={14} /> Accept Request</Button> : friendRequestSent ? <Button disabled className="bg-[#F5F5F5] text-[#4B4B4B] border-2 border-[#111111]">Request Sent</Button> : <Button onClick={sendFriendRequest} className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111]"><UserPlus size={14} /> Add Friend</Button>}
                  </>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {profileUser.profile_locked ? (
          <div className="mx-3 sm:mx-4 bg-white dark:bg-[#171717] border-2 border-[#111111] rounded-2xl p-6 text-center shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
            <Lock size={32} className="mx-auto mb-3" />
            <h2 className="font-black text-lg mb-2">This profile is private</h2>
            <p className="text-sm text-[#4B4B4B]">You can view the profile header, but posts and lists stay locked until they follow you back or accept you.</p>
          </div>
        ) : (
          <div className="mx-3 sm:mx-4">
            <Tabs value={tab} onValueChange={setTab} className="mb-4">
              <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="reposts">Reposts</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <div key={post.post_id} className="bg-white dark:bg-[#171717] border-2 border-[#111111] rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 border-2 border-[#111111]"><AvatarImage src={buildAssetUrl(post.user?.profile_picture)} /><AvatarFallback>{(post.user?.username || post.user?.display_name || 'U')[0]}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">@{post.user?.username || post.user?.display_name}</span>
                        <span className="text-xs text-[#4B4B4B]">· {post.user?.id_number}</span>
                      </div>
                      {post.repost_of ? <p className="text-[11px] text-[#4B4B4B] mt-1">↻ Repost</p> : null}
                      <p className="mt-3 text-sm whitespace-pre-wrap break-words">{post.content}</p>
                      {post.images?.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">{post.images.map((img, i) => <img key={i} src={buildAssetUrl(img)} alt="" className="w-full max-h-72 object-cover rounded-xl border-2 border-[#111111]" />)}</div> : null}
                      <div className="flex gap-4 mt-4 text-sm">
                        <button onClick={() => likePost(post.post_id, post.likes?.includes(currentUser?.user_id))} className="flex items-center gap-1"><Heart size={16} weight={post.likes?.includes(currentUser?.user_id) ? 'fill' : 'bold'} /> {post.likes?.length || 0}</button>
                        <button onClick={() => setExpandedComments(prev => ({ ...prev, [post.post_id]: !prev[post.post_id] }))} className="flex items-center gap-1"><ChatCircle size={16} weight="bold" /> {post.comments?.length || 0}</button>
                      </div>
                      {expandedComments[post.post_id] ? <div className="mt-3"><CommentSection post={post} user={currentUser} /></div> : null}
                    </div>
                  </div>
                </div>
              ))}
              {!visiblePosts.length ? <div className="bg-white dark:bg-[#171717] border-2 border-[#111111] rounded-2xl p-6 text-center">No {tab} yet.</div> : null}
            </div>
          </div>
        )}

        <SimpleListDialog open={showFollowers} setOpen={setShowFollowers} title="Followers" items={followers} />
        <SimpleListDialog open={showFollowing} setOpen={setShowFollowing} title="Following" items={following} />
      </div>
    </div>
  );
};

const SimpleListDialog = ({ open, setOpen, title, items }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="bg-white border-2 border-[#111111] rounded-xl">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="max-h-[60vh] overflow-auto space-y-2">
        {items.map((item) => (
          <div key={item.user_id} className="flex items-center gap-3 p-2 rounded-xl border border-[#D1D1D1]">
            <Avatar className="w-10 h-10 border border-[#111111]"><AvatarImage src={buildAssetUrl(item.profile_picture)} /><AvatarFallback>{(item.username || item.display_name || 'U')[0]}</AvatarFallback></Avatar>
            <div><p className="font-bold text-sm">@{item.username || item.display_name}</p><p className="text-xs text-[#4B4B4B]">{item.id_number}</p></div>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-[#4B4B4B]">Nothing to show.</p> : null}
      </div>
    </DialogContent>
  </Dialog>
);

export default UserProfile;
