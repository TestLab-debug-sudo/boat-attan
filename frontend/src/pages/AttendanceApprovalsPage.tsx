import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { attendanceService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface AttendanceApprovalsPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
}

export const AttendanceApprovalsPage: React.FC<AttendanceApprovalsPageProps> = ({
  onOpenEmployeeProfile
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'APPROVED'>('PENDING');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getTodayLive({ date: selectedDate });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load attendance verification list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const handleApprovePunch = async (attId: string, empName: string) => {
    try {
      setActionLoading(true);
      const res = await attendanceService.approvePunch(attId, 'APPROVED', 'Verified by Manager');
      if (res.data?.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setMessage(`Attendance confirmed for ${empName}!`);
        await fetchAttendance();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRejectPunch = async (attId: string, empName: string) => {
    const reason = window.prompt(`Enter reason for rejecting ${empName}'s punch:`, 'Invalid punch / absent from desk');
    if (reason === null) return;

    try {
      setActionLoading(true);
      const res = await attendanceService.approvePunch(attId, 'REJECTED', reason);
      if (res.data?.success) {
        setMessage(`Punch rejected for ${empName}.`);
        await fetchAttendance();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBulkApprove = async () => {
    if (!window.confirm(`Confirm all pending employee attendance punches for ${selectedDate}?`)) return;

    try {
      setActionLoading(true);
      const res = await attendanceService.bulkApprove(selectedDate);
      if (res.data?.success) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setMessage(res.data.message);
        await fetchAttendance();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Bulk approval failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const records = data?.records || [];
  const pendingCount = records.filter((r: any) => r.approvalStatus === 'PENDING_APPROVAL').length;
  const approvedCount = records.filter((r: any) => r.isApproved).length;

  const filteredRecords = records.filter((r: any) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filterMode === 'PENDING') {
      matchesFilter = r.approvalStatus === 'PENDING_APPROVAL';
    } else if (filterMode === 'APPROVED') {
      matchesFilter = r.isApproved === true;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Attendance Verification & Confirmation Desk
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300">
              {pendingCount} Pending Manager Approval
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Employees mark daily attendance; Managers review the check-in time and verify punches to confirm attendance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {message && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-navy border border-peach-light shadow-sm">
              {message}
            </span>
          )}

          {pendingCount > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All ({pendingCount})</span>
            </button>
          )}

          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-peach-50 text-navy border border-peach-light transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="font-bold text-navy uppercase text-[11px]">Audit Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light font-bold text-navy outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filter Mode buttons */}
          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterMode === 'PENDING'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-cream text-navy-muted hover:text-navy'
            }`}
          >
            Pending Verification ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('APPROVED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterMode === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-cream text-navy-muted hover:text-navy'
            }`}
          >
            Confirmed Punches ({approvedCount})
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterMode === 'ALL'
                ? 'bg-navy text-white'
                : 'bg-cream text-navy-muted hover:text-navy'
            }`}
          >
            All Staff ({records.length})
          </button>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-cream border border-peach-light text-navy outline-none"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4 text-center">Punch Status</th>
                <th className="py-3 px-4 text-center">Check-In</th>
                <th className="py-3 px-4 text-center">Check-Out</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4 text-center">Approval State</th>
                <th className="py-3 px-4 text-right">Manager Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {filteredRecords.map((rec: any) => {
                const isPending = rec.approvalStatus === 'PENDING_APPROVAL';
                const isConfirmed = rec.isApproved === true;

                return (
                  <tr key={rec._id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => onOpenEmployeeProfile(rec._id)}
                      >
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
                    <td className="py-3 px-4">
                      <p className="font-semibold text-navy">{rec.designation}</p>
                      <p className="text-[11px] text-navy-muted">{rec.department}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'LATE_ARRIVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'ON_LEAVE'
                            ? 'bg-rose-100 text-rose-800'
                            : rec.status === 'WORK_FROM_HOME'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-navy">
                      {rec.checkInTime || '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-navy-muted">
                      {rec.checkOutTime || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-navy">
                      {rec.workingHours ? `${rec.workingHours}h` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPending ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          Pending Approval
                        </span>
                      ) : isConfirmed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1 mx-auto max-w-fit">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-navy-muted font-medium">
                          {rec.status === 'ABSENT' ? 'Not Punched' : rec.approvalStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.attendanceId && isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprovePunch(rec.attendanceId, rec.name)}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm Punch</span>
                          </button>
                          <button
                            onClick={() => handleRejectPunch(rec.attendanceId, rec.name)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : isConfirmed ? (
                        <span className="text-[11px] text-emerald-700 font-bold">
                          ✓ Approved {rec.approvedByName ? `by ${rec.approvedByName}` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-navy-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-navy-muted">
                    No attendance records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceApprovalsPage;

