import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Bell } from '@phosphor-icons/react';
import api from '../utils/api';

const NotificationBell = ({ user, ws }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { loadNotifications(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!ws) return;
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Browser push notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('BISD HUB', { body: data.notification.content, icon: '/favicon.ico' });
          }
        }
      } catch (e) {}
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws]);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) { console.error('Failed to load notifications'); }
  };

  const markAsRead = async (notif) => {
    try {
      await api.put(`/notifications/${notif.notification_id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {}

    // Navigate based on notification type
    setShowDropdown(false);
    if (notif.target_url) {
      navigate(notif.target_url);
    } else if (notif.post_id) {
      navigate('/'); // Go to feed
    } else if (notif.type === 'follow' || notif.type === 'friend_request' || notif.type === 'friend_accept') {
      // Navigate to the user who triggered it
      try {
        const res = await api.get(`/users/by-id/${notif.from_user_id}`);
        if (res.data?.id_number) navigate(`/profile/${res.data.id_number}`);
      } catch (e) { navigate('/settings'); }
    } else if (notif.type === 'dm') {
      navigate('/'); // Will need to switch to DM tab
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 rounded-lg" style={{ color: 'var(--text-1)' }}
        data-testid="notification-bell">
        <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'bold'} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center"
            style={{ background: 'var(--red)' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="heading text-sm font-bold" style={{ color: 'var(--text-1)' }}>Notifications</h3>
          </div>
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs" style={{ color: 'var(--text-3)' }}>No notifications yet</p>
            ) : (
              notifications.map((notif) => (
                <button key={notif.notification_id} data-testid={`notification-${notif.notification_id}`}
                  onClick={() => markAsRead(notif)}
                  className="w-full text-left p-3 border-b flex items-start gap-3 hover:opacity-80 transition-opacity"
                  style={{ borderColor: 'var(--border)', background: notif.read ? 'transparent' : 'var(--bg-surface)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-1)' }}>{notif.content}</p>
                    <p className="text-[10px] mt-0.5 badge-mono" style={{ color: 'var(--text-3)' }}>{formatTime(notif.created_at)}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: 'var(--blue)' }} />}
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
