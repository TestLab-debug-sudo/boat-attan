import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { leaveService, employeeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { LeaveApplication, Employee } from '../types/index.js';

interface LeaveManagementPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
}

export const LeaveManagementPage: React.FC<LeaveManagementPageProps> = ({ onOpenEmployeeProfile }) => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    employeeId: user?.employee?._id || '',
    leaveType: 'Casual Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: ''
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Review / Decision Modal State (Manager/Admin)
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [leavesRes, empRes] = await Promise.all([
        leaveService.getAll({ status: statusFilter, leaveType: typeFilter }),
        employeeService.getAll()
      ]);
      if (leavesRes.data?.success) setLeaves(leavesRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  // Handle start and end date calculation
  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    const updated = { ...applyForm, [field]: val };
    const d1 = new Date(updated.startDate);
    const d2 = new Date(updated.endDate);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      updated.totalDays = Math.max(1, diffDays);
    }
    setApplyForm(updated);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      setApplyError('Please provide a reason for the leave');
      return;
    }

    try {
      setApplyLoading(true);
      setApplyError(null);
      await leaveService.apply({
        ...applyForm,
        employeeId: applyForm.employeeId || user?.employee?._id
      });
      setShowApplyModal(false);
      await fetchLeaves();
    } catch (err: any) {
      setApplyError(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      setReviewLoading(true);
      await leaveService.updateStatus(selectedLeave._id, reviewStatus, reviewRemarks);
      setSelectedLeave(null);
      setReviewRemarks('');
      await fetchLeaves();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update leave');
    } finally {
      setReviewLoading(false);
    }
  };

  const canApprove = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Leave balances (Sample quota calculation)
  const balances = [
    { type: 'Casual Leave', total: 12, used: 4, remaining: 8, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { type: 'Sick Leave', total: 10, used: 2, remaining: 8, color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { type: 'Emergency Leave', total: 5, used: 1, remaining: 4, color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { type: 'Personal Leave', total: 6, used: 2, remaining: 4, color: 'bg-peach-50 text-coral border-peach-light' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Action & Leave Balances */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Leave & Time-Off Management
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-50 text-coral font-bold text-xs border border-peach-light">
              Calendar Auto-Sync
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Approved leaves automatically populate in the monthly muster roll calendar. Pending leaves remain yellow.
          </p>
        </div>

        <button
          onClick={() => {
            setApplyForm({
              employeeId: user?.employee?._id || employees[0]?._id || '',
              leaveType: 'Casual Leave',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date().toISOString().split('T')[0],
              totalDays: 1,
              reason: ''
            });
            setApplyError(null);
            setShowApplyModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-peach-soft transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Time-Off</span>
        </button>
      </div>

      {/* Leave Balances Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {balances.map((b, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border shadow-xs ${b.color}`}>
            <p className="text-xs font-bold uppercase tracking-wider">{b.type}</p>
            <div className="flex items-baseline justify-between mt-2">
              <p className="text-2xl font-display font-extrabold">{b.remaining}</p>
              <p className="text-[11px] opacity-75">Used: {b.used} / {b.total} days</p>
            </div>
          </div>
        ))}
      </div>

      {/* Requests Table Card */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-navy">All Leave Applications</h4>
            <span className="text-xs text-navy-muted">({leaves.length} records)</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-cream/70 border border-peach-light text-xs font-semibold text-navy outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending (Action Required)</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Leave Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-cream/70 border border-peach-light text-xs font-semibold text-navy outline-none"
            >
              <option value="ALL">All Leave Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Personal Leave">Personal Leave</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-peach-light/50">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-center">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {leaves.map((l) => {
                const emp = l.employeeId;
                const isPending = l.approvalStatus === 'PENDING';
                const isApproved = l.approvalStatus === 'APPROVED';
                const isRejected = l.approvalStatus === 'REJECTED';

                return (
                  <tr key={l._id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => emp?._id && onOpenEmployeeProfile(emp._id)}
                      >
                        <img
                          src={
                            emp?.profilePhoto ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={emp?.name}
                          className="w-9 h-9 rounded-full object-cover border border-peach shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-navy group-hover:text-coral transition-colors">
                            {emp?.name || l.employeeCode}
                          </p>
                          <p className="text-[11px] text-navy-muted">
                            {emp?.designation || l.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">{l.leaveType}</td>
                    <td className="py-3 px-4 text-navy font-medium">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-navy">{l.totalDays}</td>
                    <td className="py-3 px-4 text-navy-muted max-w-xs truncate">{l.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {l.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-navy-muted max-w-xs truncate">
                      {l.approvalRemarks || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canApprove && isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedLeave(l);
                              setReviewStatus('APPROVED');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeave(l);
                              setReviewStatus('REJECTED');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-navy-muted font-medium">
                          {isPending ? 'Awaiting Manager' : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-navy-muted">
                    No leave applications matching selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-peach-light max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-peach-light/50 mb-4">
              <h3 className="font-display font-bold text-lg text-navy">Submit Leave Request</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-navy-muted hover:text-navy text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {applyError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              {user?.role !== 'EMPLOYEE' && (
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Applying For *</label>
                  <select
                    value={applyForm.employeeId}
                    onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
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
              )}

              <div>
                <label className="block font-bold text-navy uppercase mb-1">Leave Category *</label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none font-semibold"
                >
                  <option value="Casual Leave">Casual Leave (Vacation / Family)</option>
                  <option value="Sick Leave">Sick Leave (Medical / Health)</option>
                  <option value="Emergency Leave">Emergency Leave (Immediate Quota)</option>
                  <option value="Personal Leave">Personal Leave (Personal Affairs)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">End Date *</label>
                  <input
                    type="date"
                    value={applyForm.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase mb-1">
                  Total Working Days Requested: <span className="text-coral">{applyForm.totalDays} Days</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase mb-1">Reason for Leave *</label>
                <textarea
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="State the purpose of your time off..."
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-peach-light/40">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-navy font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-peach-soft disabled:opacity-50"
                >
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Decision Modal (Manager / Admin) */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-peach-light">
            <h3 className="font-display font-bold text-lg text-navy mb-2">
              Review Leave Application
            </h3>
            <p className="text-xs text-navy-muted mb-4">
              Decision will automatically notify employee and sync with attendance calendar.
            </p>

            <div className="p-3.5 rounded-xl bg-cream border border-peach-light text-xs space-y-1 mb-4">
              <p className="font-bold text-navy">
                {selectedLeave.employeeId?.name || selectedLeave.employeeCode}
              </p>
              <p className="text-navy-muted">
                {selectedLeave.leaveType} • {selectedLeave.startDate} to {selectedLeave.endDate} ({selectedLeave.totalDays} days)
              </p>
              <p className="italic text-navy-muted pt-1">"{selectedLeave.reason}"</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-navy uppercase mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      reviewStatus === 'APPROVED'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Approve Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Reject Leave
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase mb-1">Manager Remarks / Note</label>
                <input
                  type="text"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g. Approved. Coverage arranged."
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-peach-light/40">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-navy font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark text-white font-semibold text-xs shadow-peach-soft disabled:opacity-50"
                >
                  {reviewLoading ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPage;

