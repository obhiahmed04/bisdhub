import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { PaperPlaneRight, Heart, Eye } from '@phosphor-icons/react';
import api from '../utils/api';

const CommentSection = ({ post, user }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  const isPostOwner = post.user_id === user?.user_id;

  const addComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const response = await api.post(`/posts/${post.post_id}/comment`, {
        content: newComment
      });
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const viewLikes = async () => {
    try {
      const response = await api.get(`/posts/${post.post_id}/likes`);
      setLikeUsers(response.data);
      setShowLikes(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load likes');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#D1D1D1]" data-testid={`comments-${post.post_id}`}>
      {/* Like count - only visible to post owner */}
      {isPostOwner && post.likes?.length > 0 && (
        <button onClick={viewLikes} className="text-xs text-[#4B4B4B] hover:text-[#2563EB] flex items-center gap-1 mb-2">
          <Eye size={12} weight="bold" /> View {post.likes.length} like{post.likes.length !== 1 ? 's' : ''}
        </button>
      )}

      {/* Comments list */}
      <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
        {comments.map((comment, i) => (
          <div key={comment.comment_id || i} className="flex gap-2 items-start" data-testid={`comment-${i}`}>
            <Avatar className="w-6 h-6 border border-[#111111] flex-shrink-0">
              <AvatarImage src={comment.user?.profile_picture} />
              <AvatarFallback className="text-[8px]">{comment.user?.display_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="bg-[#F5F5F5] rounded-xl px-2.5 py-1.5 flex-1 min-w-0">
              <p className="font-bold text-[11px]">{comment.user?.display_name || 'User'}</p>
              <p className="text-xs break-words">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment input */}
      <div className="flex gap-2">
        <Input
          data-testid={`comment-input-${post.post_id}`}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addComment()}
          placeholder="Write a comment..."
          className="border-2 border-[#111111] rounded-xl px-3 py-1.5 text-sm shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
        />
        <Button data-testid={`comment-submit-${post.post_id}`} onClick={addComment} disabled={loading}
          className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[1px] hover:translate-x-[1px] font-bold px-3 rounded-xl">
          <PaperPlaneRight size={14} weight="bold" />
        </Button>
      </div>

      {/* Likes Dialog - Only post owner can see who liked */}
      <Dialog open={showLikes} onOpenChange={setShowLikes}>
        <DialogContent className="bg-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-black" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Heart size={18} weight="fill" className="text-[#FF6B6B] inline mr-1" /> Likes ({likeUsers.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {likeUsers.map((u) => (
              <div key={u.user_id} className="flex items-center gap-2 p-2 rounded-lg border border-[#111111]">
                <Avatar className="w-7 h-7 border border-[#111111]">
                  <AvatarImage src={u.profile_picture} />
                  <AvatarFallback className="text-[10px]">{u.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-xs">{u.display_name}</p>
                  <p className="text-[10px] text-[#4B4B4B]">@{u.id_number}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentSection;
