import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { IAttendance, AttendanceStatus } from '../types.js';

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const checkIn = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const today = getTodayDateString();
  const userId = req.user._id;

  // Check if attendance already exists for today
  const existing = db.attendance.find(a => {
    const empId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
    return empId === userId && a.date === today;
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You have already checked in for today.'
    });
  }

  const now = new Date();
  const isoNow = now.toISOString();

  // Standard workday schedule starts at 09:30. Grace period until 09:45.
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isLate = hours > 9 || (hours === 9 && minutes > 45);
  const status: AttendanceStatus = isLate ? 'Late' : 'Present';

  const record: IAttendance = {
    _id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    employee: userId,
    date: today,
    checkIn: isoNow,
    checkOut: null,
    totalHours: 0,
    status,
    notes: isLate ? 'Check-in recorded after 09:45 AM grace threshold.' : 'On-time morning check-in.',
    createdAt: isoNow,
    updatedAt: isoNow
  };

  db.attendance.unshift(record);
  db.save();

  res.status(201).json({
    success: true,
    message: isLate ? 'Checked in (marked Late as arrival was past 09:45 AM).' : 'Checked in successfully on time!',
    record: db.populateAttendance(record)
  });
};

export const checkOut = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const today = getTodayDateString();
  const userId = req.user._id;

  const record = db.attendance.find(a => {
    const empId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
    return empId === userId && a.date === today;
  });

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No active check-in record found for today. Please check in first.'
    });
  }

  if (record.checkOut) {
    return res.status(400).json({
      success: false,
      message: 'You have already completed your check-out for today.'
    });
  }

  const now = new Date();
  const checkInTime = new Date(record.checkIn);
  const diffHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
  const totalHours = Math.max(0, parseFloat(diffHours.toFixed(2)));

  record.checkOut = now.toISOString();
  record.totalHours = totalHours;

  if (totalHours < 4) {
    record.status = 'Half-Day';
    record.notes = (record.notes ? record.notes + ' ' : '') + `Shift duration (${totalHours}h) fell below minimum 4-hour threshold.`;
  }

  record.updatedAt = now.toISOString();
  db.save();

  res.json({
    success: true,
    message: `Checked out successfully. Total shift duration: ${totalHours} hours.`,
    record: db.populateAttendance(record)
  });
};

export const getTodayStatus = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const today = getTodayDateString();
  const userId = req.user._id;

  const record = db.attendance.find(a => {
    const empId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
    return empId === userId && a.date === today;
  });

  res.json({
    success: true,
    date: today,
    record: record ? db.populateAttendance(record) : null
  });
};

export const getAttendanceHistory = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { startDate, endDate, employeeId, status } = req.query as Record<string, string>;
  let list = [...db.attendance];

  if (req.user.role === 'Employee') {
    list = list.filter(a => {
      const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
      return eId === req.user!._id;
    });
  } else if (req.user.role === 'Manager') {
    // Team member IDs
    const team = db.users.filter(u => {
      const uMgrId = typeof u.manager === 'object' && u.manager ? u.manager._id : u.manager;
      return uMgrId === req.user!._id || u._id === req.user!._id;
    }).map(u => u._id);

    list = list.filter(a => {
      const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
      return team.includes(eId);
    });

    if (employeeId) {
      list = list.filter(a => {
        const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
        return eId === employeeId;
      });
    }
  } else if (req.user.role === 'HR') {
    if (employeeId) {
      list = list.filter(a => {
        const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
        return eId === employeeId;
      });
    }
  }

  if (startDate) {
    list = list.filter(a => a.date >= startDate);
  }
  if (endDate) {
    list = list.filter(a => a.date <= endDate);
  }
  if (status) {
    list = list.filter(a => a.status === status);
  }

  // Sort by date descending
  list.sort((a, b) => (b.date > a.date ? 1 : -1));

  const populatedList = list.map(a => db.populateAttendance(a));

  res.json({
    success: true,
    count: populatedList.length,
    records: populatedList
  });
};
