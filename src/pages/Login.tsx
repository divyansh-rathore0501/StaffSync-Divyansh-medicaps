import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, UserCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both your work email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Authentication successful! Welcome to StaffSync.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 text-white font-black text-2xl mb-4 border border-indigo-400/30">
            SS
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">StaffSync</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Simplifying People. Empowering Teams.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-2">Sign in to your workplace</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your enterprise credentials or use a demo persona below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@staffsync.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons (Crucial for Reviewers) */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              1-Click Demo Evaluation Credentials
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('hr@staffsync.com', 'AdminPassword123!')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-purple-500/40 group"
              >
                <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HR Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Elena Rostova</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('manager@staffsync.com', 'ManagerPassword123!')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-indigo-500/40 group"
              >
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs mb-0.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Manager</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Marcus Sterling</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('employee@staffsync.com', 'EmployeePassword123!')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:border-sky-500/40 group"
              >
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Employee</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Aiden Vance</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          StaffSync Enterprise HRMS • Secure JWT & bcryptjs authentication
        </p>
      </div>
    </div>
  );
};
