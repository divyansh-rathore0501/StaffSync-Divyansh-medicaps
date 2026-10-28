import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, Check, Clock, User as UserIcon, Calendar, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import type { NotificationItem, Role } from '../types.js';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMobileMenuToggle,
  globalSearch,
  setGlobalSearch
}) => {
  const { user, quickSwitchDemo } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [switching, setSwitching] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await api.get<{
        success: boolean;
        notifications: NotificationItem[];
        unreadCount: number;
      }>('/notifications');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // quiet fail on background fetch
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleSwitch = async (role: Role) => {
    if (user?.role === role) return;
    setSwitching(true);
    try {
      await quickSwitchDemo(role);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'Leave':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'Attendance':
        return <Clock className="w-4 h-4 text-emerald-500" />;
      case 'Training':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Mobile Menu & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search employees, policies, teams..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs lg:text-sm pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right controls: Demo Role Switcher + Notification Bell + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Quick Demo Switcher Pill (Critical for Mentor Evaluation) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="text-[11px] font-semibold text-slate-500 px-2 select-none">
            Demo Persona:
          </span>
          {(['HR', 'Manager', 'Employee'] as Role[]).map(role => {
            const isActive = user?.role === role;
            return (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                disabled={switching}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No notifications at this moment
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        n.isRead ? 'bg-white' : 'bg-indigo-50/30'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString()} •{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar & Profile link */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          title="Account Profile"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.fullName
              ? user.fullName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {user?.fullName}
            </p>
            <p className="text-[10px] font-medium text-slate-500 leading-tight">
              {user?.role}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};
