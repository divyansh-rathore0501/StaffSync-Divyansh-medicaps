import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  Megaphone,
  GraduationCap,
  FileBarChart,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/employees',
      label: 'Employee Directory',
      icon: Users,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: Clock,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/leaves',
      label: 'Leave Management',
      icon: CalendarCheck,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/announcements',
      label: 'Announcements',
      icon: Megaphone,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/training',
      label: 'Training & Skills',
      icon: GraduationCap,
      roles: ['HR', 'Manager', 'Employee']
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileBarChart,
      roles: ['HR', 'Manager']
    },
    {
      to: '/profile',
      label: 'Account Profile',
      icon: UserCheck,
      roles: ['HR', 'Manager', 'Employee']
    }
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const getInitials = (name?: string) => {
    if (!name) return 'SS';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 shrink-0">
              <span className="tracking-tighter text-base">SS</span>
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-base tracking-tight">StaffSync</span>
                  <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                    HRMS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Simplifying People. Empowering Teams.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </div>
          )}

          {filteredNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* User Card / Role indicator & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                  {getInitials(user?.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{user?.fullName}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{user?.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 rounded-xl transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full p-2.5 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
