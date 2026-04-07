import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowLeft, Heart, ChatCircle } from '@phosphor-icons/react';
import api from '../utils/api';

const UserProfile = ({ user, onLogout }) => {
  const { idNumber } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [idNumber]);

  const loadProfile = async () => {
    try {
      const response = await api.get(`/users/${idNumber}`);
      setProfileUser(response.data);
      setIsFollowing(response.data.followers?.includes(user.user_id));
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const loadPosts = async () => {
    try {
      const response = await api.get(`/posts/user/${idNumber}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load posts');
    }
  };

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/users/${idNumber}/follow`);
        toast.success('Unfollowed');
      } else {
        await api.post(`/users/${idNumber}/follow`);
        toast.success('Followed');
      }
      setIsFollowing(!isFollowing);
      loadProfile();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const likePost = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      loadPosts();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="p-6">
          <Button
            data-testid="profile-back-button"
            onClick={() => navigate('/')}
            className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <ArrowLeft size={20} weight="bold" />
            Back
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] mx-6 mb-6">
          {/* Banner */}
          <div
            className="h-48 rounded-t-xl border-b-2 border-[#111111]"
            style={{
              backgroundImage: `url(${profileUser.banner_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="w-24 h-24 border-4 border-[#111111] -mt-16 bg-white" data-testid="profile-avatar">
                <AvatarImage src={profileUser.profile_picture} />
                <AvatarFallback className="text-2xl font-black">{profileUser.display_name?.[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="profile-name">
                    {profileUser.display_name}
                  </h1>
                  {profileUser.badges?.map((badge, i) => (
                    <span
                      key={i}
                      data-testid={`profile-badge-${i}`}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <p className="text-base text-[#4B4B4B] mb-2" data-testid="profile-id">@{profileUser.id_number}</p>
                <p className="text-sm font-medium text-[#4B4B4B]" data-testid="profile-class">
                  {profileUser.current_class} • {profileUser.section} {profileUser.is_ex_student && '• EX Student'}
                </p>
              </div>

              {profileUser.user_id !== user.user_id && (
                <Button
                  data-testid="profile-follow-button"
                  onClick={toggleFollow}
                  className={`border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-3 rounded-xl ${
                    isFollowing ? 'bg-white text-[#111111]' : 'bg-[#2563EB] text-white'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <div className="mb-6">
                <p className="text-base" data-testid="profile-bio">{profileUser.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-6">
              <div>
                <span className="font-black text-lg" data-testid="profile-followers-count">{profileUser.followers?.length || 0}</span>
                <span className="text-[#4B4B4B] ml-2">Followers</span>
              </div>
              <div>
                <span className="font-black text-lg" data-testid="profile-following-count">{profileUser.following?.length || 0}</span>
                <span className="text-[#4B4B4B] ml-2">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="px-6 pb-6">
          <h2 className="text-2xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Posts</h2>
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.post_id}
                  data-testid={`profile-post-${post.post_id}`}
                  className="bg-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] rounded-xl p-6"
                >
                  <p className="text-base mb-4">{post.content}</p>
                  <div className="flex gap-4">
                    <button
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

              {posts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg font-medium text-[#4B4B4B]">No posts yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
