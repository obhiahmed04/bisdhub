import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { SignOut, CheckCircle, XCircle, ChatCircle, PaperPlaneRight } from '@phosphor-icons/react';
import api from '../utils/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [pendingRegs, setPendingRegs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [password, setPassword] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [helpChats, setHelpChats] = useState([]);
  const [activeHelpChat, setActiveHelpChat] = useState(null);
  const [helpMessages, setHelpMessages] = useState([]);
  const [newHelpMessage, setNewHelpMessage] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingRegistrations();
    loadAllUsers();
    loadHelpChats();
  }, []);

  useEffect(() => {
    if (activeHelpChat) {
      loadHelpMessages();
    }
  }, [activeHelpChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [helpMessages]);

  const loadPendingRegistrations = async () => {
    try {
      const response = await api.get('/admin/registrations/pending');
      setPendingRegs(response.data);
    } catch (error) {
      toast.error('Failed to load pending registrations');
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setAllUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const loadHelpChats = async () => {
    try {
      const response = await api.get('/admin/help-chats');
      setHelpChats(response.data);
    } catch (error) {
      console.error('Failed to load help chats');
    }
  };

  const loadHelpMessages = async () => {
    try {
      const response = await api.get(`/help-chat/${activeHelpChat}/messages`);
      setHelpMessages(response.data);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const sendHelpMessage = async () => {
    if (!newHelpMessage.trim()) return;

    try {
      await api.post(`/help-chat/${activeHelpChat}/message`, {
        sender_id: user.user_id,
        content: newHelpMessage
      }, {
        params: { user_type: 'admin' }
      });
      setNewHelpMessage('');
      loadHelpMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const approveRegistration = async (regId) => {
    if (!password) {
      toast.error('Please set a temporary password');
      return;
    }

    try {
      await api.post('/admin/registrations/action', {
        reg_id: regId,
        action: 'approve',
        password: password
      });
      toast.success('User approved successfully!');
      setPassword('');
      setSelectedReg(null);
      loadPendingRegistrations();
      loadAllUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve');
    }
  };

  const rejectRegistration = async (regId) => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post('/admin/registrations/action', {
        reg_id: regId,
        action: 'reject',
        rejection_reason: rejectionReason
      });
      toast.success('Registration rejected');
      setRejectionReason('');
      setSelectedReg(null);
      loadPendingRegistrations();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-title">
              Admin Panel
            </h1>
            <p className="text-base font-medium text-[#4B4B4B]">BISD HUB Administration</p>
          </div>
          <div className="flex gap-2 md:gap-4 mt-4 md:mt-0">
            <Button
              data-testid="admin-back-to-app"
              onClick={() => navigate('/')}
              className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base"
            >
              Back to App
            </Button>
            <Button
              data-testid="admin-logout"
              onClick={onLogout}
              className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 text-sm md:text-base"
            >
              <SignOut size={20} weight="bold" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1 mb-6 flex flex-wrap">
            <TabsTrigger value="pending" data-testid="admin-tab-pending">Pending ({pendingRegs.length})</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">Users ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="help" data-testid="admin-tab-help">Help Chat ({helpChats.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRegs.map((reg) => (
                <div
                  key={reg.reg_id}
                  data-testid={`pending-reg-${reg.reg_id}`}
                  className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-6"
                >
                  <h3 className="text-xl font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>{reg.full_name}</h3>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <p><span className="font-bold">ID Number:</span> {reg.id_number}</p>
                    <p><span className="font-bold">Email:</span> {reg.email}</p>
                    <p><span className="font-bold">DOB:</span> {reg.date_of_birth}</p>
                    <p><span className="font-bold">Class:</span> {reg.current_class}</p>
                    <p><span className="font-bold">Section:</span> {reg.section}</p>
                    <p><span className="font-bold">Status:</span> {reg.is_ex_student ? 'EX Student' : 'Current Student'}</p>
                    {reg.phone_number && <p><span className="font-bold">Phone:</span> {reg.phone_number}</p>}
                  </div>

                  {selectedReg === reg.reg_id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Temporary Password</label>
                        <Input
                          data-testid={`password-input-${reg.reg_id}`}
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Set temporary password"
                          className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          data-testid={`approve-button-${reg.reg_id}`}
                          onClick={() => approveRegistration(reg.reg_id)}
                          className="flex-1 bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 rounded-xl flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={20} weight="bold" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => setSelectedReg(null)}
                          className="flex-1 bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Or Reject</label>
                        <Textarea
                          data-testid={`rejection-reason-${reg.reg_id}`}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection"
                          className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] mb-2"
                          rows={2}
                        />
                        <Button
                          data-testid={`reject-button-${reg.reg_id}`}
                          onClick={() => rejectRegistration(reg.reg_id)}
                          className="w-full bg-[#FF6B6B] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-2 rounded-xl flex items-center justify-center gap-2"
                        >
                          <XCircle size={20} weight="bold" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      data-testid={`review-button-${reg.reg_id}`}
                      onClick={() => setSelectedReg(reg.reg_id)}
                      className="w-full bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
                    >
                      Review Application
                    </Button>
                  )}
                </div>
              ))}

              {pendingRegs.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <p className="text-lg font-medium text-[#4B4B4B]">No pending registrations</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-6">
              <div className="mb-4">
                <Input data-testid="admin-user-search" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by ID, name, email..."
                  className="border-2 border-[#111111] rounded-xl px-4 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] max-w-md" />
              </div>
              <ScrollArea className="h-[600px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#111111]">
                      <th className="text-left py-3 px-4 font-bold">ID Number</th>
                      <th className="text-left py-3 px-4 font-bold">Name</th>
                      <th className="text-left py-3 px-4 font-bold">Email</th>
                      <th className="text-left py-3 px-4 font-bold">Class</th>
                      <th className="text-left py-3 px-4 font-bold">Section</th>
                      <th className="text-left py-3 px-4 font-bold">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.filter(u => {
                      if (!userSearch.trim()) return true;
                      const q = userSearch.toLowerCase();
                      return u.id_number?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q);
                    }).map((u) => (
                      <tr key={u.user_id} className="border-b border-[#D1D1D1] hover:bg-[#A7F3D0]">
                        <td className="py-3 px-4 font-medium">{u.id_number}</td>
                        <td className="py-3 px-4">{u.display_name}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">{u.current_class}</td>
                        <td className="py-3 px-4">{u.section}</td>
                        <td className="py-3 px-4">
                          {u.is_admin && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white mr-1">Admin</span>}
                          {u.is_moderator && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#2563EB] text-white">Mod</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="help">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Help Chat List */}
              <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <ChatCircle size={24} weight="bold" />
                  Rejected Users
                </h3>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {helpChats.map((chat) => (
                      <div
                        key={chat.registration.reg_id}
                        onClick={() => setActiveHelpChat(chat.registration.reg_id)}
                        className={`p-3 rounded-xl border-2 border-[#111111] cursor-pointer hover:bg-[#A7F3D0] ${
                          activeHelpChat === chat.registration.reg_id ? 'bg-[#2563EB] text-white' : 'bg-white'
                        }`}
                      >
                        <p className="font-bold text-sm">{chat.registration.full_name}</p>
                        <p className={`text-xs ${activeHelpChat === chat.registration.reg_id ? 'text-white opacity-75' : 'text-[#4B4B4B]'}`}>
                          @{chat.registration.id_number}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border-2 border-[#111111] bg-[#FF6B6B] text-white mt-1">
                          {chat.message_count} messages
                        </span>
                      </div>
                    ))}

                    {helpChats.length === 0 && (
                      <p className="text-sm text-[#4B4B4B] text-center py-8">No help requests</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Interface */}
              <div className="md:col-span-2">
                {activeHelpChat ? (
                  <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-6 flex flex-col h-[600px]">
                    <h3 className="text-lg font-black mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Help Chat</h3>
                    
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-4">
                        {helpMessages.map((msg) => (
                          <div key={msg.message_id} className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] ${
                              msg.sender_type === 'admin'
                                ? 'bg-[#E6F4EA] border-2 border-[#111111] rounded-2xl rounded-tr-none px-4 py-3'
                                : 'bg-white border-2 border-[#111111] rounded-2xl rounded-tl-none px-4 py-3'
                            }`}>
                              <p className="text-xs font-bold text-[#4B4B4B] mb-1">
                                {msg.sender_type === 'admin' ? 'You (Admin)' : 'User'}
                              </p>
                              <p className="text-base">{msg.content}</p>
                              <p className="text-xs text-[#4B4B4B] mt-1">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Input
                        value={newHelpMessage}
                        onChange={(e) => setNewHelpMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendHelpMessage()}
                        placeholder="Type a message..."
                        className="border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      />
                      <Button
                        onClick={sendHelpMessage}
                        className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 rounded-xl"
                      >
                        <PaperPlaneRight size={20} weight="bold" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-12 text-center h-[600px] flex items-center justify-center">
                    <p className="text-lg font-medium text-[#4B4B4B]">Select a user to view help chat</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
