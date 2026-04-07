import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { PaperPlaneRight, Image, X } from '@phosphor-icons/react';
import api from '../utils/api';

const CreatePostDialog = ({ user, onPostCreated }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setContent('');
      setVisibility('public');
      setShowConfirm(false);
      setImages([]);
    }
  };

  const uploadImage = async (file) => {
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    try {
      const response = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const imageUrl = `${backendUrl}${response.data.url}`;
      setImages(prev => [...prev, imageUrl]);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => uploadImage(file));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Please enter some content or add an image');
      return;
    }
    if (visibility === 'official') {
      setShowConfirm(true);
    } else {
      submitPost();
    }
  };

  const submitPost = async () => {
    setLoading(true);
    try {
      await api.post('/posts', {
        content: content,
        images: images,
        visibility: visibility
      });
      toast.success('Post created!');
      handleOpenChange(false);
      if (onPostCreated) onPostCreated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button data-testid="open-create-post" onClick={() => setOpen(true)}
        className="w-full bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold py-2.5 rounded-xl text-sm">
        Create Post
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>Create Post</DialogTitle>
            <DialogDescription className="text-[#4B4B4B] text-sm">Share with the BISD community</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Visibility</label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Feed</SelectItem>
                  <SelectItem value="profile_only">Profile Only</SelectItem>
                  <SelectItem value="friends_only">Friends Only</SelectItem>
                  {(user.is_admin || user.is_moderator) && (
                    <SelectItem value="official">Official Channel</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#4B4B4B] mt-1">
                {visibility === 'public' && 'Visible to everyone on public feed and your profile'}
                {visibility === 'profile_only' && 'Only visible on your profile page'}
                {visibility === 'friends_only' && 'Only visible to your friends'}
                {visibility === 'official' && 'Official Channel - all users will see this'}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block">Content</label>
              <Textarea data-testid="post-content-input" value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-white border-2 border-[#111111] rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] resize-none min-h-[100px]"
                rows={4} />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-full h-20 object-cover rounded-lg border-2 border-[#111111]" />
                    <button onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white rounded-full w-5 h-5 flex items-center justify-center border border-[#111111]">
                      <X size={10} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="flex gap-2">
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                <Image size={14} weight="bold" />
                {uploading ? 'Uploading...' : 'Add Image'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*,video/mp4" multiple className="hidden"
                onChange={handleFileSelect} />
            </div>
          </div>

          {!showConfirm ? (
            <DialogFooter>
              <Button onClick={() => setOpen(false)}
                className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 py-2 rounded-xl text-sm">
                Cancel
              </Button>
              <Button data-testid="submit-post-button" onClick={handleCreatePost} disabled={loading}
                className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <PaperPlaneRight size={16} weight="bold" /> Post
              </Button>
            </DialogFooter>
          ) : (
            <div className="bg-[#FF6B6B] border-2 border-[#111111] rounded-xl p-4">
              <p className="text-white font-bold mb-2 text-sm">Confirm Official Post</p>
              <p className="text-white text-xs mb-3">This post will be seen by all users and marked as official content. Are you sure?</p>
              <div className="flex gap-2">
                <Button onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-white text-[#111111] border-2 border-[#111111] font-bold py-2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button onClick={submitPost} disabled={loading}
                  className="flex-1 bg-[#111111] text-white border-2 border-[#111111] font-bold py-2 rounded-xl text-xs">
                  {loading ? 'Posting...' : 'Confirm & Post'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatePostDialog;
