import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Info,
  Building,
  Briefcase,
  Users
} from 'lucide-react';
import { attendanceService, employeeService } from '../services/api.js';
import { Employee } from '../types/index.js';

interface MonthlyCalendarPageProps {
  onOpenEmployeeProfile: (employeeId: string) => void;
  onDownloadMonthlyExcel: (year: number, month: number) => void;
}

export const MonthlyCalendarPage: React.FC<MonthlyCalendarPageProps> = ({
  onOpenEmployeeProfile,
  onDownloadMonthlyExcel
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedEmp, setSelectedEmp] = useState<string>('ALL');

  const [calendarData, setCalendarData] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const [calRes, empRes] = await Promise.all([
        attendanceService.getMonthlyCalendar({
          year,
          month,
          department: selectedDept,
          employeeId: selectedEmp
        }),
        employeeService.getAll()
      ]);

      if (calRes.data?.success) setCalendarData(calRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [year, month, selectedDept, selectedEmp]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const departments = ['Operations', 'Technology', 'Manufacturing', 'Quality Control', 'Human Resources', 'Supply Chain', 'Finance', 'Maintenance'];

  // Status Pill Styling mapping according to prompt specifications:
  // - GREEN – Present (P)
  // - RED – Approved Leave (L)
  // - YELLOW – Pending Leave (PL)
  // - GREY – Absent (A)
  // - BLUE – Work From Home (WFH)
  // - ORANGE – Half Day (HD)
  // - PURPLE – Weekly Off / Holiday (WO / H)
  const getStatusBadge = (code: string) => {
    switch (code) {
      case 'P':
      case 'LA':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'L':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'PL':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'WFH':
        return 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
      case 'HD':
        return 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
      case 'WO':
      case 'H':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'A':
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300 font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Month & Year Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-cream hover:bg-peach-light/40 text-navy transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-44">
            <h3 className="font-display font-extrabold text-xl text-navy">
              {monthNames[month - 1]} {year}
            </h3>
            <p className="text-[11px] font-semibold text-coral uppercase tracking-wider">
              Monthly Attendance Muster Roll
            </p>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-cream hover:bg-peach-light/40 text-navy transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-xs font-bold text-navy outline-none"
          >
            <option value={2026}>2026 (Current)</option>
            <option value={2025}>2025 (Previous)</option>
            <option value={2024}>2024 (Archive)</option>
            <option value={2023}>2023 (Archive)</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Employee Filter */}
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="px-3 py-2 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none max-w-40 truncate"
          >
            <option value="ALL">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Download Excel Button */}
          <button
            onClick={() => onDownloadMonthlyExcel(year, month)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Flagship Color Legend Bar */}
      <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-md border border-peach-light/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-navy text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-coral" />
          <span>Status Code Legend:</span>
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">P</span>
            <span className="text-[11px] text-navy-muted">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">L</span>
            <span className="text-[11px] text-navy-muted">Approved Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">PL</span>
            <span className="text-[11px] text-navy-muted">Pending Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">A</span>
            <span className="text-[11px] text-navy-muted">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">WFH</span>
            <span className="text-[11px] text-navy-muted">Work From Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">HD</span>
            <span className="text-[11px] text-navy-muted">Half Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">WO/H</span>
            <span className="text-[11px] text-navy-muted">Off / Holiday</span>
          </div>
        </div>
      </div>

      {/* Main Muster Roll Calendar Grid */}
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-peach border-t-coral rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-navy">Generating Muster Roll Matrix...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs select-none">
              {/* Day Name Header Row */}
              <thead>
                <tr className="bg-peach-50 text-[11px] text-navy-muted font-bold border-b border-peach-light/60">
                  <th className="py-2 px-3 text-left sticky left-0 z-20 bg-peach-50 min-w-44 border-r border-peach-light/60">
                    Employee
                  </th>
                  <th className="py-2 px-3 text-left sticky left-44 z-20 bg-peach-50 min-w-32 border-r border-peach-light/60">
                    Designation
                  </th>

                  {calendarData?.days?.map((day: any) => (
                    <th
                      key={day.dateString}
                      className={`py-1.5 px-1 min-w-[34px] border-r border-peach-light/30 ${
                        day.isSunday ? 'bg-rose-50 text-rose-700' : ''
                      }`}
                    >
                      {day.dayName.substring(0, 2)}
                    </th>
                  ))}

                  {/* Summary Totals Headers */}
                  <th className="py-2 px-2 bg-peach-100/70 text-navy min-w-[36px] border-l border-peach-light font-bold">P</th>
                  <th className="py-2 px-2 bg-peach-100/70 text-navy min-w-[36px]">A</th>
                  <th className="py-2 px-2 bg-peach-100/70 text-navy min-w-[36px]">L</th>
                  <th className="py-2 px-2 bg-peach-100/70 text-navy min-w-[36px]">HD</th>
                  <th className="py-2 px-2 bg-peach-100/70 text-navy min-w-[40px]">WFH</th>
                  <th className="py-2 px-3 bg-peach text-navy min-w-[50px] font-extrabold">Att %</th>
                </tr>

                {/* Day Number Row */}
                <tr className="bg-gradient-to-r from-peach-light via-peach-200 to-peach-light text-navy font-bold border-b border-peach">
                  <th className="py-2 px-3 text-left sticky left-0 z-20 bg-peach-light border-r border-peach">
                    Emp ID & Name
                  </th>
                  <th className="py-2 px-3 text-left sticky left-44 z-20 bg-peach-light border-r border-peach">
                    Role & Dept
                  </th>

                  {calendarData?.days?.map((day: any) => (
                    <th
                      key={day.dateString}
                      className={`py-2 px-1 border-r border-peach ${
                        day.isSunday ? 'bg-rose-100 text-rose-800' : ''
                      }`}
                    >
                      {day.dayNumber}
                    </th>
                  ))}

                  <th colSpan={6} className="py-2 px-2 bg-ocean-deep text-white font-bold">
                    Summary Counts
                  </th>
                </tr>
              </thead>

              {/* Employees Rows */}
              <tbody className="divide-y divide-peach-light/40">
                {calendarData?.matrix?.map((row: any) => {
                  const emp = row.employee;
                  const totals = row.totals;

                  return (
                    <tr key={emp._id} className="hover:bg-cream/40 transition-colors">
                      {/* Sticky Employee Name & ID */}
                      <td
                        className="py-2.5 px-3 text-left sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-r border-peach-light/60 cursor-pointer group"
                        onClick={() => onOpenEmployeeProfile(emp._id)}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={emp.profilePhoto}
                            alt={emp.name}
                            className="w-7 h-7 rounded-full object-cover border border-peach shadow-xs"
                          />
                          <div className="truncate">
                            <p className="font-bold text-navy group-hover:text-coral transition-colors truncate">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-coral font-semibold">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Sticky Designation */}
                      <td className="py-2.5 px-3 text-left sticky left-44 z-10 bg-white/95 backdrop-blur-sm border-r border-peach-light/60 truncate">
                        <p className="font-semibold text-navy truncate">{emp.designation}</p>
                        <p className="text-[10px] text-navy-muted truncate">{emp.department}</p>
                      </td>

                      {/* Daily Date Cells (1..31) */}
                      {calendarData?.days?.map((day: any) => {
                        const statusObj = row.dailyStatuses[day.dateString];
                        const code = statusObj?.code || 'A';
                        const badgeStyle = getStatusBadge(code);

                        return (
                          <td
                            key={day.dateString}
                            className={`p-1 border-r border-peach-light/30 ${
                              day.isSunday ? 'bg-rose-50/40' : ''
                            }`}
                            title={`${emp.name} on ${day.dateString}: ${statusObj?.label || code}`}
                          >
                            <span
                              className={`inline-block w-6 h-6 leading-6 rounded-md text-[10px] border shadow-2xs ${badgeStyle}`}
                            >
                              {code}
                            </span>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="py-2 px-1 font-bold text-emerald-800 bg-emerald-50/50 border-l border-peach-light">
                        {totals.totalP}
                      </td>
                      <td className="py-2 px-1 font-bold text-rose-800 bg-rose-50/50">
                        {totals.totalA}
                      </td>
                      <td className="py-2 px-1 font-bold text-coral bg-peach-50/50">
                        {totals.totalL}
                      </td>
                      <td className="py-2 px-1 font-bold text-orange-800 bg-orange-50/50">
                        {totals.totalHD}
                      </td>
                      <td className="py-2 px-1 font-bold text-sky-800 bg-sky-50/50">
                        {totals.totalWFH}
                      </td>
                      <td className="py-2 px-2 font-extrabold text-navy bg-peach-100">
                        {totals.attendancePercentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCalendarPage;

