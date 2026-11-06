import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  Database,
  Calendar,
  Clock,
  Building,
  CheckCircle,
  Save,
  HardDriveDownload,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { settingsService, authService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { CompanySetting, AuditLogItem } from '../types/index.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySetting | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Password Change State
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const fetchSettingsAndLogs = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getAuditLogs({ limit: 30 })
      ]);

      if (settingsRes.data?.success) {
        setSettings(settingsRes.data.data.settings);
        setHolidays(settingsRes.data.data.holidays || []);
      }
      if (logsRes.data?.success) {
        setAuditLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setSaveMessage(null);
      await settingsService.updateSettings(settings);
      setSaveMessage('Company attendance policies updated successfully.');
      await fetchSettingsAndLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPassMsg(null);
      setPassError(null);
      await authService.changePassword(passForm);
      setPassMsg('Password successfully updated!');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Password update failed');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-peach-100 via-cream to-ocean-surface border border-peach-light/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-extrabold text-lg text-navy">
              System Configuration & Audit Vault
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-peach-50 text-coral font-bold text-xs border border-peach-light">
              Timezone: Asia/Kolkata
            </span>
          </div>
          <p className="text-xs text-navy-muted mt-1">
            Global attendance cutoff times, working hour policies, holiday schedule, and comprehensive audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attendance Policies & Password */}
        <div className="lg:col-span-7 space-y-6">
          {/* Company Attendance Rules Form */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-peach-light/40 pb-3">
              <h4 className="font-display font-bold text-base text-navy flex items-center gap-2">
                <Clock className="w-4 h-4 text-coral" />
                <span>Attendance Timing & Shift Policies</span>
              </h4>
              {saveMessage && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {saveMessage}
                </span>
              )}
            </div>

            {settings && (
              <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-navy uppercase mb-1">Company Name</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={settings.companyName || ''}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy font-semibold outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-navy uppercase mb-1 text-coral">
                      Attendance Cutoff Time (24h Format) *
                    </label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={settings.attendanceCutoffTime || ''}
                      onChange={(e) => setSettings({ ...settings, attendanceCutoffTime: e.target.value })}
                      placeholder="10:30"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy font-bold outline-none disabled:opacity-60"
                    />
                    <p className="text-[10px] text-navy-muted mt-1">
                      Check-ins after this time are automatically marked LATE_ARRIVAL.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-navy uppercase mb-1">Standard Check-In Time</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={settings.standardCheckInTime || ''}
                      onChange={(e) => setSettings({ ...settings, standardCheckInTime: e.target.value })}
                      placeholder="09:00"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-navy uppercase mb-1">Standard Check-Out Time</label>
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={settings.standardCheckOutTime || ''}
                      onChange={(e) => setSettings({ ...settings, standardCheckOutTime: e.target.value })}
                      placeholder="17:30"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-navy uppercase mb-1">Full Day Required Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isAdmin}
                      value={settings.dailyWorkHoursRequired || 8.5}
                      onChange={(e) => setSettings({ ...settings, dailyWorkHoursRequired: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-navy uppercase mb-1">Half Day Threshold Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isAdmin}
                      value={settings.halfDayWorkHoursRequired || 4.0}
                      onChange={(e) => setSettings({ ...settings, halfDayWorkHoursRequired: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none disabled:opacity-60"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-3 border-t border-peach-light/40">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-peach-dark text-white font-semibold text-xs shadow-peach-soft hover:from-coral-hover flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Change Password Card */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
            <h4 className="font-display font-bold text-base text-navy flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-ocean-deep" />
              <span>Change Portal Password</span>
            </h4>

            {passMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {passMsg}
              </div>
            )}
            {passError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {passError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-navy uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-peach-light text-navy outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-ocean-deep hover:bg-ocean-darker text-white font-semibold text-xs transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Holidays & Database Backup */}
        <div className="lg:col-span-5 space-y-6">
          {/* Holidays Card */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-3">
            <h4 className="font-display font-bold text-base text-navy flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Official Holiday Schedule</span>
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
              {holidays.map((h) => (
                <div
                  key={h._id}
                  className="p-2.5 rounded-xl bg-cream/70 border border-peach-light/50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-navy">{h.name}</p>
                    <p className="text-[10px] text-navy-muted">{h.date} ({h.type})</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    {h.year}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MongoDB Backup & Architecture Card */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-3">
            <h4 className="font-display font-bold text-base text-navy flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>MongoDB Database Resilience</span>
            </h4>
            <div className="p-3 rounded-xl bg-cream/80 border border-peach-light/60 text-xs space-y-1.5 text-navy-muted">
              <p className="font-bold text-navy">Permanent Historical Database Status: ONLINE</p>
              <p>• Compound Unique Index: <code className="text-coral">attendance(employeeId, attendanceDate)</code></p>
              <p>• Fast Historical Indexes on <code className="text-coral">attendanceDate</code> and <code className="text-coral">status</code></p>
              <p>• Automatic audit trail enabled for manual corrections.</p>
            </div>
            <div className="p-3 rounded-xl bg-peach-50 border border-peach-light text-xs text-navy font-medium flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-coral shrink-0" />
              <span>All attendance data persists across years and is never overwritten.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Audit Logs Vault Table */}
      <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-peach-light/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-base text-navy flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-coral" />
              <span>System Audit Trail & Modification Records</span>
            </h4>
            <p className="text-xs text-navy-muted">
              Tamper-evident log of manual attendance overrides, employee updates, and system decisions.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-peach-50 text-coral text-xs font-bold border border-peach-light">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-peach-light/50">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-peach-light/60 via-peach-50 to-cream text-navy font-bold border-b border-peach-light">
                <th className="py-2.5 px-4">Timestamp (IST)</th>
                <th className="py-2.5 px-4">Action Type</th>
                <th className="py-2.5 px-4">Performed By</th>
                <th className="py-2.5 px-4">Target Employee</th>
                <th className="py-2.5 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach-light/30">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-cream/40 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-navy whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-coral">{log.action}</td>
                  <td className="py-2.5 px-4 text-navy">
                    {log.performerName || 'Admin'} ({log.performerRole || 'ADMIN'})
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-navy">
                    {log.targetEmployeeCode || '-'}
                  </td>
                  <td className="py-2.5 px-4 text-navy-muted max-w-md truncate">
                    {log.details?.reason || JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-navy-muted">
                    No audit records recorded yet.
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

export default SettingsPage;

