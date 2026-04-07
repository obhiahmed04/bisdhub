import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { Flag } from '@phosphor-icons/react';
import api from '../utils/api';

const ReportDialog = ({ postId, onReported }) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!category || !reason.trim()) {
      toast.error('Please select a category and provide a reason');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/mod/posts/${postId}/report`, {
        category: category,
        reason: reason
      });
      toast.success(`Post reported successfully! Report #${response.data.serial_number}`);
      setOpen(false);
      setCategory('');
      setReason('');
      if (onReported) onReported();
    } catch (error) {
      toast.error('Failed to report post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[#111111] hover:text-[#FF6B6B] font-medium text-sm"
      >
        <Flag size={18} weight="bold" />
        <span className="hidden md:inline">Report</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-2 border-[#111111] shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Flag size={24} weight="fill" className="text-[#FF6B6B]" />
              Report Post
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Report Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="misinformation">False Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Reason for Reporting</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide details about why you're reporting this post..."
                className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] resize-none"
                rows={4}
              />
            </div>

            <div className="bg-[#FFF4E5] border-2 border-[#111111] rounded-xl p-3">
              <p className="text-xs text-[#4B4B4B]">
                <span className="font-bold">Note:</span> Your report will be reviewed by our moderation team. 
                False reports may result in account restrictions.
              </p>
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
              onClick={handleSubmit}
              disabled={loading || !category || !reason.trim()}
              className="bg-[#FF6B6B] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-2 rounded-xl"
            >
              {loading ? 'Reporting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportDialog;
