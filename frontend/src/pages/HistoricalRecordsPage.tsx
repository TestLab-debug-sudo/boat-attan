import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Calendar,
  Download,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Phone,
  Building
} from 'lucide-react';
import { historicalService, employeeService } from '../services/api.js';
import { Employee } from '../types/index.js';

interface HistoricalRecordsPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
  onDownloadHistoryExcel: () => void;
}

export const HistoricalRecordsPage: React.FC<HistoricalRecordsPageProps> = ({
  onOpenEmployeeProfile,
  onDownloadHistoryExcel
}) => {
  const currentYear = new Date().getFullYear().toString();

  const [year, setYear] = useState<string>(currentYear);
  const [month, setMonth] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEmp, setSelectedEmp] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [historicalData, setHistoricalData] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistorical = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 50,
        department: selectedDept,
        designation: 'ALL',
        status: selectedStatus,
        search
      };

      if (selectedEmp !== 'ALL') params.employeeId = selectedEmp;

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        if (year !== 'ALL') params.year = year;
        if (month !== 'ALL') params.month = month;
      }

      const [histRes, empRes] = await Promise.all([
        historicalService.query(params),
        employeeService.getAll()
      ]);

      if (histRes.data?.success) setHistoricalData(histRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to load historical data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical();
  }, [year, month, startDate, endDate, selectedEmp, selectedDept, selectedStatus, page]);

  const departments = ['Operations', 'Technology', 'Manufacturing', 'Quality Control', 'Human Resources', 'Supply Chain', 'Finance', 'Maintenance'];

  const monthNames = [
    { num: '1', name: 'January' },
    { num: '2', name: 'February' },
    { num: '3', name: 'March' },
    { num: '4', name: 'April' },
    { num: '5', name: 'May' },
    { num: '6', name: 'June' },
    { num: '7', name: 'July' },
    { num: '8', name: 'August' },
    { num: '9', name: 'September' },
    { num: '10', name: 'October' },
    { num: '11', name: 'November' },
    { num: '12', name: 'December' }
  ];

  const summary = historicalData?.summary;
  const records = historicalData?.records || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Permanent Historical Attendance Database
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-50 text-coral font-bold text-xs border border-peach-light">
              MongoDB Date-Indexed
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Query deep archives across 2026, 2025, 2024 and custom time horizons with persistent records.
          </p>
        </div>

        <button
          onClick={onDownloadHistoryExcel}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Archive (.XLSX)</span>
        </button>
      </div>

      {/* Dynamic Summary Cards for Filtered Query */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white/80 border border-peach-light shadow-xs text-center">
          <p className="text-[10px] font-bold text-navy-muted uppercase">Matched Records</p>
          <p className="text-2xl font-display font-extrabold text-navy">{summary?.totalRecords || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/80 border border-emerald-200 shadow-xs text-center">
          <p className="text-[10px] font-bold text-emerald-700 uppercase">Present Days</p>
          <p className="text-2xl font-display font-extrabold text-emerald-800">{summary?.totalPresent || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/80 border border-rose-200 shadow-xs text-center">
          <p className="text-[10px] font-bold text-rose-700 uppercase">Absent Days</p>
          <p className="text-2xl font-display font-extrabold text-rose-800">{summary?.totalAbsent || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/80 border border-peach-light shadow-xs text-center">
          <p className="text-[10px] font-bold text-coral uppercase">Leave Days</p>
          <p className="text-2xl font-display font-extrabold text-coral">{summary?.totalLeave || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/80 border border-blue-200 shadow-xs text-center">
          <p className="text-[10px] font-bold text-ocean-deep uppercase">Logged Hours</p>
          <p className="text-2xl font-display font-extrabold text-ocean-deep">{summary?.totalHours || 0}h</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/80 border border-peach-200 shadow-xs text-center">
          <p className="text-[10px] font-bold text-coral uppercase">Attendance %</p>
          <p className="text-2xl font-display font-extrabold text-navy">{summary?.attendancePercentage || 0}%</p>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Year Filter */}
          <div>
            <label className="block font-bold text-navy uppercase mb-1">Archive Year</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light font-bold text-navy outline-none"
            >
              <option value="ALL">All Available Years</option>
              <option value="2026">2026 (Current Year)</option>
              <option value="2025">2025 (Previous Year)</option>
              <option value="2024">2024 (2 Years Ago)</option>
              <option value="2023">2023 (3 Years Ago)</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block font-bold text-navy uppercase mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light font-medium text-navy outline-none"
            >
              <option value="ALL">All Months in Year</option>
              {monthNames.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block font-bold text-navy uppercase mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light font-medium text-navy outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block font-bold text-navy uppercase mb-1">Specific Employee</label>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light font-medium text-navy outline-none truncate"
            >
              <option value="ALL">All Employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-peach-light/40">
          <div>
            <label className="block font-bold text-navy uppercase mb-1">From Date (Custom Range)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-navy uppercase mb-1">To Date (Custom Range)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-navy uppercase mb-1">Attendance Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy font-semibold outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE_ARRIVAL">Late Arrival</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="WORK_FROM_HOME">Work From Home</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="WEEKLY_OFF">Weekly Off</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy uppercase mb-1">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, ID, phone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto rounded-xl border border-peach-light/50">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Check-In</th>
                <th className="py-3 px-4 text-center">Check-Out</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4">Remarks / Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {records.map((att: any) => (
                <tr key={att._id} className="hover:bg-cream/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">{att.attendanceDate}</td>
                  <td className="py-3 px-4">
                    <div
                      className="cursor-pointer group flex items-center gap-2"
                      onClick={() => att.employeeId?._id && onOpenEmployeeProfile(att.employeeId._id)}
                    >
                      <span className="font-bold text-navy group-hover:text-coral transition-colors">
                        {att.employeeId?.name || att.employeeCode}
                      </span>
                      <span className="text-[10px] text-coral px-1.5 py-0.5 rounded bg-peach-50 border border-peach-light">
                        {att.employeeCode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-navy">{att.employeeId?.designation || '-'}</p>
                    <p className="text-[11px] text-navy-muted">{att.employeeId?.department || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        att.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'LATE_ARRIVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : att.status === 'ABSENT'
                          ? 'bg-gray-100 text-gray-700'
                          : att.status === 'ON_LEAVE'
                          ? 'bg-rose-100 text-rose-800'
                          : att.status === 'WORK_FROM_HOME'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-navy font-medium">
                    {att.checkInTimeFormatted || '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-navy font-medium">
                    {att.checkOutTimeFormatted || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-navy">
                    {att.workingHours ? `${att.workingHours} hrs` : '-'}
                  </td>
                  <td className="py-3 px-4 text-navy-muted max-w-xs truncate">
                    {att.isManualCorrection ? (
                      <span className="text-amber-700 font-semibold">
                        [Manual]: {att.correctionReason || att.remarks}
                      </span>
                    ) : (
                      att.remarks || 'Standard shift'
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-navy-muted">
                    No historical attendance documents match the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {historicalData?.pagination && (
          <div className="flex items-center justify-between text-xs text-navy font-semibold pt-2">
            <p>
              Showing Page {page} of {historicalData.pagination.totalPages || 1} ({historicalData.pagination.total} records)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-cream border border-peach-light disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= (historicalData.pagination.totalPages || 1)}
                className="px-3 py-1.5 rounded-lg bg-cream border border-peach-light disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalRecordsPage;

