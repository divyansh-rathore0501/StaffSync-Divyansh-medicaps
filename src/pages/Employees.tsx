import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Building,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import type { User, Department, Role, UserStatus } from '../types.js';

export const Employees: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [inspectEmployee, setInspectEmployee] = useState<User | null>(null);
  const [statusModalEmployee, setStatusModalEmployee] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: '',
    manager: '',
    role: 'Employee' as Role,
    jobTitle: '',
    phoneNumber: '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const loadEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (selectedDept) params.append('department', selectedDept);
      if (selectedRole) params.append('role', selectedRole);
      if (selectedStatus) params.append('status', selectedStatus);

      const [empRes, deptRes] = await Promise.all([
        api.get<{
          success: boolean;
          employees: User[];
          total: number;
          pages: number;
        }>(`/employees?${params.toString()}`),
        api.get<{ success: boolean; departments: Department[] }>('/employees/departments')
      ]);

      if (empRes.success) {
        setEmployees(empRes.employees);
        setTotalCount(empRes.total);
        setTotalPages(empRes.pages || 1);
      }
      if (deptRes.success) {
        setDepartments(deptRes.departments);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading employee directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, selectedRole, selectedStatus, showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Load managers for assignment
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get<{ success: boolean; employees: User[] }>('/employees?role=Manager');
        if (res.success) setManagers(res.employees);
      } catch (err) {}
    };
    if (user?.role === 'HR') fetchManagers();
  }, [user]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/employees', formData);
      showToast(res.message, 'success');
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        department: '',
        manager: '',
        role: 'Employee',
        jobTitle: '',
        phoneNumber: '',
        joiningDate: new Date().toISOString().split('T')[0]
      });
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to enroll employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setActionLoading(true);
    try {
      const res = await api.put<{ success: boolean; message: string }>(
        `/employees/${editingEmployee._id}`,
        formData
      );
      showToast(res.message, 'success');
      setEditingEmployee(null);
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to update employee', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      email: emp.email,
      password: '',
      department: typeof emp.department === 'object' ? emp.department._id : emp.department,
      manager: typeof emp.manager === 'object' && emp.manager ? emp.manager._id : (emp.manager as string) || '',
      role: emp.role,
      jobTitle: emp.jobTitle,
      phoneNumber: emp.phoneNumber || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : ''
    });
  };

  const handleToggleStatus = async () => {
    if (!statusModalEmployee) return;
    const nextStatus: UserStatus = statusModalEmployee.status === 'Active' ? 'Inactive' : 'Active';

    setActionLoading(true);
    try {
      await api.put(`/employees/${statusModalEmployee._id}`, { status: nextStatus });
      showToast(`Employee ${statusModalEmployee.fullName} marked as ${nextStatus}.`, 'success');
      setStatusModalEmployee(null);
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500">
            {totalCount} total workforce members • Manage profiles, assignments, and roles.
          </p>
        </div>

        {user?.role === 'HR' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, employee ID, or email..."
            className="w-full text-xs lg:text-sm pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDept}
            onChange={e => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={e => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="HR">HR Administrator</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold tracking-wider uppercase">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No employees matching the criteria found.
                  </td>
                </tr>
              ) : (
                employees.map(emp => {
                  const dept = typeof emp.department === 'object' ? emp.department?.name : 'Unassigned';
                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold flex items-center justify-center shrink-0 text-xs">
                            {emp.fullName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.fullName}</div>
                            <div className="text-xs text-slate-500">{emp.jobTitle}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                        {emp.employeeId}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {dept}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.role} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectEmployee(emp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user?.role === 'HR' && (
                            <>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setStatusModalEmployee(emp)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  emp.status === 'Active'
                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={emp.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                              >
                                {emp.status === 'Active' ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enroll New Employee</h3>
                <p className="text-xs text-slate-500">Create a verified employee account in StaffSync.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="maya.lin@staffsync.com"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Defaults to StaffSync2026!"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    required
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="e.g. Cloud Security Specialist"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">None / Executive</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.fullName} ({m.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Enroll Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Employee: {editingEmployee.fullName}</h3>
                <p className="text-xs text-slate-500">Employee ID: {editingEmployee.employeeId}</p>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    required
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="HR">HR Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">None / Executive</option>
                    {managers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.fullName} ({m.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Employee Side Drawer */}
      {inspectEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center">
                    {inspectEmployee.fullName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">
                      {inspectEmployee.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{inspectEmployee.jobTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectEmployee(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Employee ID</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{inspectEmployee.employeeId}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{inspectEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{inspectEmployee.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{typeof inspectEmployee.department === 'object' ? inspectEmployee.department?.name : 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Role: <strong className="text-slate-900">{inspectEmployee.role}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Joined: {new Date(inspectEmployee.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Leave Balances in profile */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                    Leave Balances (Days)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Annual</span>
                      <p className="text-lg font-bold text-indigo-700">{inspectEmployee.leaveBalances?.annual || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Sick</span>
                      <p className="text-lg font-bold text-emerald-700">{inspectEmployee.leaveBalances?.sick || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Casual</span>
                      <p className="text-lg font-bold text-amber-700">{inspectEmployee.leaveBalances?.casual || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Unpaid Taken</span>
                      <p className="text-lg font-bold text-slate-700">{inspectEmployee.leaveBalances?.unpaid || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInspectEmployee(null)}
              className="w-full mt-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Confirm Deactivation Modal */}
      <ConfirmModal
        isOpen={!!statusModalEmployee}
        onClose={() => setStatusModalEmployee(null)}
        onConfirm={handleToggleStatus}
        title={statusModalEmployee?.status === 'Active' ? 'Deactivate Employee Account?' : 'Reactivate Employee Account?'}
        message={
          statusModalEmployee?.status === 'Active'
            ? `Are you sure you want to deactivate ${statusModalEmployee?.fullName}? They will be blocked from logging in until reactivated.`
            : `Reactivate ${statusModalEmployee?.fullName}'s account so they can sign in and mark attendance?`
        }
        confirmLabel={statusModalEmployee?.status === 'Active' ? 'Deactivate' : 'Reactivate'}
        confirmVariant={statusModalEmployee?.status === 'Active' ? 'danger' : 'success'}
        isLoading={actionLoading}
      />
    </div>
  );
};
