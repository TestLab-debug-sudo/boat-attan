import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Employee } from '../types/index.js';

interface ReportsDownloadsPageProps {
  employees: Employee[];
}

export const ReportsDownloadsPage: React.FC<ReportsDownloadsPageProps> = ({ employees }) => {
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [monthlyYear, setMonthlyYear] = useState<number>(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState<number>(new Date().getMonth() + 1);
  const [yearlyYear, setYearlyYear] = useState<number>(new Date().getFullYear());
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?._id || '');
  const [customStart, setCustomStart] = useState<string>('2025-01-01');
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const [downloading, setDownloading] = useState<string | null>(null);

  const triggerDownload = (url: string, filenameId: string) => {
    setDownloading(filenameId);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(null), 1500);
  };

  const reports = [
    {
      id: 'daily',
      title: '1. Daily Attendance Register',
      badge: 'Single Day Audit',
      description: 'Comprehensive roster of all staff with check-in, check-out, working hours, punch remarks and conditional status fills.',
      actionJsx: (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          />
          <button
            onClick={() => triggerDownload(`/api/export/daily?date=${dailyDate}`, 'daily')}
            disabled={downloading === 'daily'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'daily' ? 'Exporting...' : 'Download .XLSX'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'monthly',
      title: '2. Monthly Attendance Muster Roll',
      badge: 'Calendar Grid 1..31',
      description: 'Complete muster roll sheet matching the standard company attendance template with 1..31 day columns, color highlights, and totals.',
      actionJsx: (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select
            value={monthlyYear}
            onChange={(e) => setMonthlyYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
          <select
            value={monthlyMonth}
            onChange={(e) => setMonthlyMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={() => triggerDownload(`/api/export/monthly?year=${monthlyYear}&month=${monthlyMonth}`, 'monthly')}
            disabled={downloading === 'monthly'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'monthly' ? 'Exporting...' : 'Download .XLSX'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'yearly',
      title: '3. Yearly Attendance Compendium',
      badge: 'Multi-Sheet Workbook',
      description: 'Comprehensive annual workbook containing attendance register, employee directory, and overall performance summaries.',
      actionJsx: (
        <div className="flex items-center gap-2 mt-3">
          <select
            value={yearlyYear}
            onChange={(e) => setYearlyYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          >
            <option value={2026}>2026 (Full Year)</option>
            <option value={2025}>2025 (Full Year)</option>
            <option value={2024}>2024 (Full Year)</option>
          </select>
          <button
            onClick={() => triggerDownload(`/api/export/yearly?year=${yearlyYear}`, 'yearly')}
            disabled={downloading === 'yearly'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'yearly' ? 'Exporting...' : 'Download .XLSX'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'employee',
      title: '4. Employee-wise Attendance Dossier',
      badge: 'Individual Record',
      description: 'Individual employee portfolio containing their lifetime punch history, working hours, and leave application records.',
      actionJsx: (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none max-w-48 truncate"
          >
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </select>
          <button
            onClick={() => triggerDownload(`/api/export/employee/${selectedEmpId || employees[0]?._id}`, 'employee')}
            disabled={downloading === 'employee'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'employee' ? 'Exporting...' : 'Download .XLSX'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'leaves',
      title: '5. Leave Management Dossier',
      badge: 'HR & Audit Report',
      description: 'Official log of all leave applications across casual, sick, emergency, and personal leaves with manager decision notes.',
      actionJsx: (
        <div className="mt-3">
          <button
            onClick={() => triggerDownload('/api/export/leaves', 'leaves')}
            disabled={downloading === 'leaves'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'leaves' ? 'Exporting...' : 'Download Leave Report (.XLSX)'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'history',
      title: '6. Complete Historical Database Archive',
      badge: 'Master Archive (2024-2026)',
      description: 'The master database dump containing every single historical record spanning multiple years with multi-tab workbooks.',
      actionJsx: (
        <div className="mt-3">
          <button
            onClick={() => triggerDownload('/api/export/history', 'history')}
            disabled={downloading === 'history'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark text-white font-bold text-xs shadow-peach-soft hover:from-coral-hover hover:to-coral flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'history' ? 'Exporting Master Archive...' : 'Download Master Archive (.XLSX)'}</span>
          </button>
        </div>
      )
    },
    {
      id: 'custom',
      title: '7. Custom Date Range Report',
      badge: 'Arbitrary Window',
      description: 'Generate an audit workbook for any custom date range with full employee statistics and conditional fills.',
      actionJsx: (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          />
          <span className="text-xs text-navy-muted">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cream border border-peach-light text-xs font-semibold text-navy outline-none"
          />
          <button
            onClick={() => triggerDownload(`/api/export/custom-range?startDate=${customStart}&endDate=${customEnd}`, 'custom')}
            disabled={downloading === 'custom'}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-teal-800 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading === 'custom' ? 'Exporting...' : 'Download .XLSX'}</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              Export Center & Excel Generator
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              ExcelJS 100% Compatible
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Download genuine .xlsx spreadsheet files with peach brand banners, conditional status cell colors, and Google Sheets compatibility.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 border border-peach-light text-xs font-bold text-navy">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets & MS Excel Ready</span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm hover:shadow-md hover:border-peach transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-coral px-2 py-0.5 rounded-full bg-peach-50 border border-peach-light">
                  {rep.badge}
                </span>
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-display font-bold text-base text-navy">{rep.title}</h4>
              <p className="text-xs text-navy-muted mt-1 leading-relaxed">{rep.description}</p>
            </div>

            <div className="pt-3 border-t border-peach-light/40 mt-3">{rep.actionJsx}</div>
          </div>
        ))}
      </div>

      {/* Feature Highlights Card */}
      <div className="p-5 rounded-2xl bg-white/80 border border-peach-light/60 text-xs">
        <h4 className="font-bold text-navy uppercase text-[11px] mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-coral" />
          <span>Excel Export Architectural Specifications</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-navy-muted">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Peach Beach color-coded header branding & timestamps in IST.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Multi-worksheet structure: Attendance, Leaves, Master Staff roster.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Direct Google Drive import compatibility without format loss.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDownloadsPage;

