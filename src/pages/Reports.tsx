import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  CalendarCheck,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, filename: string, key: string) => {
    setDownloading(key);
    try {
      await api.download(endpoint, filename);
      showToast(`${filename} successfully downloaded.`, 'success');
    } catch (err: any) {
      showToast('Export failed. Please check network connection.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Reports & Analytics</h1>
        <p className="text-xs text-slate-500">
          Export verified HRMS audit datasets to CSV with standard schema integrity.
        </p>
      </div>

      {/* Report Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Export Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Attendance Shift Logs
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete historical record of employee clock-in and clock-out timestamps, calculated worked hours, late arrivals, and half-day records.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
              <div>• Fields: ID, Name, Email, Date, In, Out, Hours, Status</div>
              <div>• Formatted for payroll and timekeeping audits</div>
            </div>
          </div>

          <button
            onClick={() =>
              handleDownload(
                '/reports/export/attendance',
                `StaffSync_Attendance_Audit_${todayStr}.csv`,
                'attendance'
              )
            }
            disabled={downloading === 'attendance'}
            className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            {downloading === 'attendance' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Attendance CSV</span>
          </button>
        </div>

        {/* Leave Requests Export Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Leave Requests & Approvals
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Comprehensive audit trail of all leave applications across annual, sick, casual, and unpaid categories, including reviewer decisions and notes.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
              <div>• Fields: Request ID, Dates, Duration, Status, Reviewer Note</div>
              <div>• Tracks balance deductions and compliance</div>
            </div>
          </div>

          <button
            onClick={() =>
              handleDownload(
                '/reports/export/leaves',
                `StaffSync_Leave_Audit_${todayStr}.csv`,
                'leaves'
              )
            }
            disabled={downloading === 'leaves'}
            className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            {downloading === 'leaves' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Leave Audit CSV</span>
          </button>
        </div>

        {/* Employee Directory Export Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Active Workforce Roster
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full employee directory export with department mappings, managerial hierarchies, role assignments, phone numbers, and current leave balances.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
              <div>• Fields: Employee ID, Name, Department, Role, Balances</div>
              <div>• Ideal for organization charting and HR reporting</div>
            </div>
          </div>

          <button
            onClick={() =>
              handleDownload(
                '/reports/export/employees',
                `StaffSync_Workforce_Roster_${todayStr}.csv`,
                'employees'
              )
            }
            disabled={downloading === 'employees'}
            className="mt-6 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            {downloading === 'employees' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Export Workforce Roster</span>
          </button>
        </div>
      </div>

      {/* Compliance Information */}
      <div className="p-6 bg-slate-900 rounded-3xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Data Protection & Privacy Notice</h4>
            <p className="text-xs text-slate-400">
              Generated reports contain non-sensitive employee workforce attributes. Exported files are logged for organizational compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
