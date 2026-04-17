import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { PencilSimple } from '@phosphor-icons/react';
import api, { buildAssetUrl } from '../utils/api';

const EditProfileDialog = ({ user, onProfileUpdated }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || user.display_name || '',
    bio: user.bio || '',
    profile_picture: user.profile_picture || '',
    banner_image: user.banner_image || '',
    is_profile_public: user.is_profile_public ?? true,
    is_followers_public: user.is_followers_public ?? true,
    is_following_public: user.is_following_public ?? true
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const pfpInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const uploadImage = async (file, kind) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    const res = await api.post('/upload', formDataUpload, { headers: { 'Content-Type': 'multipart/form-data' } });
    return buildAssetUrl(res.data.url);
  };

  const handleImageUpload = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (type === 'profile_picture') setUploadingPfp(true);
      else setUploadingBanner(true);
      const fullUrl = await uploadImage(file, type);
      setFormData(prev => ({ ...prev, [type]: fullUrl }));
      toast.success(type === 'profile_picture' ? 'Profile picture updated' : 'Banner updated');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      if (type === 'profile_picture') setUploadingPfp(false);
      else setUploadingBanner(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, username: formData.username.trim() };
      const response = await api.put('/users/me', payload);
      toast.success('Profile updated');
      onProfileUpdated(response.data);
      setOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}
        className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
        <PencilSimple size={14} weight="bold" /> Edit Profile
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl bg-white border-2 border-[#111111] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-black">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D1D1D1] p-3 text-sm bg-[#FAFAFA]">
              <p className="font-bold mb-1">School ID stays primary</p>
              <p className="text-[#4B4B4B]">Public posts show username + ID. Real name changes require admin help.</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Username</label>
              <Input value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} placeholder="Choose a username" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Real Name</label>
              <Input value={user.full_name || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Bio</label>
              <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-2">Profile Picture</label>
                {formData.profile_picture ? <img src={formData.profile_picture} alt="pfp" className="w-full h-32 object-cover rounded-xl border-2 border-[#111111] mb-2" /> : null}
                <input ref={pfpInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'profile_picture')} />
                <Button type="button" onClick={() => pfpInputRef.current?.click()} className="w-full bg-white text-[#111111] border-2 border-[#111111]">{uploadingPfp ? 'Uploading...' : 'Upload Picture'}</Button>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Banner Image</label>
                {formData.banner_image ? <img src={formData.banner_image} alt="banner" className="w-full h-32 object-cover rounded-xl border-2 border-[#111111] mb-2" /> : null}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner_image')} />
                <Button type="button" onClick={() => bannerInputRef.current?.click()} className="w-full bg-white text-[#111111] border-2 border-[#111111]">{uploadingBanner ? 'Uploading...' : 'Upload Banner'}</Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-sm">Private profile</p><p className="text-xs text-[#4B4B4B]">People can still view your header, but content locks unless approved.</p></div>
                <Switch checked={formData.is_profile_public} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_profile_public: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-sm">Followers list visible</p></div>
                <Switch checked={formData.is_followers_public} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_followers_public: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-bold text-sm">Following list visible</p></div>
                <Switch checked={formData.is_following_public} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_following_public: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button onClick={() => setOpen(false)} className="bg-white text-[#111111] border-2 border-[#111111]">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-[#2563EB] text-white border-2 border-[#111111]">{loading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditProfileDialog;
