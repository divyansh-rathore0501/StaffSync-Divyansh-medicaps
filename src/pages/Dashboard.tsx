import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  Megaphone,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { StatCard } from '../components/StatCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import type { Announcement } from '../types.js';

export const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [shiftLoading, setShiftLoading] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsRes, annRes] = await Promise.all([
        api.get<{ success: boolean; stats: any }>('/reports/dashboard-stats'),
        api.get<{ success: boolean; announcements: Announcement[] }>('/announcements')
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (annRes.success) setAnnouncements(annRes.announcements.slice(0, 3));
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCheckIn = async () => {
    setShiftLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string; record: any }>('/attendance/check-in');
      showToast(res.message, 'success');
      await Promise.all([loadDashboardData(), refreshUser()]);
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setShiftLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string; record: any }>('/attendance/check-out');
      showToast(res.message, 'success');
      await Promise.all([loadDashboardData(), refreshUser()]);
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setShiftLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading StaffSync Dashboard...</p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#4338ca', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

  const deptData = stats?.deptDistribution || [];
  const todayAttendance = stats?.todayAttendance;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Check-in/out Widget */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-950 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>StaffSync Modern HRMS • {user?.role} Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {typeof user?.department === 'object' ? user.department?.name : 'Organization'} •{' '}
            {user?.jobTitle} • ID: <span className="font-mono text-indigo-300">{user?.employeeId}</span>
          </p>
        </div>

        {/* Global Shift Check-in/out Controller */}
        <div className="relative z-10 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-slate-400 font-medium">Today's Shift Status</div>
            <div className="flex items-center gap-2 mt-1">
              {!todayAttendance ? (
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Not Checked In
                </span>
              ) : !todayAttendance.checkOut ? (
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> In Progress ({todayAttendance.status})
                </span>
              ) : (
                <span className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Shift Completed ({todayAttendance.totalHours} hrs)
                </span>
              )}
            </div>
            {todayAttendance && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                In: {new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {todayAttendance.checkOut && (
                  <span>
                    {' '}• Out: {new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!todayAttendance ? (
              <button
                onClick={handleCheckIn}
                disabled={shiftLoading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                {shiftLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Check In</span>
                  </>
                )}
              </button>
            ) : !todayAttendance.checkOut ? (
              <button
                onClick={handleCheckOut}
                disabled={shiftLoading}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                {shiftLoading ? (
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Check Out</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate('/attendance')}
                className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all"
              >
                View History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {user?.role === 'HR' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Active Workforce"
            value={stats?.totalEmployees || 0}
            subtitle="Verified employee profiles"
            icon={Users}
            colorScheme="indigo"
          />
          <StatCard
            title="Present Today"
            value={stats?.presentToday || 0}
            subtitle="Logged into system today"
            icon={UserCheck}
            colorScheme="emerald"
            badge={{ text: 'Live Status', variant: 'positive' }}
          />
          <StatCard
            title="Absent Today"
            value={stats?.absentToday || 0}
            subtitle="Unrecorded check-ins"
            icon={UserX}
            colorScheme="rose"
            badge={{ text: 'Action Needed', variant: 'negative' }}
          />
          <StatCard
            title="Pending Leave Requests"
            value={stats?.pendingLeaves || 0}
            subtitle="Awaiting decision"
            icon={CalendarCheck}
            colorScheme="amber"
          />
        </div>
      )}

      {user?.role === 'Manager' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Team Members"
            value={stats?.totalTeam || 0}
            subtitle="Engineers & direct reports"
            icon={Users}
            colorScheme="indigo"
          />
          <StatCard
            title="Team Present Today"
            value={stats?.presentToday || 0}
            subtitle={`Out of ${stats?.totalTeam || 0} team members`}
            icon={UserCheck}
            colorScheme="emerald"
            badge={{ text: 'On Duty', variant: 'positive' }}
          />
          <StatCard
            title="Pending Team Leaves"
            value={stats?.pendingLeaves || 0}
            subtitle="Requires your review"
            icon={CalendarCheck}
            colorScheme="amber"
            badge={stats?.pendingLeaves > 0 ? { text: 'Review Pending', variant: 'negative' } : undefined}
          />
          <StatCard
            title="Team Training Courses"
            value={stats?.teamTraining || 0}
            subtitle="Active skill enrollments"
            icon={GraduationCap}
            colorScheme="slate"
          />
        </div>
      )}

      {user?.role === 'Employee' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Annual Leave Balance"
            value={`${user?.leaveBalances?.annual || 0} days`}
            subtitle="Paid vacation allowance"
            icon={CalendarCheck}
            colorScheme="indigo"
          />
          <StatCard
            title="Sick Leave Balance"
            value={`${user?.leaveBalances?.sick || 0} days`}
            subtitle="Medical & health recovery"
            icon={TrendingUp}
            colorScheme="emerald"
          />
          <StatCard
            title="Casual Leave Balance"
            value={`${user?.leaveBalances?.casual || 0} days`}
            subtitle="Personal emergencies"
            icon={Users}
            colorScheme="amber"
          />
          <StatCard
            title="Pending Leave Requests"
            value={stats?.myPendingLeaves || 0}
            subtitle="Under manager review"
            icon={Clock}
            colorScheme="slate"
          />
        </div>
      )}

      {/* Charts & Interactive Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart / Distribution */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {user?.role === 'HR'
                  ? 'Headcount by Department'
                  : user?.role === 'Manager'
                  ? 'Team Overview & Capacity'
                  : 'Weekly Work Hours & Productivity'}
              </h3>
              <p className="text-xs text-slate-500">
                Live metrics from actual persistent database records.
              </p>
            </div>
            {user?.role === 'HR' && (
              <button
                onClick={() => navigate('/employees')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {user?.role === 'HR' ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {deptData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Standard Working Hours</span>
                <span className="text-sm font-mono font-bold text-indigo-700">09:30 AM - 06:00 PM</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((todayAttendance?.totalHours || 0) / 8.5) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Logged: {todayAttendance?.totalHours || 0} hrs today</span>
                <span>Expected: 8.5 hrs/day</span>
              </div>
            </div>
          )}
        </div>

        {/* Company Announcements Bulletin */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Announcements</h3>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No company announcements posted.
              </div>
            ) : (
              announcements.map(a => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {a.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{a.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{a.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table for HR / Quick Action Bar */}
      {user?.role === 'HR' && stats?.recentActivity && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base mb-4">Recent Organizational Activity</h3>
          <div className="divide-y divide-slate-100">
            {stats.recentActivity.map((act: any) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      act.type === 'Leave'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {act.type === 'Leave' ? (
                      <CalendarCheck className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(act.time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={act.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
