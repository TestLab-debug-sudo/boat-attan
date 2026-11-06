import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import LoginPage from './pages/LoginPage.js';
import DashboardPage from './pages/DashboardPage.js';
import EmployeesPage from './pages/EmployeesPage.js';
import AttendancePage from './pages/AttendancePage.js';
import AttendanceApprovalsPage from './pages/AttendanceApprovalsPage.js';
import LeaveManagementPage from './pages/LeaveManagementPage.js';
import MonthlyCalendarPage from './pages/MonthlyCalendarPage.js';
import HistoricalRecordsPage from './pages/HistoricalRecordsPage.js';
import ReportsDownloadsPage from './pages/ReportsDownloadsPage.js';
import NotificationsPage from './pages/NotificationsPage.js';
import SettingsPage from './pages/SettingsPage.js';
import Sidebar from './components/layout/Sidebar.js';
import Header from './components/layout/Header.js';
import PeachBeachCanvas from './components/three/PeachBeachCanvas.js';
import EmployeeProfileModal from './components/modals/EmployeeProfileModal.js';
import { notificationService, employeeService } from './services/api.js';
import { Employee } from './types/index.js';

export const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [show3D, setShow3D] = useState<boolean>(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // Fetch unread count, employee list and pending approvals periodically
  useEffect(() => {
    if (!token) return;

    const loadMeta = async () => {
      try {
        const [notifRes, empRes] = await Promise.all([
          notificationService.getAll(),
          employeeService.getAll()
        ]);
        if (notifRes.data?.success) {
          setUnreadCount(notifRes.data.unreadCount || 0);
        }
        if (empRes.data?.success) {
          setAllEmployees(empRes.data.data || []);
          setPendingApprovalsCount(empRes.data.pendingApprovalsCount || 0);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };

    loadMeta();
    const interval = setInterval(loadMeta, 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-peach border-t-coral rounded-full animate-spin mb-4" />
        <h2 className="font-display font-bold text-lg text-navy">Loading PEACHWAVE...</h2>
        <p className="text-xs text-navy-muted mt-1">Connecting to Workforce Gateway</p>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginPage />;
  }

  const handleDownloadMonthlyExcel = (year: number, month: number) => {
    const link = document.createElement('a');
    link.href = `/api/export/monthly?year=${year}&month=${month}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHistoryExcel = () => {
    const link = document.createElement('a');
    link.href = '/api/export/history';
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        unreadCount={unreadCount}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentTab={currentTab}
          unreadCount={unreadCount}
          onOpenNotifications={() => setCurrentTab('notifications')}
          show3D={show3D}
          setShow3D={setShow3D}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Optional 3D Beach Scene Showcase */}
          {show3D && (
            <div className="transition-all duration-500 animate-fadeIn">
              <PeachBeachCanvas compact={currentTab !== 'dashboard'} />
            </div>
          )}

          {/* Active Tab Page Rendering */}
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenEmployeeProfile={(id) => setSelectedProfileId(id)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesPage onOpenEmployeeProfile={(id) => setSelectedProfileId(id)} />
          )}

          {currentTab === 'verify-attendance' && (
            <AttendanceApprovalsPage onOpenEmployeeProfile={(id) => setSelectedProfileId(id)} />
          )}

          {currentTab === 'attendance' && (
            <AttendancePage onOpenEmployeeProfile={(id) => setSelectedProfileId(id)} />
          )}

          {currentTab === 'leave' && (
            <LeaveManagementPage onOpenEmployeeProfile={(id) => setSelectedProfileId(id)} />
          )}

          {currentTab === 'calendar' && (
            <MonthlyCalendarPage
              onOpenEmployeeProfile={(id) => setSelectedProfileId(id)}
              onDownloadMonthlyExcel={handleDownloadMonthlyExcel}
            />
          )}

          {currentTab === 'historical' && (
            <HistoricalRecordsPage
              onOpenEmployeeProfile={(id) => setSelectedProfileId(id)}
              onDownloadHistoryExcel={handleDownloadHistoryExcel}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsDownloadsPage employees={allEmployees} />
          )}

          {currentTab === 'notifications' && (
            <NotificationsPage onNavigateTab={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Employee Dossier / Profile Modal */}
      {selectedProfileId && (
        <EmployeeProfileModal
          employeeId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
};

export default App;
