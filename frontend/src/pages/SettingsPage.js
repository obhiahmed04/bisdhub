import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Bell, Lock, UserCircle, Trash, Eye } from '@phosphor-icons/react';
import api from '../utils/api';
import { useTheme } from '../App';

const SettingsPage = ({ user, onLogout, updateUser }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    loadFriendRequests();
    loadFriends();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load profile');
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await api.get('/friends/requests');
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to load friend requests');
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.get('/friends/list');
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to load friends');
    }
  };

  const acceptFriend = async (userId) => {
    try {
      await api.post(`/friends/accept/${userId}`);
      toast.success('Friend request accepted!');
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      toast.error('Failed to accept friend request');
    }
  };

  const rejectFriend = async (userId) => {
    try {
      await api.post(`/friends/reject/${userId}`);
      toast.info('Friend request declined');
      loadFriendRequests();
    } catch (error) {
      toast.error('Failed to reject friend request');
    }
  };

  const removeFriend = async (userId) => {
    try {
      await api.delete(`/friends/${userId}`);
      toast.info('Friend removed');
      loadFriends();
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  const updatePrivacy = async (field, value) => {
    try {
      await api.put('/users/me', { [field]: value });
      setProfileData(prev => ({ ...prev, [field]: value }));
      toast.success('Setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button onClick={() => navigate('/')} data-testid="settings-back-button"
            className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-3 py-2 rounded-xl text-sm">
            <ArrowLeft size={16} weight="bold" />
          </Button>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="settings-title">Settings</h1>
        </div>

        {/* Appearance */}
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
          <h2 className="font-black text-sm mb-3 flex items-center gap-2">
            {darkMode ? <Moon size={16} weight="bold" /> : <Sun size={16} weight="bold" />}
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-xs text-[#4B4B4B]">Switch between light and dark themes</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} data-testid="settings-dark-mode-toggle" />
          </div>
        </div>

        {/* Privacy */}
        {profileData && (
          <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
            <h2 className="font-black text-sm mb-3 flex items-center gap-2">
              <Lock size={16} weight="bold" /> Privacy
            </h2>
            <div className="space-y-3">
              {[
                { key: 'is_profile_public', label: 'Public Profile', desc: 'Anyone can view your profile' },
                { key: 'is_followers_public', label: 'Public Followers', desc: 'Anyone can see your followers' },
                { key: 'is_following_public', label: 'Public Following', desc: 'Anyone can see who you follow' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-[10px] text-[#4B4B4B]">{item.desc}</p>
                  </div>
                  <Switch checked={profileData[item.key] ?? true}
                    onCheckedChange={(checked) => updatePrivacy(item.key, checked)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friend Requests */}
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
          <h2 className="font-black text-sm mb-3 flex items-center gap-2">
            <UserCircle size={16} weight="bold" /> Friend Requests ({friendRequests.length})
          </h2>
          {friendRequests.length === 0 ? (
            <p className="text-xs text-[#4B4B4B]">No pending friend requests</p>
          ) : (
            <div className="space-y-2">
              {friendRequests.map((req) => (
                <div key={req.user_id} className="flex items-center gap-3 p-2 border border-[#111111] rounded-xl">
                  <Avatar className="w-8 h-8 border border-[#111111] cursor-pointer"
                    onClick={() => navigate(`/profile/${req.id_number}`)}>
                    <AvatarImage src={req.profile_picture} />
                    <AvatarFallback className="text-xs">{req.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{req.display_name}</p>
                    <p className="text-xs text-[#4B4B4B]">@{req.id_number}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button onClick={() => acceptFriend(req.user_id)}
                      className="bg-[#A7F3D0] text-[#111111] border border-[#111111] font-bold px-2.5 py-1 rounded-lg text-xs">
                      Accept
                    </Button>
                    <Button onClick={() => rejectFriend(req.user_id)}
                      className="bg-[#FF6B6B] text-white border border-[#111111] font-bold px-2.5 py-1 rounded-lg text-xs">
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
          <h2 className="font-black text-sm mb-3 flex items-center gap-2">
            <UserCircle size={16} weight="bold" /> Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p className="text-xs text-[#4B4B4B]">No friends yet. Send friend requests from user profiles!</p>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.user_id} className="flex items-center gap-3 p-2 border border-[#111111] rounded-xl">
                    <Avatar className="w-8 h-8 border border-[#111111] cursor-pointer"
                      onClick={() => navigate(`/profile/${friend.id_number}`)}>
                      <AvatarImage src={friend.profile_picture} />
                      <AvatarFallback className="text-xs">{friend.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{friend.display_name}</p>
                      <p className="text-xs text-[#4B4B4B]">@{friend.id_number}</p>
                    </div>
                    <Button onClick={() => removeFriend(friend.user_id)}
                      className="bg-white text-[#FF6B6B] border border-[#111111] font-bold px-2.5 py-1 rounded-lg text-xs hover:bg-[#FF6B6B] hover:text-white">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 mb-4">
          <h2 className="font-black text-sm mb-3 flex items-center gap-2">
            <Eye size={16} weight="bold" /> Account Info
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#4B4B4B]">ID Number:</span><span className="font-bold">{user.id_number}</span></div>
            <div className="flex justify-between"><span className="text-[#4B4B4B]">Full Name:</span><span className="font-bold">{user.full_name}</span></div>
            <div className="flex justify-between"><span className="text-[#4B4B4B]">Email:</span><span className="font-bold">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-[#4B4B4B]">Role:</span><span className="font-bold">{user.role}</span></div>
            <div className="flex justify-between"><span className="text-[#4B4B4B]">Class:</span><span className="font-bold">{user.current_class} - {user.section}</span></div>
          </div>
        </div>

        {/* Logout */}
        <Button onClick={onLogout} data-testid="settings-logout-button"
          className="w-full bg-[#FF6B6B] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold py-3 rounded-xl text-sm mb-8">
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
