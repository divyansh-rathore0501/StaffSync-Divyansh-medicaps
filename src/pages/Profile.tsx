import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import type { Department, User } from '../types.js';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    try {
      const res = await api.put<{ success: boolean; message: string }>('/auth/profile', {
        phoneNumber: phone
      });
      showToast(res.message, 'success');
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update phone number', 'error');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.put<{ success: boolean; message: string }>('/auth/profile', {
        currentPassword,
        password: newPassword
      });
      showToast(res.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const dept = user?.department as Department;
  const manager = user?.manager as User;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account & Workplace Profile</h1>
        <p className="text-xs text-slate-500">
          Manage your personal contact details, credentials, and view organizational policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
            {user?.fullName
              ? user.fullName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'SS'}
          </div>

          <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{user?.jobTitle}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.role}</span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Employee ID</span>
              <span className="font-mono font-bold text-slate-900">{user?.employeeId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{dept?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Reports To</span>
              <span className="font-semibold text-slate-800">{manager?.fullName || 'Executive Leadership'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Joined On</span>
              <span className="font-semibold text-slate-800">
                {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Edit Phone & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Form */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Contact Details</h3>
            <p className="text-xs text-slate-500 mb-4">Update permitted personal phone information.</p>

            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Work email addresses are managed centrally by HR.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {phoneLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Contact Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Security & Password</h3>
            <p className="text-xs text-slate-500 mb-4">Ensure your password is at least 6 characters long.</p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {passwordLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Workplace Policies Information */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-2">Workplace Attendance & Leave Policy Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Standard Work Hours
            </span>
            <p>09:30 AM to 06:00 PM (Asia/Kolkata default). Arrival past 09:45 AM will automatically flag as "Late".</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Minimum Shift Duration
            </span>
            <p>A minimum of 4.0 logged hours is required for full-day credit. Less than 4 hours logs as "Half-Day".</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" /> Leave Deduction Policy
            </span>
            <p>Approved leaves immediately deduct from your balances. Unpaid leave does not reduce leave allowances.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
