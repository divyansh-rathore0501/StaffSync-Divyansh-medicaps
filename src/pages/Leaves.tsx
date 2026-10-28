import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import type { LeaveRequest, LeaveType, LeaveStatus, User } from '../types.js';

export const Leaves: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyLoading, setApplyLoading] = useState<boolean>(false);
  const [applyForm, setApplyForm] = useState<{
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Review Modal state (Approve / Reject)
  const [reviewRequest, setReviewRequest] = useState<{
    request: LeaveRequest;
    decision: 'Approved' | 'Rejected';
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  const loadLeaveRequests = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; requests: LeaveRequest[] }>('/leaves');
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading leave requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLeaveRequests();
  }, [loadLeaveRequests]);

  // Compute calculated duration in days
  const calculateDuration = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const currentDuration = calculateDuration(applyForm.startDate, applyForm.endDate);
  const availableBalance = user?.leaveBalances ? user.leaveBalances[applyForm.leaveType] : 0;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (currentDuration <= 0) {
      showToast('End date must be greater than or equal to start date.', 'error');
      return;
    }

    if (applyForm.leaveType !== 'unpaid' && availableBalance < currentDuration) {
      showToast(
        `Insufficient ${applyForm.leaveType} leave balance. Available: ${availableBalance}d, Requested: ${currentDuration}d`,
        'error'
      );
      return;
    }

    setApplyLoading(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/leaves/apply', applyForm);
      showToast(res.message, 'success');
      setShowApplyModal(false);
      setApplyForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      await Promise.all([loadLeaveRequests(), refreshUser()]);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit leave request', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleConfirmReview = async (reviewerComment?: string) => {
    if (!reviewRequest) return;
    setReviewLoading(true);
    try {
      const res = await api.put<{ success: boolean; message: string }>(
        `/leaves/${reviewRequest.request._id}/review`,
        {
          status: reviewRequest.decision,
          reviewerComment: reviewerComment || ''
        }
      );
      showToast(res.message, 'success');
      setReviewRequest(null);
      await Promise.all([loadLeaveRequests(), refreshUser()]);
    } catch (err: any) {
      showToast(err.message || 'Error processing leave decision', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      const res = await api.put<{ success: boolean; message: string }>(`/leaves/${id}/cancel`);
      showToast(res.message, 'success');
      loadLeaveRequests();
    } catch (err: any) {
      showToast(err.message || 'Error cancelling request', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.download(
        '/reports/export/leaves',
        `StaffSync_Leaves_${new Date().toISOString().split('T')[0]}.csv`
      );
      showToast('Leave requests audit CSV downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to export leaves CSV', 'error');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const displayedRequests = activeTab === 'pending' ? pendingRequests : requests;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-xs text-slate-500">
            Apply for absence, review team workflows, and audit policy allowances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['HR', 'Manager'].includes(user?.role || '') && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Annual Leave</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600">{user?.leaveBalances?.annual || 0}</span>
            <span className="text-xs text-slate-400">days left</span>
          </div>
          <span className="text-[10px] text-slate-400">Paid personal vacation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sick Leave</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{user?.leaveBalances?.sick || 0}</span>
            <span className="text-xs text-slate-400">days left</span>
          </div>
          <span className="text-[10px] text-slate-400">Medical recovery</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Casual Leave</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{user?.leaveBalances?.casual || 0}</span>
            <span className="text-xs text-slate-400">days left</span>
          </div>
          <span className="text-[10px] text-slate-400">Short personal notice</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Unpaid Taken</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-700">{user?.leaveBalances?.unpaid || 0}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-slate-400">Subject to approval</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {user?.role === 'Employee' ? 'My Leave Requests' : 'All Leave Requests'} ({requests.length})
        </button>

        {['HR', 'Manager'].includes(user?.role || '') && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded-full text-[10px]">
              {pendingRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs font-semibold tracking-wider uppercase">
                <th className="py-3.5 px-6">Applicant</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Duration & Dates</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin inline-block mr-2 align-middle" />
                    Loading leave requests...
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No leave requests found in this view.
                  </td>
                </tr>
              ) : (
                displayedRequests.map(req => {
                  const emp = req.employee as User;
                  const reviewer = req.reviewedBy as User;
                  const isMine = (emp?._id || emp) === user?._id;
                  const canReview = ['HR', 'Manager'].includes(user?.role || '') && req.status === 'Pending' && !isMine;

                  return (
                    <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-slate-900">{emp?.fullName || user?.fullName}</div>
                        <div className="text-xs text-slate-400 font-mono">{emp?.employeeId || user?.employeeId}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-xs text-slate-800">
                          {req.leaveType} Leave
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800">
                          {req.durationDays} day{req.durationDays > 1 ? 's' : ''}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {req.startDate} to {req.endDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <p className="line-clamp-2">{req.reason}</p>
                        {req.reviewerComment && (
                          <div className="mt-1 text-[11px] text-indigo-700 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100 italic">
                            Reviewer: "{req.reviewerComment}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} size="sm" />
                        {reviewer && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            by {reviewer.fullName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        {canReview ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setReviewRequest({ request: req, decision: 'Approved' })}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReviewRequest({ request: req, decision: 'Rejected' })}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isMine && req.status === 'Pending' ? (
                          <button
                            onClick={() => handleCancelRequest(req._id)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Submit date range for managerial authorization.</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={applyForm.leaveType}
                  onChange={e => setApplyForm({ ...applyForm, leaveType: e.target.value as LeaveType })}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="annual">Annual Leave ({user?.leaveBalances?.annual || 0} days available)</option>
                  <option value="sick">Sick Leave ({user?.leaveBalances?.sick || 0} days available)</option>
                  <option value="casual">Casual Leave ({user?.leaveBalances?.casual || 0} days available)</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={e => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={e => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {currentDuration > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-900">Total Requested Duration:</span>
                  <span className="font-bold text-indigo-700 font-mono">{currentDuration} Calendar Day(s)</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Absence</label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Provide brief details for your manager..."
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {applyLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Submit Leave Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Confirm Modal */}
      {reviewRequest && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setReviewRequest(null)}
          onConfirm={handleConfirmReview}
          title={`${reviewRequest.decision} Leave Request`}
          message={`Are you sure you want to mark ${(reviewRequest.request.employee as User)?.fullName}'s request for ${reviewRequest.request.durationDays} day(s) of ${reviewRequest.request.leaveType} leave as ${reviewRequest.decision}?`}
          confirmLabel={`${reviewRequest.decision} Request`}
          confirmVariant={reviewRequest.decision === 'Approved' ? 'success' : 'danger'}
          commentPlaceholder="Add optional reviewer feedback (visible to employee)..."
          isLoading={reviewLoading}
        />
      )}
    </div>
  );
};
