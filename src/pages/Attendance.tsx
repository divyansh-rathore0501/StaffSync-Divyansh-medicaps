import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import type { Attendance, User } from '../types.js';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [teamList, setTeamList] = useState<User[]>([]);

  const loadAttendance = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter) params.append('status', statusFilter);
      if (employeeFilter) params.append('employeeId', employeeFilter);

      const [historyRes, todayRes] = await Promise.all([
        api.get<{ success: boolean; records: Attendance[] }>(`/attendance/history?${params.toString()}`),
        api.get<{ success: boolean; record: Attendance | null }>('/attendance/today')
      ]);

      if (historyRes.success) setRecords(historyRes.records);
      if (todayRes.success) setTodayRecord(todayRes.record);
    } catch (err: any) {
      showToast(err.message || 'Error loading attendance logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, employeeFilter, showToast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Load team/staff list for filtering if HR or Manager
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get<{ success: boolean; employees: User[] }>('/employees?limit=100');
        if (res.success) setTeamList(res.employees);
      } catch (err) {}
    };
    if (['HR', 'Manager'].includes(user?.role || '')) {
      fetchStaff();
    }
  }, [user]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/attendance/check-in');
      showToast(res.message, 'success');
      loadAttendance();
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/attendance/check-out');
      showToast(res.message, 'success');
      loadAttendance();
    } catch (err: any) {
      showToast(err.message || 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.download(
        '/reports/export/attendance',
        `StaffSync_Attendance_${new Date().toISOString().split('T')[0]}.csv`
      );
      showToast('Attendance report CSV downloaded successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to export attendance CSV', 'error');
    }
  };

  // Metrics computation from records
  const presentCount = records.filter(r => r.status === 'Present').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const halfDayCount = records.filter(r => r.status === 'Half-Day').length;
  const totalHoursLogged = records
    .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
    .toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header and Live Punch Widget */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Management</h1>
          <p className="text-xs text-slate-500">
            Work schedule: 09:30 AM - 06:00 PM • Grace period until 09:45 AM (Asia/Kolkata).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['HR', 'Manager'].includes(user?.role || '') && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV Audit</span>
            </button>
          )}

          {!todayRecord ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {actionLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Clock className="w-4 h-4" />}
              <span>Clock In Today</span>
            </button>
          ) : !todayRecord.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {actionLoading ? <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : <Clock className="w-4 h-4" />}
              <span>Clock Out Today</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Shift Completed ({todayRecord.totalHours} hrs)</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total Records</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{records.length}</p>
          <span className="text-[10px] text-slate-400">Audited logged shifts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">On-Time Arrivals</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
          <span className="text-[10px] text-slate-400">Before 09:45 AM threshold</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Late Arrivals</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
          <span className="text-[10px] text-slate-400">Grace period exceeded</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Hours Worked</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalHoursLogged}h</p>
          <span className="text-[10px] text-slate-400">{halfDayCount} half-day shifts</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Half-Day">Half-Day</option>
        </select>

        {['HR', 'Manager'].includes(user?.role || '') && (
          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none max-w-xs"
          >
            <option value="">All Team Members</option>
            {teamList.map(t => (
              <option key={t._id} value={t._id}>
                {t.fullName} ({t.employeeId})
              </option>
            ))}
          </select>
        )}

        {(startDate || endDate || statusFilter || employeeFilter) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('');
              setEmployeeFilter('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold tracking-wider uppercase">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out</th>
                <th className="py-3.5 px-4">Total Hours</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No attendance records found for the selected period.
                  </td>
                </tr>
              ) : (
                records.map(rec => {
                  const emp = rec.employee as User;
                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{emp?.fullName || user?.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{emp?.employeeId || user?.employeeId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 text-xs">
                        {rec.date}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                        {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                        {rec.checkOut
                          ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-amber-500 italic">In Progress</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                        {rec.totalHours ? `${rec.totalHours} hrs` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={rec.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-6 text-xs text-slate-500 max-w-xs truncate">
                        {rec.notes || 'Normal shift.'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
