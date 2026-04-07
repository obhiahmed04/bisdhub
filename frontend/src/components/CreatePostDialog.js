import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { PaperPlaneRight } from '@phosphor-icons/react';
import api from '../utils/api';

const CreatePostDialog = ({ user, onPostCreated }) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setContent('');
      setVisibility('public');
      setShowConfirm(false);
    }
  };

  const handleCreatePost = () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    // Show confirmation for official posts
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
        images: [],
        visibility: visibility
      });
      toast.success('Post created successfully!');
      setContent('');
      setVisibility('public');
      setShowConfirm(false);
      setOpen(false);
      if (onPostCreated) onPostCreated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        data-testid="open-create-post"
        onClick={() => setOpen(true)}
        className="w-full bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
      >
        Create Post
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Create New Post
            </DialogTitle>
            <DialogDescription className="text-[#4B4B4B]">
              Share your thoughts with the BISD community
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Post Visibility</label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Feed</SelectItem>
                  <SelectItem value="profile_only">Profile Only</SelectItem>
                  {(user.is_admin || user.is_moderator) && (
                    <SelectItem value="official">Official Channel ⚠️</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {visibility === 'public' && (
                <p className="text-xs text-[#4B4B4B] mt-1">Visible to everyone on public feed and your profile</p>
              )}
              {visibility === 'profile_only' && (
                <p className="text-xs text-[#4B4B4B] mt-1">Only visible on your profile page</p>
              )}
              {visibility === 'official' && (
                <p className="text-xs text-[#FF6B6B] mt-1 font-bold">⚠️ This will post to the Official Channel - use responsibly!</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Content</label>
              <Textarea
                data-testid="post-content-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] resize-none min-h-[120px]"
                rows={5}
              />
            </div>
          </div>

          {!showConfirm ? (
            <DialogFooter>
              <Button
                onClick={() => setOpen(false)}
                className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-post-button"
                onClick={handleCreatePost}
                disabled={loading}
                className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl flex items-center gap-2"
              >
                <PaperPlaneRight size={18} weight="bold" />
                Post
              </Button>
            </DialogFooter>
          ) : (
            <div className="bg-[#FF6B6B] border-2 border-[#111111] rounded-xl p-4">
              <p className="text-white font-bold mb-4">⚠️ Confirm Official Post</p>
              <p className="text-white text-sm mb-4">
                You are about to post to the Official Channel. This post will be seen by all users and marked as official content.
                Are you sure you want to proceed?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitPost}
                  disabled={loading}
                  className="flex-1 bg-[#111111] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 rounded-xl"
                >
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
