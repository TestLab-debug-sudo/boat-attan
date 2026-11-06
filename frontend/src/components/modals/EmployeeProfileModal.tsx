import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Briefcase
} from 'lucide-react';
import { employeeService } from '../../services/api.js';

interface EmployeeProfileModalProps {
  employeeId: string;
  onClose: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employeeId,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'details'>('attendance');

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        setLoading(true);
        const res = await employeeService.getById(employeeId);
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load employee dossier:', err);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) {
      fetchDossier();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-10 h-10 border-4 border-peach border-t-coral rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-navy">Loading Employee Dossier...</p>
        </div>
      </div>
    );
  }

  const emp = data?.employee;
  const stats = data?.stats;
  const attendance = data?.recentAttendance || [];
  const leaves = data?.leaveHistory || [];

  return (
    <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-peach-light max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header Banner */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-navy-muted hover:text-navy text-xl font-bold p-1 rounded-full hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={emp?.profilePhoto}
              alt={emp?.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-peach shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-xl text-navy">
                  {emp?.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-peach-50 text-coral border border-peach-light">
                  {emp?.employeeId}
                </span>
              </div>
              <p className="text-xs font-semibold text-ocean-deep">{emp?.designation}</p>
              <p className="text-xs text-navy-muted mt-0.5">
                {emp?.department} • Joined {new Date(emp?.dateOfJoining).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-around sm:justify-end">
            <div className="text-center px-3 py-2 rounded-xl bg-white/80 border border-emerald-200">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Present Days</p>
              <p className="text-lg font-display font-extrabold text-emerald-800">{stats?.totalPresent || 0}</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl bg-white/80 border border-rose-200">
              <p className="text-[10px] font-bold text-rose-700 uppercase">Absences</p>
              <p className="text-lg font-display font-extrabold text-rose-800">{stats?.totalAbsent || 0}</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl bg-white/80 border border-peach-light">
              <p className="text-[10px] font-bold text-coral uppercase">Approved Leaves</p>
              <p className="text-lg font-display font-extrabold text-coral">{stats?.totalLeaves || 0}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-peach-light/60 pb-2 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'attendance'
                ? 'bg-peach-light/60 text-navy border border-peach/60 shadow-xs'
                : 'text-navy-muted hover:text-navy hover:bg-cream'
            }`}
          >
            Recent Attendance ({attendance.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'leaves'
                ? 'bg-peach-light/60 text-navy border border-peach/60 shadow-xs'
                : 'text-navy-muted hover:text-navy hover:bg-cream'
            }`}
          >
            Leave History ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'details'
                ? 'bg-peach-light/60 text-navy border border-peach/60 shadow-xs'
                : 'text-navy-muted hover:text-navy hover:bg-cream'
            }`}
          >
            Personnel & Emergency Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'attendance' && (
            <div className="rounded-xl border border-peach-light/50 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream font-bold text-navy border-b border-peach-light">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Check-In</th>
                    <th className="py-2.5 px-3">Check-Out</th>
                    <th className="py-2.5 px-3">Hours</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-peach-light/30">
                  {attendance.map((att: any) => (
                    <tr key={att._id} className="hover:bg-cream/40">
                      <td className="py-2 px-3 font-semibold text-navy">{att.attendanceDate}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : att.status === 'ABSENT'
                              ? 'bg-gray-100 text-gray-700'
                              : att.status === 'ON_LEAVE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-navy-muted">{att.checkInTimeFormatted || '-'}</td>
                      <td className="py-2 px-3 text-navy-muted">{att.checkOutTimeFormatted || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-navy">{att.workingHours || 0} hrs</td>
                      <td className="py-2 px-3 text-navy-muted truncate max-w-xs">{att.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="rounded-xl border border-peach-light/50 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cream font-bold text-navy border-b border-peach-light">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Days</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-peach-light/30">
                  {leaves.map((l: any) => (
                    <tr key={l._id} className="hover:bg-cream/40">
                      <td className="py-2 px-3 font-semibold text-navy">{l.leaveType}</td>
                      <td className="py-2 px-3 text-navy-muted">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="py-2 px-3 font-bold text-navy">{l.totalDays}</td>
                      <td className="py-2 px-3 text-navy-muted max-w-xs truncate">{l.reason}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.approvalStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {l.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-navy-muted">
                        No previous leave records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-cream/70 border border-peach-light/60 space-y-2">
                <p className="font-bold text-navy uppercase text-[11px] mb-2">Contact & Location</p>
                <div className="flex items-center gap-2 text-navy-muted">
                  <Phone className="w-3.5 h-3.5 text-coral" />
                  <span>{emp?.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-navy-muted">
                  <Mail className="w-3.5 h-3.5 text-coral" />
                  <span>{emp?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-navy-muted">
                  <MapPin className="w-3.5 h-3.5 text-coral" />
                  <span>{emp?.address || 'No address specified'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream/70 border border-peach-light/60 space-y-2">
                <p className="font-bold text-navy uppercase text-[11px] mb-2">Emergency Contact</p>
                <p className="font-semibold text-navy">
                  {emp?.emergencyContact?.name || 'None listed'} (
                  {emp?.emergencyContact?.relationship || 'Contact'})
                </p>
                <div className="flex items-center gap-2 text-navy-muted">
                  <Phone className="w-3.5 h-3.5 text-ocean-deep" />
                  <span>{emp?.emergencyContact?.phone || '-'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cream/70 border border-peach-light/60 space-y-2">
                <p className="font-bold text-navy uppercase text-[11px] mb-2">Work Shift & Schedule</p>
                <p className="font-semibold text-navy">Shift Timing: {emp?.shiftTiming || '09:00 AM - 05:30 PM'}</p>
                <p className="text-navy-muted">Timezone: Asia/Kolkata (IST)</p>
                <p className="text-navy-muted">Weekly Off: Sunday</p>
              </div>

              <div className="p-4 rounded-xl bg-cream/70 border border-peach-light/60 space-y-2">
                <p className="font-bold text-navy uppercase text-[11px] mb-2">System Credentials</p>
                <p className="text-navy-muted">Portal User ID: {emp?.employeeId?.toLowerCase()}</p>
                <p className="text-navy-muted">Status: {emp?.employmentStatus}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;

