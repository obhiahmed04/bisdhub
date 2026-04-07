import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { PaperPlaneRight } from '@phosphor-icons/react';
import api from '../utils/api';

const CommentSection = ({ post, user }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  const addComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/posts/${post.post_id}/comment`, {
        content: newComment
      });
      setComments([...comments, response.data.comment]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t-2 border-[#111111] pt-4">
      <h4 className="font-bold text-sm mb-3">Comments ({comments.length})</h4>
      
      {comments.length > 0 && (
        <ScrollArea className="max-h-60 mb-3">
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.comment_id} className="flex gap-2">
                <Avatar className="w-8 h-8 border-2 border-[#111111] flex-shrink-0">
                  <AvatarImage src={comment.profile_picture} />
                  <AvatarFallback className="text-xs">{comment.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-[#F5F5F5] border-2 border-[#111111] rounded-xl p-2">
                  <p className="font-bold text-xs">{comment.display_name}</p>
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-[#4B4B4B] mt-1">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && addComment()}
          placeholder="Write a comment..."
          className="border-2 border-[#111111] rounded-xl px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
        />
        <Button
          onClick={addComment}
          disabled={loading || !newComment.trim()}
          className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 rounded-xl"
        >
          <PaperPlaneRight size={16} weight="bold" />
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
