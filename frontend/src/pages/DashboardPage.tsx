import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  Clock,
  Home,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Building,
  ArrowUpRight,
  Sparkles,
  Phone
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import confetti from 'canvas-confetti';
import { dashboardService, attendanceService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface DashboardPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
  onNavigateTab: (tab: string) => void;
}

const PIE_COLORS = ['#FF8A75', '#287D91', '#FFBFA3', '#8EDCE6', '#9B51E0', '#F2994A', '#27AE60', '#2D9CDB'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenEmployeeProfile,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, liveRes] = await Promise.all([
        dashboardService.getStats(),
        attendanceService.getTodayLive()
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (liveRes.data?.success) setLiveData(liveRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Check In / Check Out Handler
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceService.checkIn({
        employeeId: user?.employee?._id
      });
      if (res.data?.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setActionMessage(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceService.checkOut({
        employeeId: user?.employee?._id
      });
      if (res.data?.success) {
        setActionMessage(res.data.message);
        await fetchData();
      }
    } catch (err: any) {
      setActionMessage(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Check today's status for the current user
  const myTodayRecord = liveData?.records?.find(
    (r: any) => r._id === user?.employee?._id || r.employeeId === user?.employee?.employeeId
  );

  const pendingAttendanceCount = (liveData?.records || []).filter((r: any) => r.approvalStatus === 'PENDING_APPROVAL').length;
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* 1. Quick Personal Check-in Bar & Manager Approval Alert */}
      <div className="space-y-3">
        {/* Manager/Admin Notice when there are pending punches */}
        {isManagerOrAdmin && pendingAttendanceCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <p className="text-xs font-bold text-navy">
                <span className="text-amber-800">{pendingAttendanceCount} employee attendance punch(es)</span> waiting for Manager verification & approval.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('verify-attendance')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              Verify Attendance Now →
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-coral shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-navy">
                  Hello, {user?.employee?.name || user?.username}!
                </h3>
                {myTodayRecord?.checkInTime && myTodayRecord.checkInTime !== '-' && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      myTodayRecord.isApproved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {myTodayRecord.isApproved ? '✓ Confirmed by Manager' : '⏳ Awaiting Manager Approval'}
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-muted mt-0.5">
                {myTodayRecord?.checkInTime && myTodayRecord.checkInTime !== '-'
                  ? `Today's Check-in: ${myTodayRecord.checkInTime} (${myTodayRecord.status}). ${
                      myTodayRecord.isApproved ? 'Approved & Recorded in Muster Roll.' : 'Pending confirmation by your manager.'
                    }`
                  : `Cutoff time: ${liveData?.cutoffTime || '10:30'} AM. Please record your daily attendance.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {actionMessage && (
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/90 text-navy border border-peach-light shadow-sm">
                {actionMessage}
              </span>
            )}

            {(!myTodayRecord || myTodayRecord.checkInTime === '-') ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Check-In</span>
              </button>
            ) : !myTodayRecord.checkOutTime || myTodayRecord.checkOutTime === '-' ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Mark Check-Out</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-white/80 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Completed: {myTodayRecord.workingHours} hrs ({myTodayRecord.isApproved ? 'Confirmed' : 'Pending Review'})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top 6 Key Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Employees */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-navy-muted mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-navy-muted" />
          </div>
          <p className="text-2xl font-display font-extrabold text-navy">
            {stats?.cards?.totalEmployees || 0}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Active</p>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-display font-extrabold text-emerald-700">
            {stats?.cards?.presentToday || 0}
          </p>
          <p className="text-[10px] text-navy-muted font-medium mt-1">
            {stats?.cards?.lateToday > 0 ? `Incl. ${stats.cards.lateToday} Late` : 'On schedule'}
          </p>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent Today</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-display font-extrabold text-rose-700">
            {stats?.cards?.absentToday || 0}
          </p>
          <p className="text-[10px] text-navy-muted font-medium mt-1">No attendance yet</p>
        </div>

        {/* On Leave Today */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-coral mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">On Leave</span>
            <CalendarCheck className="w-4 h-4 text-coral" />
          </div>
          <p className="text-2xl font-display font-extrabold text-coral">
            {stats?.cards?.onLeaveToday || 0}
          </p>
          <p className="text-[10px] text-navy-muted font-medium mt-1">Approved leaves</p>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Leaves</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-display font-extrabold text-amber-700">
            {stats?.cards?.pendingLeavesCount || 0}
          </p>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Action required</p>
        </div>

        {/* Work From Home */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="cursor-pointer p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all"
        >
          <div className="flex items-center justify-between text-ocean-deep mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">WFH Today</span>
            <Home className="w-4 h-4 text-ocean-deep" />
          </div>
          <p className="text-2xl font-display font-extrabold text-ocean-deep">
            {stats?.cards?.wfhToday || 0}
          </p>
          <p className="text-[10px] text-navy-muted font-medium mt-1">Remote desk</p>
        </div>
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Attendance Trend Chart */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-navy">Monthly Attendance Trend</h3>
              <p className="text-xs text-navy-muted">Real-time aggregated historical record from MongoDB</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-peach-50 text-coral text-xs font-bold border border-peach-light">
              6-Month Rolling
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27AE60" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A75" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF8A75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E5DF" />
                <XAxis dataKey="month" stroke="#5F7589" fontSize={11} />
                <YAxis stroke="#5F7589" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #FFE0D0',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#27AE60" strokeWidth={2} fillOpacity={1} fill="url(#presentGrad)" name="Present Days" />
                <Area type="monotone" dataKey="leave" stroke="#FF8A75" strokeWidth={2} fillOpacity={1} fill="url(#leaveGrad)" name="Approved Leaves" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Distribution */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-navy">Department Headcount</h3>
            <p className="text-xs text-navy-muted">Workforce allocation by operational wing</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.departmentBreakdown || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(stats?.departmentBreakdown || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-peach-light/40">
            {(stats?.departmentBreakdown || []).slice(0, 4).map((d: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-navy">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="truncate">{d.name}</span>
                <span className="font-bold text-navy-muted ml-auto">({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Employee Activity Desk */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-base text-navy flex items-center gap-2">
              <span>Live Attendance Desk</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                Today ({liveData?.date})
              </span>
            </h3>
            <p className="text-xs text-navy-muted">Real-time check-in tracker with employee profiles</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('calendar')}
              className="text-xs font-semibold text-coral hover:text-coral-hover flex items-center gap-1"
            >
              <span>View Full Muster Roll</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Employee Table */}
        <div className="overflow-x-auto rounded-xl border border-peach-light/50">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Check-In</th>
                <th className="py-3 px-4 text-center">Check-Out</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {liveData?.records?.map((rec: any) => {
                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                    {rec.status}
                  </span>
                );

                if (rec.status === 'PRESENT') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Present
                    </span>
                  );
                } else if (rec.status === 'LATE_ARRIVAL') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      Late Arrival
                    </span>
                  );
                } else if (rec.status === 'ON_LEAVE') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                      On Leave
                    </span>
                  );
                } else if (rec.status === 'WORK_FROM_HOME') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                      WFH
                    </span>
                  );
                } else if (rec.status === 'HALF_DAY') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
                      Half Day
                    </span>
                  );
                }

                return (
                  <tr
                    key={rec._id}
                    className="hover:bg-cream/50 transition-colors cursor-pointer group"
                    onClick={() => onOpenEmployeeProfile(rec._id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rec.profilePhoto}
                          alt={rec.name}
                          className="w-9 h-9 rounded-full object-cover border border-peach shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-navy group-hover:text-coral transition-colors">
                            {rec.name}
                          </p>
                          <p className="text-[11px] text-navy-muted">{rec.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-navy-muted font-medium">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-peach-dark" />
                        <span>{rec.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">{rec.designation}</td>
                    <td className="py-3 px-4 text-navy-muted">{rec.department}</td>
                    <td className="py-3 px-4 text-center">{statusBadge}</td>
                    <td className="py-3 px-4 text-center font-medium text-navy">
                      {rec.checkInTime || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-navy">
                      {rec.checkOutTime || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEmployeeProfile(rec._id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-peach-50 hover:bg-peach-light text-coral font-bold text-xs transition-colors"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

