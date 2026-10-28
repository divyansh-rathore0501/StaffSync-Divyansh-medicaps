import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { ILeaveRequest, LeaveType, LeaveStatus, INotification } from '../types.js';

export const applyLeave = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { leaveType, startDate, endDate, reason } = req.body as {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  };

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Leave type, start date, end date, and reason are required.'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format provided.'
    });
  }

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: 'Leave end date cannot be earlier than start date.'
    });
  }

  // Calculate inclusive duration in calendar days (or working days)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const user = db.users.find(u => u._id === req.user!._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check leave balance
  if (leaveType !== 'unpaid') {
    const balance = user.leaveBalances[leaveType] || 0;
    if (balance < durationDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. Available: ${balance} day(s), requested: ${durationDays} day(s).`
      });
    }
  }

  // Check overlapping leave requests
  const startStr = startDate.split('T')[0];
  const endStr = endDate.split('T')[0];

  const hasOverlap = db.leaves.some(l => {
    const empId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
    if (empId !== user._id) return false;
    if (!['Pending', 'Approved'].includes(l.status)) return false;

    const lStart = l.startDate.split('T')[0];
    const lEnd = l.endDate.split('T')[0];

    // overlap condition
    return startStr <= lEnd && endStr >= lStart;
  });

  if (hasOverlap) {
    return res.status(400).json({
      success: false,
      message: 'An overlapping leave request is already active or pending for these dates.'
    });
  }

  const now = new Date().toISOString();
  const newLeave: ILeaveRequest = {
    _id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    employee: user._id,
    leaveType,
    startDate: startStr,
    endDate: endStr,
    durationDays,
    reason: reason.trim(),
    status: 'Pending',
    reviewedBy: null,
    reviewerComment: '',
    reviewedAt: null,
    createdAt: now,
    updatedAt: now
  };

  db.leaves.unshift(newLeave);

  // Notify manager if assigned
  const mgrId = typeof user.manager === 'object' && user.manager ? user.manager._id : user.manager;
  if (mgrId) {
    const notif: INotification = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient: mgrId,
      title: 'New Leave Request Submitted',
      message: `${user.fullName} submitted a request for ${durationDays} day(s) of ${leaveType} leave.`,
      type: 'Leave',
      isRead: false,
      linkUrl: '/leaves',
      createdAt: now,
      updatedAt: now
    };
    db.notifications.unshift(notif);
  }

  db.save();

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully and routed for managerial review.',
    leave: db.populateLeave(newLeave)
  });
};

export const getLeaveRequests = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let list = [...db.leaves];

  if (req.user.role === 'Employee') {
    list = list.filter(l => {
      const empId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
      return empId === req.user!._id;
    });
  } else if (req.user.role === 'Manager') {
    const teamIds = db.users.filter(u => {
      const uMgrId = typeof u.manager === 'object' && u.manager ? u.manager._id : u.manager;
      return uMgrId === req.user!._id || u._id === req.user!._id;
    }).map(u => u._id);

    list = list.filter(l => {
      const empId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
      return teamIds.includes(empId);
    });
  }
  // HR gets all requests

  // Sort newest first
  list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const populated = list.map(l => db.populateLeave(l));

  res.json({
    success: true,
    count: populated.length,
    requests: populated
  });
};

export const reviewLeaveRequest = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.params;
  const { status, reviewerComment } = req.body as {
    status: LeaveStatus;
    reviewerComment?: string;
  };

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Review decision status must be Approved or Rejected.'
    });
  }

  const leave = db.leaves.find(l => l._id === id);
  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found.' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({
      success: false,
      message: `This leave request is already ${leave.status} and cannot be modified.`
    });
  }

  const applicant = db.users.find(u => {
    const empId = typeof leave.employee === 'object' && leave.employee ? leave.employee._id : leave.employee;
    return u._id === empId;
  });

  if (!applicant) {
    return res.status(404).json({ success: false, message: 'Applicant record not found.' });
  }

  // Manager authorization check: can only approve own team members
  if (req.user.role === 'Manager') {
    const uMgrId = typeof applicant.manager === 'object' && applicant.manager ? applicant.manager._id : applicant.manager;
    if (uMgrId !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Managers can only review leave requests from their assigned team.'
      });
    }
  }

  const now = new Date().toISOString();
  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewerComment = reviewerComment?.trim() || '';
  leave.reviewedAt = now;
  leave.updatedAt = now;

  // Deduct leave balance upon approval (except for unpaid leave)
  if (status === 'Approved' && leave.leaveType !== 'unpaid') {
    const currentBal = applicant.leaveBalances[leave.leaveType] || 0;
    applicant.leaveBalances[leave.leaveType] = Math.max(0, currentBal - leave.durationDays);
    applicant.updatedAt = now;
  }

  // Send notification to employee
  const notif: INotification = {
    _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipient: applicant._id,
    title: `Leave Request ${status}`,
    message: `Your ${leave.leaveType} leave request (${leave.durationDays} day(s)) has been ${status.toLowerCase()} by ${req.user.fullName}.${reviewerComment ? ` Note: "${reviewerComment}"` : ''}`,
    type: 'Leave',
    isRead: false,
    linkUrl: '/leaves',
    createdAt: now,
    updatedAt: now
  };
  db.notifications.unshift(notif);

  db.save();

  res.json({
    success: true,
    message: `Leave request has been marked as ${status}.`,
    leave: db.populateLeave(leave)
  });
};

export const cancelLeaveRequest = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.params;
  const leave = db.leaves.find(l => {
    const empId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
    return l._id === id && empId === req.user!._id;
  });

  if (!leave) {
    return res.status(404).json({ success: false, message: 'Leave request not found or not owned by you.' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({
      success: false,
      message: `Only Pending requests can be cancelled. Current status: ${leave.status}.`
    });
  }

  leave.status = 'Cancelled';
  leave.updatedAt = new Date().toISOString();
  db.save();

  res.json({
    success: true,
    message: 'Leave request has been successfully cancelled.'
  });
};
