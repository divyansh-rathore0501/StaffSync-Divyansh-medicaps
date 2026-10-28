import React from 'react';
import type { AttendanceStatus, LeaveStatus, Role, UserStatus } from '../types.js';

interface StatusBadgeProps {
  status: AttendanceStatus | LeaveStatus | Role | UserStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    // Attendance
    case 'Present':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'Late':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'Half-Day':
      colorClasses = 'bg-orange-50 text-orange-700 border-orange-200/80';
      break;
    case 'Absent':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;

    // Leave
    case 'Approved':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'Pending':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      break;
    case 'Rejected':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      break;
    case 'Cancelled':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      break;

    // User status
    case 'Active':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      break;
    case 'Inactive':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
    case 'OnLeave':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      break;

    // Roles
    case 'HR':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200/80';
      break;
    case 'Manager':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      break;
    case 'Employee':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200/80';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 bg-current opacity-70" />
      {status}
    </span>
  );
};
