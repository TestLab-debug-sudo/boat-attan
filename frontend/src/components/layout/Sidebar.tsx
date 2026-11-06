import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  Database,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  Waves,
  ShieldCheck,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadCount?: number;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  unreadCount = 0,
  pendingApprovalsCount = 0
}) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'EMPLOYEE';

  // Role-specific navigation items
  let navItems: Array<{
    id: string;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }> = [];

  if (role === 'ADMIN') {
    navItems = [
      { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
      { id: 'employees', label: 'Employees & Approvals', icon: Users, badge: pendingApprovalsCount, badgeColor: 'bg-coral' },
      { id: 'verify-attendance', label: 'Attendance Approvals', icon: UserCheck },
      { id: 'attendance', label: 'Daily Attendance', icon: Clock },
      { id: 'leave', label: 'Leave Management', icon: CalendarDays },
      { id: 'calendar', label: 'Monthly Muster Roll', icon: CalendarRange },
      { id: 'historical', label: 'Historical Database', icon: Database },
      { id: 'reports', label: 'Reports & Downloads', icon: FileSpreadsheet },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-coral' },
      { id: 'settings', label: 'Settings & Audit', icon: Settings }
    ];
  } else if (role === 'MANAGER') {
    navItems = [
      { id: 'dashboard', label: 'Team Dashboard', icon: LayoutDashboard },
      { id: 'verify-attendance', label: 'Attendance Approvals', icon: UserCheck },
      { id: 'employees', label: 'Team Directory & Onboard', icon: Users },
      { id: 'leave', label: 'Leave Approvals', icon: CalendarDays },
      { id: 'attendance', label: 'Daily Punch Terminal', icon: Clock },
      { id: 'calendar', label: 'Monthly Muster Roll', icon: CalendarRange },
      { id: 'reports', label: 'Reports & Downloads', icon: FileSpreadsheet },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-coral' }
    ];
  } else {
    // EMPLOYEE role
    navItems = [
      { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { id: 'attendance', label: 'Daily Attendance Punch', icon: Clock },
      { id: 'leave', label: 'Apply & View Leaves', icon: CalendarDays },
      { id: 'calendar', label: 'My Monthly Calendar', icon: CalendarRange },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, badgeColor: 'bg-coral' }
    ];
  }

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-peach-light/60 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 border-b border-peach-light/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-peach via-coral to-ocean flex items-center justify-center shadow-peach-soft text-white">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-navy tracking-tight leading-none">
                PEACH<span className="text-coral">WAVE</span>
              </h1>
              <p className="text-[11px] font-medium text-navy-muted tracking-wide mt-1">
                {role === 'ADMIN' ? 'Admin Controller' : role === 'MANAGER' ? 'Manager Workspace' : 'Employee Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-peach-light to-peach-50 text-navy font-semibold shadow-sm border border-peach/50'
                    : 'text-navy-light hover:bg-cream hover:text-navy'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-coral' : 'text-navy-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${item.badgeColor || 'bg-coral'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-peach-light/50 bg-cream-light/60">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={
                user?.employee?.profilePhoto ||
                `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`
              }
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-peach shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy truncate">
                {user?.employee?.name || user?.username}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                    user?.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : user?.role === 'MANAGER'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {user?.role}
                </span>
                <span className="text-[11px] text-navy-muted truncate">
                  {user?.employee?.employeeId || 'ID: Staff'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-coral hover:bg-coral/10 rounded-lg transition-colors border border-coral/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
