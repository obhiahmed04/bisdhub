import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { PencilSimple } from '@phosphor-icons/react';
import api from '../utils/api';

const EditProfileDialog = ({ user, onProfileUpdated }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    profile_picture: user.profile_picture || '',
    banner_image: user.banner_image || '',
    is_profile_public: user.is_profile_public ?? true,
    is_followers_public: user.is_followers_public ?? true,
    is_following_public: user.is_following_public ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/me', formData);
      toast.success('Profile updated successfully!');
      setOpen(false);
      if (onProfileUpdated) onProfileUpdated(response.data);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        data-testid="edit-profile-button"
        onClick={() => setOpen(true)}
        className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-3 rounded-xl flex items-center gap-2"
      >
        <PencilSimple size={20} weight="bold" />
        Edit Profile
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Profile Picture URL</label>
              <Input
                value={formData.profile_picture}
                onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Banner Image URL</label>
              <Input
                value={formData.banner_image}
                onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] resize-none"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="space-y-3 border-2 border-[#111111] rounded-xl p-4">
              <h3 className="font-bold text-sm">Privacy Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Public Profile</p>
                  <p className="text-xs text-[#4B4B4B]">Anyone can view your profile</p>
                </div>
                <Switch
                  checked={formData.is_profile_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_profile_public: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Public Followers List</p>
                  <p className="text-xs text-[#4B4B4B]">Anyone can see who follows you</p>
                </div>
                <Switch
                  checked={formData.is_followers_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_followers_public: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Public Following List</p>
                  <p className="text-xs text-[#4B4B4B]">Anyone can see who you follow</p>
                </div>
                <Switch
                  checked={formData.is_following_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_following_public: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditProfileDialog;
