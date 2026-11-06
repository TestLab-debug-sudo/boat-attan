import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Grid,
  List,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { employeeService } from '../services/api.js';
import { Employee } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';

interface EmployeesPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onOpenEmployeeProfile }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [modalForm, setModalForm] = useState({
    employeeId: '',
    name: '',
    profilePhoto: '',
    designation: '',
    department: 'Operations',
    mobileNumber: '',
    email: '',
    address: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 60000
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canManage = isAdmin || isManager;

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getAll({
        search,
        department: selectedDept,
        status: selectedStatus,
        approvalStatus: approvalFilter === 'PENDING' ? 'PENDING_APPROVAL' : approvalFilter === 'APPROVED' ? 'APPROVED' : undefined
      });
      if (res.data?.success) {
        setEmployees(res.data.data);
        setPendingApprovalsCount(res.data.pendingApprovalsCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus, approvalFilter]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setModalForm({
      employeeId: `PW-${1000 + employees.length + 1}`,
      name: '',
      profilePhoto: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      designation: '',
      department: 'Operations',
      mobileNumber: '+91-98765-',
      email: '',
      address: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      emergencyName: '',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '',
      shiftTiming: '09:00 AM - 05:30 PM',
      basicSalary: 60000
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setModalForm({
      employeeId: emp.employeeId,
      name: emp.name,
      profilePhoto: emp.profilePhoto || '',
      designation: emp.designation,
      department: emp.department,
      mobileNumber: emp.mobileNumber,
      email: emp.email,
      address: emp.address || '',
      dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
      emergencyName: emp.emergencyContact?.name || '',
      emergencyRelationship: emp.emergencyContact?.relationship || 'Spouse',
      emergencyPhone: emp.emergencyContact?.phone || '',
      shiftTiming: emp.shiftTiming || '09:00 AM - 05:30 PM',
      basicSalary: emp.basicSalary || 60000
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const payload: any = {
        employeeId: modalForm.employeeId,
        name: modalForm.name,
        profilePhoto: modalForm.profilePhoto,
        designation: modalForm.designation,
        department: modalForm.department,
        mobileNumber: modalForm.mobileNumber,
        email: modalForm.email,
        address: modalForm.address,
        dateOfJoining: modalForm.dateOfJoining,
        emergencyContact: {
          name: modalForm.emergencyName,
          relationship: modalForm.emergencyRelationship,
          phone: modalForm.emergencyPhone
        },
        shiftTiming: modalForm.shiftTiming,
        basicSalary: Number(modalForm.basicSalary)
      };

      if (editingEmployee) {
        await employeeService.update(editingEmployee._id, payload);
        setActionMessage(`Updated details for ${payload.name}`);
      } else {
        const res = await employeeService.create(payload);
        if (res.data?.success) {
          setActionMessage(res.data.message);
        }
      }

      setShowModal(false);
      await fetchEmployees();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Operation failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Admin Approval for Pending Onboarding
  const handleApproveEmployee = async (emp: Employee) => {
    try {
      const res = await employeeService.approve(emp._id, 'APPROVED', 'Approved by Admin');
      if (res.data?.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setActionMessage(`Approved and activated ${emp.name} (${emp.employeeId})!`);
        await fetchEmployees();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectEmployee = async (emp: Employee) => {
    const reason = window.prompt(`Reason for rejecting ${emp.name}'s onboarding:`, 'Documentation incomplete');
    if (reason === null) return;

    try {
      const res = await employeeService.approve(emp._id, 'REJECTED', reason);
      if (res.data?.success) {
        setActionMessage(`Rejected onboarding for ${emp.name}.`);
        await fetchEmployees();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.employmentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to mark ${emp.name} as ${newStatus}?`)) return;

    try {
      await employeeService.toggleStatus(emp._id, newStatus);
      await fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  const departments = ['Operations', 'Technology', 'Manufacturing', 'Quality Control', 'Human Resources', 'Supply Chain', 'Finance', 'Maintenance'];

  // Check pending onboarding list
  const pendingOnboardings = employees.filter((e) => e.approvalStatus === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      {/* Admin Pending Approvals Queue Banner */}
      {isAdmin && pendingApprovalsCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-navy">
                {pendingApprovalsCount} New Employee Onboarding Request(s) Awaiting Admin Approval
              </h4>
              <p className="text-xs text-navy-muted">
                Submitted by Managers. Only after your approval will the employee become active and able to log in.
              </p>
            </div>
          </div>

          <button
            onClick={() => setApprovalFilter(approvalFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              approvalFilter === 'PENDING'
                ? 'bg-navy text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
            }`}
          >
            {approvalFilter === 'PENDING' ? 'Show All Staff' : 'Review Approval Queue'}
          </button>
        </div>
      )}

      {/* Top Action Bar & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, phone, rank..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream/70 border border-peach-light focus:border-coral focus:ring-2 focus:ring-coral/20 text-xs text-navy outline-none"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {actionMessage && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              {actionMessage}
            </span>
          )}

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-cream/70 border border-peach-light text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-cream/70 border border-peach-light p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-coral shadow-xs' : 'text-navy-muted'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-coral shadow-xs' : 'text-navy-muted'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Employee Button (Admin or Manager) */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-peach-soft transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdmin ? 'Add Employee' : 'Request New Employee'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Content View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const isPendingApproval = emp.approvalStatus === 'PENDING_APPROVAL';

            return (
              <div
                key={emp._id}
                onClick={() => onOpenEmployeeProfile(emp._id)}
                className={`p-5 rounded-2xl bg-white/90 backdrop-blur-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isPendingApproval
                    ? 'border-amber-300 ring-2 ring-amber-200/50 shadow-md bg-amber-50/20'
                    : 'border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={emp.profilePhoto}
                        alt={emp.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-peach shadow-sm"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isPendingApproval
                            ? 'bg-amber-400'
                            : emp.employmentStatus === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-coral px-2 py-0.5 rounded-full bg-peach-50 border border-peach-light">
                        {emp.employeeId}
                      </span>
                      <p className="text-[11px] text-navy-muted font-medium mt-1">
                        {isPendingApproval ? (
                          <span className="text-amber-700 font-bold">Pending Admin Approval</span>
                        ) : (
                          emp.employmentStatus
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Name & Title */}
                  <h4 className="font-bold text-base text-navy group-hover:text-coral transition-colors">
                    {emp.name}
                  </h4>
                  <p className="text-xs font-semibold text-navy-muted">{emp.designation}</p>

                  {/* Department badge */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream border border-peach-light/60 text-navy text-[11px] font-medium">
                    <Building className="w-3 h-3 text-ocean-deep" />
                    <span>{emp.department}</span>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 space-y-1.5 text-xs text-navy-muted border-t border-peach-light/40 pt-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-peach-dark" />
                      <span className="truncate">{emp.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-peach-dark" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-peach-light/40 flex items-center justify-between text-xs font-semibold">
                  <span className="text-coral group-hover:underline">View History →</span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Admin Approval Buttons if Pending */}
                    {isAdmin && isPendingApproval && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApproveEmployee(emp)}
                          className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                          title="Approve Onboarding"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectEmployee(emp)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px]"
                          title="Reject Onboarding"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {canManage && !isPendingApproval && (
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 rounded-lg text-navy-muted hover:text-navy hover:bg-peach-light/30 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && !isPendingApproval && (
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          emp.employmentStatus === 'ACTIVE'
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={emp.employmentStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {emp.employmentStatus === 'ACTIVE' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Date Joined</th>
                <th className="py-3 px-4 text-center">Approval State</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {employees.map((emp) => {
                const isPendingApproval = emp.approvalStatus === 'PENDING_APPROVAL';

                return (
                  <tr
                    key={emp._id}
                    onClick={() => onOpenEmployeeProfile(emp._id)}
                    className="hover:bg-cream/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.profilePhoto}
                          alt={emp.name}
                          className="w-9 h-9 rounded-full object-cover border border-peach shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-navy group-hover:text-coral transition-colors">
                            {emp.name}
                          </p>
                          <p className="text-[11px] text-navy-muted">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">{emp.designation}</td>
                    <td className="py-3 px-4 text-navy-muted">{emp.department}</td>
                    <td className="py-3 px-4">
                      <p className="text-navy font-medium">{emp.mobileNumber}</p>
                      <p className="text-[11px] text-navy-muted truncate">{emp.email}</p>
                    </td>
                    <td className="py-3 px-4 text-navy-muted">
                      {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPendingApproval ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Pending Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.employmentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && isPendingApproval ? (
                          <>
                            <button
                              onClick={() => handleApproveEmployee(emp)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectEmployee(emp)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onOpenEmployeeProfile(emp._id)}
                              className="px-2 py-1 rounded-lg bg-peach-50 text-coral font-bold text-xs hover:bg-peach-light transition-colors"
                            >
                              Profile
                            </button>
                            {canManage && (
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1 rounded-lg text-navy-muted hover:text-navy hover:bg-peach-light/40"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Request Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-peach-light max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-peach-light/50 mb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-navy">
                  {editingEmployee
                    ? `Edit Employee (${editingEmployee.employeeId})`
                    : isAdmin
                    ? 'Add New Employee (Admin Action)'
                    : 'Request New Employee Onboarding'}
                </h3>
                {!isAdmin && !editingEmployee && (
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    ℹ️ You are logged in as Manager. This request will be submitted to Admin for approval before being activated.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-navy-muted hover:text-navy text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={modalForm.employeeId}
                    onChange={(e) => setModalForm({ ...modalForm, employeeId: e.target.value })}
                    required
                    disabled={!!editingEmployee}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    required
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Designation / Rank *</label>
                  <input
                    type="text"
                    value={modalForm.designation}
                    onChange={(e) => setModalForm({ ...modalForm, designation: e.target.value })}
                    required
                    placeholder="e.g. Senior Supervisor"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Department *</label>
                  <select
                    value={modalForm.department}
                    onChange={(e) => setModalForm({ ...modalForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={modalForm.mobileNumber}
                    onChange={(e) => setModalForm({ ...modalForm, mobileNumber: e.target.value })}
                    required
                    placeholder="+91-98765-XXXXX"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    required
                    placeholder="emp@peachwave.com"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Profile Photo URL</label>
                  <input
                    type="text"
                    value={modalForm.profilePhoto}
                    onChange={(e) => setModalForm({ ...modalForm, profilePhoto: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={modalForm.dateOfJoining}
                    onChange={(e) => setModalForm({ ...modalForm, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy uppercase mb-1">Office Address / Location</label>
                <input
                  type="text"
                  value={modalForm.address}
                  onChange={(e) => setModalForm({ ...modalForm, address: e.target.value })}
                  placeholder="e.g. 14 Coastal Breeze Enclave, Chennai"
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-peach-light/40">
                <p className="font-bold text-navy text-xs uppercase mb-2">Emergency Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={modalForm.emergencyName}
                    onChange={(e) => setModalForm({ ...modalForm, emergencyName: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse)"
                    value={modalForm.emergencyRelationship}
                    onChange={(e) => setModalForm({ ...modalForm, emergencyRelationship: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Emergency Phone"
                    value={modalForm.emergencyPhone}
                    onChange={(e) => setModalForm({ ...modalForm, emergencyPhone: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-peach-light/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-navy font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-xs shadow-peach-soft disabled:opacity-50"
                >
                  {modalSubmitting
                    ? 'Submitting...'
                    : editingEmployee
                    ? 'Update Employee'
                    : isAdmin
                    ? 'Create & Activate Employee'
                    : 'Submit Request to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
