import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { SignOut, CheckCircle, XCircle } from '@phosphor-icons/react';
import api from '../utils/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [pendingRegs, setPendingRegs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [password, setPassword] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingRegistrations();
    loadAllUsers();
  }, []);

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
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-title">
              Admin Panel
            </h1>
            <p className="text-base font-medium text-[#4B4B4B]">BISD HUB Administration</p>
          </div>
          <div className="flex gap-4">
            <Button
              data-testid="admin-back-to-app"
              onClick={() => navigate('/')}
              className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-3 rounded-xl"
            >
              Back to App
            </Button>
            <Button
              data-testid="admin-logout"
              onClick={onLogout}
              className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <SignOut size={20} weight="bold" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-white border-2 border-[#111111] rounded-xl p-1 mb-6">
            <TabsTrigger value="pending" data-testid="admin-tab-pending">Pending Registrations ({pendingRegs.length})</TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">All Users ({allUsers.length})</TabsTrigger>
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
                    {allUsers.map((u) => (
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
