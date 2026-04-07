import React, { useState, useEffect } from 'react';
import { Bell } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ user, ws }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Listen for real-time notifications via WebSocket
    if (ws) {
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.notification_id) {
            // New notification received
            loadNotifications();
            loadUnreadCount();
          }
        } catch (e) {
          // Not a notification message
        }
      };

      ws.addEventListener('message', handleMessage);
      return () => ws.removeEventListener('message', handleMessage);
    }
  }, [ws]);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications', { params: { limit: 20 } });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Could navigate to post view if implemented
      setOpen(false);
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.from_user?.id_number}`);
      setOpen(false);
    } else if (notification.type === 'dm') {
      navigate('/');
      // Could switch to DM tab
      setOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'dm':
        return '✉️';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          data-testid="notification-bell"
          className="relative bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold p-3 rounded-xl"
        >
          <Bell size={24} weight="bold" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#FF6B6B] text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-[#111111]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0 bg-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] rounded-xl">
        <div className="p-4 border-b-2 border-[#111111]">
          <h3 className="font-black text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>Notifications</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#4B4B4B]">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  data-testid={`notification-${notification.notification_id}`}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-[#D1D1D1] cursor-pointer hover:bg-[#A7F3D0] transition-colors ${
                    !notification.read ? 'bg-[#E6F4EA]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">{notification.content}</p>
                      <p className="text-xs text-[#4B4B4B]">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#2563EB] rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
