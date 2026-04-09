import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, ChatCircle, PaperPlaneRight, ArrowLeft, PencilSimple, CheckCircle, XCircle } from '@phosphor-icons/react';
import api from '../utils/api';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const PendingRegistrationPage = () => {
  const location = useLocation();
  const { serialNumber, regId, registration, editableUntil } = location.state || {};
  
  const [checkId, setCheckId] = useState('');
  const [status, setStatus] = useState(registration ? { status: 'pending', reg_id: regId, serial_number: serialNumber, registration, editable_until: editableUntil } : null);
  const [showChat, setShowChat] = useState(false);
  const [helpMessages, setHelpMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Countdown timer for edit window
  useEffect(() => {
    if (!status?.editable_until) return;
    const interval = setInterval(() => {
      const deadline = new Date(status.editable_until);
      const now = new Date();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [status?.editable_until]);

  useEffect(() => {
    if (showChat && status?.reg_id) loadHelpMessages();
  }, [showChat]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [helpMessages]);

  const checkStatus = async () => {
    if (!checkId.trim()) { toast.error('Enter your ID number'); return; }
    try {
      const response = await axios.get(`${API_BASE}/auth/check-registration/${checkId}`);
      setStatus(response.data);
      if (response.data.status === 'approved') {
        toast.success('Your registration has been approved! You can login now.');
      }
    } catch (error) { toast.error('Failed to check status'); }
  };

  const loadHelpMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/help-chat/${status.reg_id}/messages`);
      setHelpMessages(response.data);
    } catch (error) { console.error('Failed to load messages'); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !status?.reg_id) return;
    try {
      await axios.post(`${API_BASE}/help-chat/${status.reg_id}/message`, {
        sender_id: checkId || status?.registration?.id_number || 'anonymous',
        content: newMessage
      });
      setNewMessage('');
      loadHelpMessages();
    } catch (error) { toast.error('Failed to send message'); }
  };

  const saveEdit = async () => {
    try {
      const response = await axios.put(`${API_BASE}/auth/registration/${status.reg_id}`, editData);
      toast.success('Registration updated!');
      setStatus(prev => ({ ...prev, registration: response.data.registration }));
      setEditMode(false);
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to update'); }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const reg = status?.registration;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-lg">
        <div className="card p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {/* Status Icon */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{
              background: status?.status === 'rejected' ? 'rgba(239,68,68,0.1)' : status?.status === 'approved' ? 'rgba(34,197,94,0.1)' : 'rgba(250,204,21,0.1)',
              border: `2px solid ${status?.status === 'rejected' ? 'var(--red)' : status?.status === 'approved' ? 'var(--green)' : 'var(--yellow)'}`
            }}>
              {status?.status === 'rejected' ? <XCircle size={32} weight="fill" style={{ color: 'var(--red)' }} /> :
               status?.status === 'approved' ? <CheckCircle size={32} weight="fill" style={{ color: 'var(--green)' }} /> :
               <Clock size={32} weight="fill" style={{ color: 'var(--yellow)' }} />}
            </div>
            <h1 className="heading text-xl font-black" style={{ color: 'var(--text-1)' }}>
              {status?.status === 'rejected' ? 'Registration Rejected' :
               status?.status === 'approved' ? 'Registration Approved!' :
               status ? 'Registration Pending' : 'Check Registration Status'}
            </h1>
          </div>

          {/* Serial Number */}
          {status?.serial_number && (
            <div className="text-center mb-4">
              <span className="badge-mono px-3 py-1.5 rounded-lg inline-block" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                Application #{status.serial_number}
              </span>
            </div>
          )}

          {/* Edit Timer */}
          {status?.status === 'pending' && timeLeft > 0 && (
            <div className="text-center mb-4">
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>Edit window: <span className="font-bold" style={{ color: 'var(--yellow)' }}>{formatTime(timeLeft)}</span> remaining</p>
              <Button onClick={() => { setEditMode(true); setEditData(reg || {}); }} className="btn btn-ghost text-xs mt-1 flex items-center gap-1 mx-auto">
                <PencilSimple size={12} /> Edit Details
              </Button>
            </div>
          )}

          {/* Registration Details */}
          {reg && !editMode && (
            <div className="rounded-xl p-4 mb-4 space-y-2 text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              {[
                ['ID Number', reg.id_number], ['Full Name', reg.full_name], ['Date of Birth', reg.date_of_birth],
                ['Class', reg.current_class], ['Section', reg.section], ['Email', reg.email],
                reg.phone_number && ['Phone', reg.phone_number],
                ['Student Type', reg.is_ex_student ? 'EX Student' : 'Current Student'],
                reg.date_of_leaving && ['Date of Leaving', reg.date_of_leaving],
                reg.last_class && ['Last Class', reg.last_class],
                reg.current_status && ['Current Status', reg.current_status],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: 'var(--text-3)' }}>{label}:</span>
                  <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Edit Mode */}
          {editMode && (
            <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              {['full_name', 'email', 'phone_number'].map(field => (
                <div key={field}>
                  <label className="badge-mono block mb-1" style={{ color: 'var(--text-3)' }}>{field.replace('_',' ')}</label>
                  <Input value={editData[field] || ''} onChange={(e) => setEditData(prev => ({...prev, [field]: e.target.value}))} className="input-styled" />
                </div>
              ))}
              <div className="flex gap-2">
                <Button onClick={() => setEditMode(false)} className="btn btn-ghost flex-1">Cancel</Button>
                <Button onClick={saveEdit} className="btn btn-primary flex-1">Save Changes</Button>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {status?.status === 'rejected' && status?.rejection_reason && (
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--red)' }}>Reason:</p>
              <p className="text-sm" style={{ color: 'var(--text-1)' }}>{status.rejection_reason}</p>
            </div>
          )}

          {/* Check Status Form */}
          {!status && (
            <div className="flex gap-2 mb-4">
              <Input value={checkId} onChange={(e) => setCheckId(e.target.value)} placeholder="Enter your ID number"
                className="input-styled" onKeyDown={(e) => e.key === 'Enter' && checkStatus()} />
              <Button onClick={checkStatus} className="btn btn-primary px-4">Check</Button>
            </div>
          )}

          {status?.status === 'approved' && (
            <Button onClick={() => navigate('/login')} className="w-full btn btn-primary py-3 mb-3">Go to Login</Button>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            {(status?.status === 'rejected' || status?.status === 'pending') && (
              <Button onClick={() => setShowChat(!showChat)} className="btn btn-primary flex items-center gap-1.5">
                <ChatCircle size={14} weight="bold" /> Contact Admin
              </Button>
            )}
            <Button onClick={() => navigate('/login')} className="btn btn-ghost flex items-center gap-1.5">
              <ArrowLeft size={14} weight="bold" /> Back to Login
            </Button>
          </div>
        </div>

        {/* Help Chat */}
        {showChat && status?.reg_id && (
          <div className="card mt-4 p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="heading text-sm font-bold mb-3" style={{ color: 'var(--text-1)' }}>Help Chat</h3>
            <ScrollArea className="h-48 mb-3">
              <div className="space-y-2">
                {helpMessages.map((msg) => (
                  <div key={msg.message_id} className={`flex ${msg.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.sender_type === 'admin' ? 'rounded-bl-sm' : 'rounded-br-sm'
                    }`} style={{
                      background: msg.sender_type === 'admin' ? 'var(--bg-surface)' : 'var(--blue)',
                      color: msg.sender_type === 'admin' ? 'var(--text-1)' : 'white'
                    }}>
                      <p className="text-[10px] font-bold opacity-60 mb-0.5">{msg.sender_type === 'admin' ? 'Admin' : 'You'}</p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="input-styled" />
              <Button onClick={sendMessage} className="btn btn-primary px-3">
                <PaperPlaneRight size={14} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRegistrationPage;
