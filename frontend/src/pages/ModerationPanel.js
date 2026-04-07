import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { SignOut, ShieldCheck, Warning, Trash, UserMinus, SpeakerSlash } from '@phosphor-icons/react';
import api from '../utils/api';

const ModerationPanel = ({ user, onLogout }) => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [moderationAction, setModerationAction] = useState('');
  const [reason, setReason] = useState('');
  const [muteDuration, setMuteDuration] = useState(24);
  const [actionLogs, setActionLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
    loadUsers();
    loadActionLogs();
  }, []);

  const loadReports = async () => {
    try {
      const response = await api.get('/mod/reports', { params: { status: 'pending' } });
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to load reports');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const loadActionLogs = async () => {
    try {
      const response = await api.get('/management/action-logs', { params: { limit: 50 } });
      setActionLogs(response.data);
    } catch (error) {
      console.error('Failed to load logs');
    }
  };

  const handleModeration = async () => {
    if (!selectedUser || !moderationAction) return;

    try {
      await api.post('/mod/users/action', {
        target_user_id: selectedUser.user_id,
        action: moderationAction,
        reason: reason,
        mute_duration_hours: moderationAction === 'mute' ? muteDuration : undefined
      });
      toast.success(`User ${moderationAction}ed successfully`);
      setSelectedUser(null);
      setModerationAction('');
      setReason('');
      loadUsers();
      loadActionLogs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Moderation action failed');
    }
  };

  const deletePost = async (postId, reportId) => {
    try {
      await api.delete(`/mod/posts/${postId}`, { data: { reason: 'Violated community guidelines' } });
      await api.put(`/mod/reports/${reportId}/resolve`, null, { params: { status: 'resolved' } });
      toast.success('Post deleted and report resolved');
      loadReports();
      loadActionLogs();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const resolveReport = async (reportId, status) => {
    try {
      await api.put(`/mod/reports/${reportId}/resolve`, null, { params: { status } });
      toast.success('Report resolved');
      loadReports();
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="moderation-title">
              <ShieldCheck size={32} weight="fill" className="text-[#2563EB]" />
              Moderation Panel
            </h1>
            <p className="text-base font-medium text-[#4B4B4B]">Content Moderation & User Management</p>
          </div>
          <div className="flex gap-2 md:gap-4 mt-4 md:mt-0">
            <Button
              onClick={() => navigate('/')}
              className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base"
            >
              Back to App
            </Button>
            <Button
              onClick={onLogout}
              className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 text-sm md:text-base"
            >
              <SignOut size={20} weight="bold" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1 mb-6 flex flex-wrap">
            <TabsTrigger value="reports" data-testid="mod-tab-reports">Reports ({reports.length})</TabsTrigger>
            <TabsTrigger value="actions" data-testid="mod-tab-actions">User Actions</TabsTrigger>
            <TabsTrigger value="logs" data-testid="mod-tab-logs">Action Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <div className="space-y-6">
              {reports.map((report) => (
                <div
                  key={report.report_id}
                  data-testid={`report-${report.report_id}`}
                  className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 md:p-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Warning size={24} weight="fill" className="text-[#FF6B6B] flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-black mb-2">Post Report</h3>
                      <p className="text-sm text-[#4B4B4B] mb-2">
                        <span className="font-bold">Reported by:</span> {report.reporter?.display_name}
                      </p>
                      <p className="text-sm mb-4">
                        <span className="font-bold">Reason:</span> {report.reason}
                      </p>
                      
                      {report.post && (
                        <div className="bg-[#FDFBF7] border-2 border-[#111111] rounded-xl p-4 mb-4">
                          <p className="text-base mb-2">{report.post.content}</p>
                          <p className="text-xs text-[#4B4B4B]">Posted on {new Date(report.post.created_at).toLocaleString()}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          data-testid={`delete-post-${report.report_id}`}
                          onClick={() => deletePost(report.post_id, report.report_id)}
                          className="bg-[#FF6B6B] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm md:text-base"
                        >
                          <Trash size={18} weight="bold" />
                          Delete Post
                        </Button>
                        <Button
                          onClick={() => resolveReport(report.report_id, 'reviewed')}
                          className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 py-2 rounded-xl text-sm md:text-base"
                        >
                          Dismiss Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-12 text-center">
                  <p className="text-lg font-medium text-[#4B4B4B]">No pending reports</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 md:p-6 mb-6">
              <h3 className="text-xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Moderate User</h3>
              
              {selectedUser ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium">Selected: <span className="font-bold">{selectedUser.display_name}</span> (@{selectedUser.id_number})</p>
                  
                  {selectedUser.is_banned && (
                    <div className="bg-[#FF6B6B] border-2 border-[#111111] rounded-xl p-3 text-white">
                      <p className="font-bold text-sm">⚠ User is currently BANNED</p>
                      <p className="text-xs">Reason: {selectedUser.ban_reason}</p>
                    </div>
                  )}

                  {selectedUser.is_muted && (
                    <div className="bg-[#FFC107] border-2 border-[#111111] rounded-xl p-3">
                      <p className="font-bold text-sm">🔇 User is currently MUTED</p>
                      <p className="text-xs">Until: {new Date(selectedUser.mute_until).toLocaleString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Action</label>
                    <Select value={moderationAction} onValueChange={setModerationAction}>
                      <SelectTrigger className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ban">Ban User</SelectItem>
                        <SelectItem value="unban">Unban User</SelectItem>
                        <SelectItem value="mute">Mute User</SelectItem>
                        <SelectItem value="unmute">Unmute User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(moderationAction === 'ban' || moderationAction === 'mute') && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Reason</label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for moderation action"
                        className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                        rows={3}
                      />
                    </div>
                  )}

                  {moderationAction === 'mute' && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Mute Duration (hours)</label>
                      <Input
                        type="number"
                        value={muteDuration}
                        onChange={(e) => setMuteDuration(parseInt(e.target.value))}
                        className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      data-testid="execute-moderation"
                      onClick={handleModeration}
                      className="bg-[#FF6B6B] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 px-6 rounded-xl"
                    >
                      Execute Action
                    </Button>
                    <Button
                      onClick={() => { setSelectedUser(null); setModerationAction(''); setReason(''); }}
                      className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 px-6 rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#4B4B4B]">Select a user from the list below to moderate</p>
              )}
            </div>

            <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 md:p-6">
              <h3 className="text-lg font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>All Users</h3>
              <ScrollArea className="h-[400px] md:h-[500px]">
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.user_id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-3 rounded-xl border-2 border-[#111111] cursor-pointer hover:bg-[#A7F3D0] ${
                        selectedUser?.user_id === u.user_id ? 'bg-[#2563EB] text-white' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{u.display_name}</p>
                          <p className={`text-xs ${selectedUser?.user_id === u.user_id ? 'text-white opacity-75' : 'text-[#4B4B4B]'}`}>@{u.id_number}</p>
                        </div>
                        <div className="flex gap-1">
                          {u.is_banned && <span className="text-xs px-2 py-1 bg-[#FF6B6B] text-white rounded border-2 border-[#111111] font-bold">BANNED</span>}
                          {u.is_muted && <span className="text-xs px-2 py-1 bg-[#FFC107] text-[#111111] rounded border-2 border-[#111111] font-bold">MUTED</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4 md:p-6">
              <h3 className="text-lg font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Moderation Actions</h3>
              <ScrollArea className="h-[500px] md:h-[600px]">
                <div className="space-y-4">
                  {actionLogs.filter(log => ['ban', 'unban', 'mute', 'unmute', 'delete_post'].includes(log.action_type)).map((log) => (
                    <div key={log.log_id} className="border-2 border-[#111111] rounded-xl p-4 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white mb-2 md:mb-0 w-fit">
                          {log.action_type.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#4B4B4B]">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mb-1"><span className="font-bold">Moderator:</span> {log.admin_name}</p>
                      {log.target_user_name && <p className="text-sm mb-1"><span className="font-bold">Target:</span> {log.target_user_name}</p>}
                      <p className="text-sm text-[#4B4B4B]">{log.details}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModerationPanel;