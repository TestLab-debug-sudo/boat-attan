import React, { useState, useEffect } from 'react';
import { Menu, Bell, Sun, Clock, Sparkles, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentTab: string;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  show3D: boolean;
  setShow3D: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  currentTab,
  unreadCount = 0,
  onOpenNotifications,
  show3D,
  setShow3D
}) => {
  const { user } = useAuth();
  const [istTime, setIstTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }).format(now);
      setIstTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Workforce pulse, attendance statistics & live desk' },
    employees: { title: 'Employee Directory & Approvals', subtitle: 'Profiles, roster management & admin onboarding approvals' },
    'verify-attendance': { title: 'Attendance Verification Desk', subtitle: 'Manager confirmation of daily employee punch records' },
    attendance: { title: 'Daily Attendance Terminal', subtitle: 'Check-in terminal, real-time board & manual corrections' },
    leave: { title: 'Leave Management', subtitle: 'Time-off requests, balances & manager review portal' },
    calendar: { title: 'Monthly Muster Roll', subtitle: 'Grid calendar muster sheet with color-coded daily tallies' },
    historical: { title: 'Historical Database', subtitle: 'Multi-year archive search (2024–2026+) & performance metrics' },
    reports: { title: 'Reports & Downloads', subtitle: '7 Google Sheets & Microsoft Excel compatible .xlsx exports' },
    notifications: { title: 'Notification Center', subtitle: 'Leave alerts, attendance updates & announcements' },
    settings: { title: 'System Settings & Audit', subtitle: 'Company operational parameters & audit logs' }
  };

  const currentInfo = tabTitles[currentTab] || { title: 'PEACHWAVE System', subtitle: 'Workforce Portal' };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-peach-light/50 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-navy hover:bg-peach-light/40 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-navy leading-tight">
            {currentInfo.title}
          </h2>
          <p className="hidden sm:block text-xs text-navy-muted">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: IST Clock, 3D Toggle, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* IST Clock pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream border border-peach-light text-navy text-xs font-semibold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-coral" />
          <span>{istTime || 'Kolkata IST'}</span>
        </div>

        {/* 3D Scene Toggle */}
        <button
          onClick={() => setShow3D(!show3D)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            show3D
              ? 'bg-gradient-to-r from-peach-light to-peach text-navy border-peach shadow-sm'
              : 'bg-white text-navy-muted border-gray-200 hover:border-peach-light'
          }`}
          title="Toggle 3D Beach Scene"
        >
          <Sparkles className={`w-3.5 h-3.5 ${show3D ? 'text-coral' : 'text-gray-400'}`} />
          <span className="hidden sm:inline">{show3D ? '3D Active' : 'Show 3D'}</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-navy-light hover:text-navy hover:bg-peach-light/30 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-coral rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* User Mini Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-peach-light/60">
          <img
            src={
              user?.employee?.profilePhoto ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={user?.username}
            className="w-9 h-9 rounded-full object-cover border border-peach shadow-sm"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-navy leading-none">
              {user?.employee?.name || user?.username}
            </p>
            <p className="text-[10px] text-coral font-medium mt-0.5">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

