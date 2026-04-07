import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, ChatCircle, PaperPlaneRight, ArrowLeft } from '@phosphor-icons/react';
import api from '../utils/api';

const PendingRegistrationPage = ({ serialNumber }) => {
  const [checkId, setCheckId] = useState('');
  const [status, setStatus] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [helpMessages, setHelpMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const checkStatus = async () => {
    if (!checkId.trim()) { toast.error('Enter your ID number'); return; }
    try {
      const response = await api.get(`/auth/check-registration/${checkId}`);
      setStatus(response.data);
      if (response.data.status === 'approved') {
        toast.success('Your registration has been approved! You can login now.');
      }
    } catch (error) {
      toast.error('Failed to check status');
    }
  };

  useEffect(() => {
    if (showChat && status?.reg_id) loadHelpMessages();
  }, [showChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [helpMessages]);

  const loadHelpMessages = async () => {
    try {
      const response = await api.get(`/help-chat/${status.reg_id}/messages`);
      setHelpMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !status?.reg_id) return;
    try {
      await api.post(`/help-chat/${status.reg_id}/message`, {
        sender_id: checkId,
        content: newMessage
      });
      setNewMessage('');
      loadHelpMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] p-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFF4E5] border-4 border-[#111111] rounded-full mb-4">
            <Clock size={40} weight="bold" className="text-[#F59E0B]" />
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {status?.status === 'rejected' ? 'Registration Rejected' : 'Registration Pending'}
          </h1>
          
          {serialNumber && (
            <div className="bg-[#E8E6F4] border-2 border-[#111111] rounded-xl p-3 mb-4 inline-block">
              <p className="text-sm"><span className="font-bold">Application #:</span> {serialNumber}</p>
            </div>
          )}

          <p className="text-[#4B4B4B] mb-4 text-sm">
            {status?.status === 'rejected' 
              ? 'Your registration was not approved.' 
              : 'Your registration is being reviewed by an admin. Please check back later.'}
          </p>

          {status?.status === 'rejected' && status?.rejection_reason && (
            <div className="bg-[#FF6B6B] text-white border-2 border-[#111111] rounded-xl p-3 mb-4 text-left">
              <p className="text-xs font-bold mb-1">Reason:</p>
              <p className="text-sm">{status.rejection_reason}</p>
            </div>
          )}

          {!status && (
            <div className="flex gap-2 mb-4">
              <Input value={checkId} onChange={(e) => setCheckId(e.target.value)}
                placeholder="Enter your ID number to check status"
                className="border-2 border-[#111111] rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                onKeyDown={(e) => e.key === 'Enter' && checkStatus()} />
              <Button onClick={checkStatus}
                className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 rounded-xl text-sm">
                Check
              </Button>
            </div>
          )}

          {status?.status === 'approved' && (
            <Button onClick={() => navigate('/login')}
              className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-6 py-2 rounded-xl text-sm mb-2">
              Go to Login
            </Button>
          )}

          <div className="flex gap-3 justify-center">
            {(status?.status === 'rejected' || status?.status === 'pending') && (
              <Button onClick={() => setShowChat(!showChat)}
                className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <ChatCircle size={16} weight="bold" /> Contact Admin
              </Button>
            )}
            <Button onClick={() => navigate('/login')}
              className="bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
              <ArrowLeft size={16} weight="bold" /> Back to Login
            </Button>
          </div>
        </div>

        {showChat && status?.reg_id && (
          <div className="mt-4 bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-4">
            <h3 className="font-black text-sm mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Help Chat</h3>
            <ScrollArea className="h-48 mb-3">
              <div className="space-y-2">
                {helpMessages.map((msg) => (
                  <div key={msg.message_id} className={`flex ${msg.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.sender_type === 'admin'
                        ? 'bg-[#A7F3D0] rounded-bl-sm'
                        : 'bg-[#2563EB] text-white rounded-br-sm'
                    }`}>
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="border-2 border-[#111111] rounded-xl px-3 py-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]" />
              <Button onClick={sendMessage}
                className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] font-bold px-4 rounded-xl">
                <PaperPlaneRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRegistrationPage;
