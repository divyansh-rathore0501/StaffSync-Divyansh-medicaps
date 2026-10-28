import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Plus, Users, Calendar, Award, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import type { TrainingProgram, Department, TrainingStatus } from '../types.js';

export const TrainingPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    department: '',
    startDate: '',
    endDate: '',
    capacity: 25
  });

  const loadPrograms = useCallback(async () => {
    try {
      const [progRes, deptRes] = await Promise.all([
        api.get<{ success: boolean; programs: TrainingProgram[] }>('/training'),
        api.get<{ success: boolean; departments: Department[] }>('/employees/departments')
      ]);

      if (progRes.success) setPrograms(progRes.programs);
      if (deptRes.success) setDepartments(deptRes.departments);
    } catch (err: any) {
      showToast(err.message || 'Error loading training catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handleEnroll = async (programId: string) => {
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/training/${programId}/enroll`);
      showToast(res.message, 'success');
      loadPrograms();
    } catch (err: any) {
      showToast(err.message || 'Enrollment failed', 'error');
    }
  };

  const handleUpdateStatus = async (enrollmentId: string, nextStatus: TrainingStatus) => {
    try {
      const res = await api.put<{ success: boolean; message: string }>(
        `/training/enrollment/${enrollmentId}`,
        { status: nextStatus }
      );
      showToast(res.message, 'success');
      loadPrograms();
    } catch (err: any) {
      showToast(err.message || 'Error updating course status', 'error');
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/training', formData);
      showToast(res.message, 'success');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        instructor: '',
        department: '',
        startDate: '',
        endDate: '',
        capacity: 25
      });
      loadPrograms();
    } catch (err: any) {
      showToast(err.message || 'Error registering program', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Training & Development</h1>
          <p className="text-xs text-slate-500">
            Professional skill programs, agile engineering workshops, and leadership certifications.
          </p>
        </div>

        {['HR', 'Manager'].includes(user?.role || '') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Training Program</span>
          </button>
        )}
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
            <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mr-2 align-middle" />
            Loading courses...
          </div>
        ) : programs.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200 text-xs">
            No training programs listed yet.
          </div>
        ) : (
          programs.map(prog => {
            const isFull = (prog.enrolledCount || 0) >= prog.capacity;
            const dept = prog.department as Department;

            return (
              <div
                key={prog._id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {dept?.name || 'All Departments'}
                    </span>
                    {prog.isUserEnrolled && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {prog.userStatus}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {prog.description}
                  </p>

                  <div className="space-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Instructor: <strong className="text-slate-800">{prog.instructor}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{new Date(prog.startDate).toLocaleDateString()} to {new Date(prog.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Capacity: {prog.enrolledCount || 0} / {prog.capacity} seats filled
                      </span>
                    </div>
                  </div>

                  {/* Progress bar of enrollment */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${Math.min(100, (((prog.enrolledCount || 0) / prog.capacity) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {!prog.isUserEnrolled ? (
                    <button
                      onClick={() => handleEnroll(prog._id)}
                      disabled={isFull}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      <span>{isFull ? 'Program Full' : 'Enroll in Program'}</span>
                      {!isFull && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500">
                        Update Your Progress:
                      </div>
                      <div className="flex gap-2">
                        {prog.userStatus !== 'In-Progress' && prog.userStatus !== 'Completed' && (
                          <button
                            onClick={() => handleUpdateStatus(prog.enrollmentId!, 'In-Progress')}
                            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Start Course
                          </button>
                        )}
                        {prog.userStatus !== 'Completed' && (
                          <button
                            onClick={() => handleUpdateStatus(prog.enrollmentId!, 'Completed')}
                            className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                        {prog.userStatus === 'Completed' && (
                          <div className="w-full text-center py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Certificate Achieved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register Training Program</h3>
                <p className="text-xs text-slate-500">Provide curriculum details and participant capacity.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Distributed Cloud Architecture Masterclass"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor / Provider</label>
                <input
                  type="text"
                  required
                  value={formData.instructor}
                  onChange={e => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="e.g. Dr. Gregory Finch (Principal Architect)"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="">All Departments (Org-Wide)</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Syllabus</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key learning outcomes and prerequisites..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Register Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
