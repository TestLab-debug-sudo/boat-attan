import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, AlertCircle, Info, Sparkles } from 'lucide-react';
import { notificationService } from '../services/api.js';
import { NotificationItem } from '../types/index.js';

interface NotificationsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigateTab }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAsRead('all');
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (id: string, link?: string) => {
    try {
      await notificationService.markAsRead(id);
      await fetchNotifications();
      if (link) {
        const tab = link.replace('/', '');
        if (tab) onNavigateTab(tab);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Notification & Alert Center
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-50 text-coral font-bold text-xs border border-peach-light">
              Real-Time Feed
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            System updates, leave requests, attendance punch reminders, and administrative announcements.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 rounded-xl bg-white hover:bg-peach-50 text-navy font-bold text-xs border border-peach-light shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-coral" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-navy">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-navy-muted">
            No notifications at this time. You're completely up to date!
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => handleMarkOne(item._id, item.link)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                item.isRead
                  ? 'bg-cream/40 border-peach-light/40 opacity-75'
                  : 'bg-white border-peach-light shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type.includes('LEAVE')
                      ? 'bg-peach-light text-coral'
                      : 'bg-ocean-surface text-ocean-deep'
                  }`}
                >
                  {item.type.includes('LEAVE') ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-navy">{item.title}</h4>
                  <p className="text-xs text-navy-muted mt-0.5">{item.message}</p>
                  <p className="text-[10px] text-navy-muted/70 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-coral shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

