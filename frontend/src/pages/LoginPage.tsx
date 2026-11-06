import React, { useState } from 'react';
import { Waves, Lock, Mail, Shield, UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import PeachBeachCanvas from '../components/three/PeachBeachCanvas.js';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide email/username and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: string) => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || `Demo login for ${role} failed.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach-50 to-ocean-surface flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative ambient beach blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-peach-light/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[32rem] h-[32rem] rounded-full bg-ocean/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: 3D Beach Showcase & Branding */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-peach via-coral to-ocean flex items-center justify-center shadow-peach-soft text-white">
              <Waves className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-navy tracking-tight">
                PEACH<span className="text-coral">WAVE</span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-ocean-deep tracking-wider uppercase">
                3D Workforce Management Operating System
              </p>
            </div>
          </div>

          {/* 3D Beach Scene Showcase */}
          <div className="shadow-xl rounded-2xl overflow-hidden border border-peach-light/80 bg-white/40 backdrop-blur-sm">
            <PeachBeachCanvas compact={false} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white/70 backdrop-blur-md border border-peach-light/60 shadow-sm">
              <p className="text-[11px] font-bold text-coral uppercase tracking-wider">Attendance</p>
              <p className="text-xs text-navy font-semibold mt-0.5">Automated Muster Roll</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/70 backdrop-blur-md border border-peach-light/60 shadow-sm">
              <p className="text-[11px] font-bold text-ocean-deep uppercase tracking-wider">Historical DB</p>
              <p className="text-xs text-navy font-semibold mt-0.5">Multi-Year Archive</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/70 backdrop-blur-md border border-peach-light/60 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Excel Reports</p>
              <p className="text-xs text-navy font-semibold mt-0.5">Google Sheets .XLSX</p>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Login Card */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-card-glass border border-peach-light/80">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-navy">Welcome Aboard</h2>
            <p className="text-xs sm:text-sm text-navy-muted mt-1">
              Sign in to manage employees, attendance, and leave workflows.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-muted" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@peachwave.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream/70 border border-peach-light focus:border-coral focus:ring-2 focus:ring-coral/20 text-navy text-sm outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream/70 border border-peach-light focus:border-coral focus:ring-2 focus:ring-coral/20 text-navy text-sm outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-coral to-peach-dark hover:from-coral-hover hover:to-coral text-white font-semibold text-sm shadow-peach-soft transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-6 border-t border-peach-light/50">
            <p className="text-xs font-bold text-navy uppercase tracking-wider text-center mb-3">
              One-Click Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('ADMIN')}
                disabled={loading}
                className="py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors flex flex-col items-center gap-1"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('MANAGER')}
                disabled={loading}
                className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors flex flex-col items-center gap-1"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Manager</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('EMPLOYEE')}
                disabled={loading}
                className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors flex flex-col items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Employee</span>
              </button>
            </div>
            <p className="text-[11px] text-navy-muted text-center mt-3">
              Preloaded with 10 sample staff & permanent historical records (2024-2026).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

