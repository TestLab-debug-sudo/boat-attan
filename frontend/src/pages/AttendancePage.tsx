import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Sun,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Sparkles,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { attendanceService, employeeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Employee } from '../types/index.js';

interface AttendancePageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onOpenEmployeeProfile }) => {
  const { user } = useAuth();
  const [liveData, setLiveData] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Manual Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    checkInTimeFormatted: '09:00 AM',
    checkOutTimeFormatted: '05:30 PM',
    workingHours: 8.5,
    correctionReason: '',
    remarks: 'Administrative update'
  });
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLiveAttendance = async () => {
    try {
      setLoading(true);
      const [liveRes, empRes] = await Promise.all([
        attendanceService.getTodayLive(),
        employeeService.getAll()
      ]);
      if (liveRes.data?.success) setLiveData(liveRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAttendance();
  }, []);

  const handleCheckIn = async (targetEmpId?: string) => {
    try {
      setActionLoading(true);
      const empId = targetEmpId || user?.employee?._id;
      const res = await attendanceService.checkIn({ employeeId: empId });
      if (res.data?.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setMessage(res.data.message);
        await fetchLiveAttendance();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleCheckOut = async (targetEmpId?: string) => {
    try {
      setActionLoading(true);
      const empId = targetEmpId || user?.employee?._id;
      const res = await attendanceService.checkOut({ employeeId: empId });
      if (res.data?.success) {
        setMessage(res.data.message);
        await fetchLiveAttendance();
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleOpenCorrection = (record?: any) => {
    setCorrectionForm({
      employeeId: record?._id || employees[0]?._id || '',
      attendanceDate: liveData?.date || new Date().toISOString().split('T')[0],
      status: record?.status || 'PRESENT',
      checkInTimeFormatted: record?.checkInTime && record.checkInTime !== '-' ? record.checkInTime : '09:00 AM',
      checkOutTimeFormatted: record?.checkOutTime && record.checkOutTime !== '-' ? record.checkOutTime : '05:30 PM',
      workingHours: record?.workingHours || 8.5,
      correctionReason: '',
      remarks: 'Admin verified punch'
    });
    setCorrectionError(null);
    setShowCorrectionModal(true);
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.correctionReason.trim()) {
      setCorrectionError('Audit correction reason is required');
      return;
    }

    try {
      setCorrectionSubmitting(true);
      setCorrectionError(null);
      await attendanceService.manualCorrect(correctionForm);
      setShowCorrectionModal(false);
      await fetchLiveAttendance();
      setMessage('Attendance corrected and audit log created.');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setCorrectionError(err.response?.data?.message || 'Correction failed');
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  const filteredRecords = (liveData?.records || []).filter((r: any) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase()) ||
      r.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Top Banner with Today's Cutoff Info & Manual Action */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Daily Attendance Terminal
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-50 text-coral font-bold text-xs border border-peach-light">
              IST Cutoff: {liveData?.cutoffTime || '10:30'} AM
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Check-ins submitted after {liveData?.cutoffTime || '10:30'} AM are automatically flagged as Late Arrival.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {message && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-navy border border-peach-light shadow-sm">
              {message}
            </span>
          )}

          {canManage && (
            <button
              onClick={() => handleOpenCorrection()}
              className="px-4 py-2 rounded-xl bg-white hover:bg-peach-50 text-navy font-bold text-xs border border-peach-light shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-coral" />
              <span>Admin Override & Audit</span>
            </button>
          )}

          <button
            onClick={fetchLiveAttendance}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-peach-50 text-navy border border-peach-light transition-colors"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
        <div className="p-3 rounded-xl bg-white/80 border border-peach-light shadow-xs">
          <p className="text-[10px] font-bold text-navy-muted uppercase">Total Staff</p>
          <p className="text-xl font-display font-extrabold text-navy">{liveData?.summary?.totalEmployees || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-emerald-200 shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Present</p>
          <p className="text-xl font-display font-extrabold text-emerald-800">{liveData?.summary?.presentCount || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-amber-200 shadow-xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase">Late Arrivals</p>
          <p className="text-xl font-display font-extrabold text-amber-800">{liveData?.summary?.lateCount || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-rose-200 shadow-xs">
          <p className="text-[10px] font-bold text-rose-700 uppercase">Absent</p>
          <p className="text-xl font-display font-extrabold text-rose-800">{liveData?.summary?.absentCount || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-peach-light shadow-xs">
          <p className="text-[10px] font-bold text-coral uppercase">On Leave</p>
          <p className="text-xl font-display font-extrabold text-coral">{liveData?.summary?.onLeaveCount || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-blue-200 shadow-xs">
          <p className="text-[10px] font-bold text-ocean-deep uppercase">WFH</p>
          <p className="text-xl font-display font-extrabold text-ocean-deep">{liveData?.summary?.wfhCount || 0}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/80 border border-orange-200 shadow-xs">
          <p className="text-[10px] font-bold text-orange-700 uppercase">Half Day</p>
          <p className="text-xl font-display font-extrabold text-orange-800">{liveData?.summary?.halfDayCount || 0}</p>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, ID, rank..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream/70 border border-peach-light focus:border-coral focus:ring-2 focus:ring-coral/20 text-xs text-navy outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-cream/70 border border-peach-light text-xs font-semibold text-navy outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE_ARRIVAL">Late Arrival</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="WORK_FROM_HOME">Work From Home</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto rounded-xl border border-peach-light/50">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Rank</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Check-In</th>
                <th className="py-3 px-4 text-center">Check-Out</th>
                <th className="py-3 px-4 text-center">Working Hours</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {filteredRecords.map((rec: any) => (
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'LATE_ARRIVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : rec.status === 'ABSENT'
                          ? 'bg-gray-100 text-gray-700'
                          : rec.status === 'ON_LEAVE'
                          ? 'bg-rose-100 text-rose-800'
                          : rec.status === 'WORK_FROM_HOME'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-navy">
                    {rec.checkInTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-navy">
                    {rec.checkOutTime || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-navy">
                    {rec.workingHours ? `${rec.workingHours} hrs` : '-'}
                  </td>
                  <td className="py-3 px-4 text-navy-muted max-w-xs truncate">
                    {rec.remarks || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Check In action for today */}
                      {(!rec.checkInTime || rec.checkInTime === '-') && (
                        <button
                          onClick={() => handleCheckIn(rec._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs"
                        >
                          Punch In
                        </button>
                      )}

                      {/* Check Out action if checked in */}
                      {rec.checkInTime && rec.checkInTime !== '-' && (!rec.checkOutTime || rec.checkOutTime === '-') && (
                        <button
                          onClick={() => handleCheckOut(rec._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-coral/10 hover:bg-coral/20 text-coral font-bold text-xs"
                        >
                          Punch Out
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() => handleOpenCorrection(rec)}
                          className="p-1 rounded-lg text-navy-muted hover:text-navy hover:bg-peach-light/40"
                          title="Correct Entry"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Manual Correction & Audit Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-peach-light max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-peach-light/50 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-coral" />
                <h3 className="font-display font-bold text-lg text-navy">
                  Manual Attendance Override
                </h3>
              </div>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="text-navy-muted hover:text-navy text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {correctionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {correctionError}
              </div>
            )}

            <form onSubmit={handleCorrectionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-navy uppercase mb-1">Target Employee *</label>
                <select
                  value={correctionForm.employeeId}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none font-semibold"
                >
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} ({e.employeeId}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Attendance Date *</label>
                  <input
                    type="date"
                    value={correctionForm.attendanceDate}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, attendanceDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Corrected Status *</label>
                  <select
                    value={correctionForm.status}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none font-bold"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE_ARRIVAL">LATE ARRIVAL</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="WORK_FROM_HOME">WORK FROM HOME</option>
                    <option value="HALF_DAY">HALF DAY</option>
                    <option value="WEEKLY_OFF">WEEKLY OFF</option>
                    <option value="HOLIDAY">HOLIDAY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Check-in</label>
                  <input
                    type="text"
                    value={correctionForm.checkInTimeFormatted}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTimeFormatted: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Check-out</label>
                  <input
                    type="text"
                    value={correctionForm.checkOutTimeFormatted}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutTimeFormatted: e.target.value })}
                    placeholder="05:30 PM"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={correctionForm.workingHours}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, workingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase mb-1 text-coral">
                  Audit Correction Reason * (Mandatory for System Audit Trail)
                </label>
                <textarea
                  value={correctionForm.correctionReason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                  required
                  rows={2}
                  placeholder="e.g. Employee biometric scanner glitch confirmed by HR"
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none focus:border-coral"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-peach-light/40">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-navy font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-peach-soft disabled:opacity-50"
                >
                  {correctionSubmitting ? 'Recording Audit...' : 'Save & Audit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

