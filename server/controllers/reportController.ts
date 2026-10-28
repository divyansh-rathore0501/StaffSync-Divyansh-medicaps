import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getDashboardStats = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (req.user.role === 'HR') {
    const activeEmployees = db.users.filter(u => u.status === 'Active');
    const totalEmployees = activeEmployees.length;

    const todayAttendance = db.attendance.filter(a => a.date === todayStr);
    const presentToday = todayAttendance.length;
    const absentToday = Math.max(0, totalEmployees - presentToday);

    const pendingLeaves = db.leaves.filter(l => l.status === 'Pending').length;
    const upcomingApprovedLeaves = db.leaves.filter(l => l.status === 'Approved' && l.startDate >= todayStr).length;

    // Dept distribution
    const deptDistribution = db.departments.map(d => {
      const count = activeEmployees.filter(u => {
        const dId = typeof u.department === 'object' && u.department ? u.department._id : u.department;
        return dId === d._id;
      }).length;
      return {
        name: d.name.split('&')[0].trim(), // cleaner chart labels
        fullName: d.name,
        code: d.code,
        count
      };
    });

    // Attendance breakdown
    const onTimeCount = todayAttendance.filter(a => a.status === 'Present').length;
    const lateCount = todayAttendance.filter(a => a.status === 'Late').length;
    const halfDayCount = todayAttendance.filter(a => a.status === 'Half-Day').length;

    const recentActivity = [
      ...db.leaves.slice(0, 3).map(l => {
        const p = db.populateLeave(l);
        return {
          id: l._id,
          type: 'Leave',
          title: `${(p.employee as any)?.fullName} applied for ${l.durationDays}d ${l.leaveType} leave`,
          time: l.createdAt,
          status: l.status
        };
      }),
      ...db.attendance.slice(0, 3).map(a => {
        const p = db.populateAttendance(a);
        return {
          id: a._id,
          type: 'Attendance',
          title: `${(p.employee as any)?.fullName} checked in (${a.status})`,
          time: a.checkIn,
          status: a.status
        };
      })
    ].sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 5);

    return res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        pendingLeaves,
        upcomingApprovedLeaves,
        deptDistribution,
        attendanceBreakdown: {
          present: onTimeCount,
          late: lateCount,
          halfDay: halfDayCount,
          absent: absentToday
        },
        recentActivity
      }
    });
  }

  if (req.user.role === 'Manager') {
    const mgrId = req.user._id;
    const teamMembers = db.users.filter(u => {
      const uMgrId = typeof u.manager === 'object' && u.manager ? u.manager._id : u.manager;
      return uMgrId === mgrId && u.status === 'Active';
    });

    const teamIds = teamMembers.map(m => m._id);
    const totalTeam = teamIds.length;

    const teamTodayAttendance = db.attendance.filter(a => {
      const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
      return a.date === todayStr && teamIds.includes(eId);
    });

    const presentToday = teamTodayAttendance.length;
    const absentToday = Math.max(0, totalTeam - presentToday);

    const pendingLeaves = db.leaves.filter(l => {
      const eId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
      return teamIds.includes(eId) && l.status === 'Pending';
    }).length;

    const upcomingAbsences = db.leaves.filter(l => {
      const eId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
      return teamIds.includes(eId) && l.status === 'Approved' && l.startDate >= todayStr;
    }).length;

    // Team training courses
    const teamTraining = db.trainingEnrollments.filter(e => {
      const eId = typeof e.employee === 'object' && e.employee ? e.employee._id : e.employee;
      return teamIds.includes(eId);
    }).length;

    return res.json({
      success: true,
      stats: {
        totalTeam,
        presentToday,
        absentToday,
        pendingLeaves,
        upcomingAbsences,
        teamTraining,
        teamMembersCount: totalTeam
      }
    });
  }

  // Employee stats
  const user = db.users.find(u => u._id === req.user!._id);
  const myPendingLeaves = db.leaves.filter(l => {
    const eId = typeof l.employee === 'object' && l.employee ? l.employee._id : l.employee;
    return eId === req.user!._id && l.status === 'Pending';
  }).length;

  const todayRecord = db.attendance.find(a => {
    const eId = typeof a.employee === 'object' && a.employee ? a.employee._id : a.employee;
    return eId === req.user!._id && a.date === todayStr;
  });

  const enrolledCount = db.trainingEnrollments.filter(e => {
    const eId = typeof e.employee === 'object' && e.employee ? e.employee._id : e.employee;
    return eId === req.user!._id;
  }).length;

  res.json({
    success: true,
    stats: {
      leaveBalances: user?.leaveBalances || { annual: 0, sick: 0, casual: 0, unpaid: 0 },
      myPendingLeaves,
      todayAttendance: todayRecord ? db.populateAttendance(todayRecord) : null,
      enrolledProgramsCount: enrolledCount
    }
  });
};

export const exportAttendanceCSV = (_req: AuthenticatedRequest, res: Response) => {
  const records = db.attendance.map(a => db.populateAttendance(a));

  let csv = 'Employee ID,Full Name,Email,Date,Check-In,Check-Out,Hours Worked,Status,Notes\n';
  records.forEach(r => {
    const emp = r.employee as any;
    const notesClean = (r.notes || '').replace(/"/g, '""');
    csv += `"${emp?.employeeId || ''}","${emp?.fullName || ''}","${emp?.email || ''}","${r.date}","${r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : ''}","${r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : ''}","${r.totalHours}","${r.status}","${notesClean}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`StaffSync_Attendance_Audit_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
};

export const exportLeavesCSV = (_req: AuthenticatedRequest, res: Response) => {
  const requests = db.leaves.map(l => db.populateLeave(l));

  let csv = 'Request ID,Employee ID,Full Name,Email,Leave Type,Start Date,End Date,Duration Days,Status,Reviewer,Reviewer Comment\n';
  requests.forEach(r => {
    const emp = r.employee as any;
    const rev = r.reviewedBy as any;
    csv += `"${r._id}","${emp?.employeeId || ''}","${emp?.fullName || ''}","${emp?.email || ''}","${r.leaveType}","${r.startDate}","${r.endDate}","${r.durationDays}","${r.status}","${rev?.fullName || ''}","${(r.reviewerComment || '').replace(/"/g, '""')}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`StaffSync_Leave_Audit_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
};

export const exportEmployeesCSV = (_req: AuthenticatedRequest, res: Response) => {
  const emps = db.users.map(u => db.populateUser(u._id)!);

  let csv = 'Employee ID,Full Name,Email,Phone,Department,Job Title,Role,Status,Joining Date,Annual Leave Bal,Sick Leave Bal\n';
  emps.forEach(e => {
    const dept = e.department as any;
    csv += `"${e.employeeId}","${e.fullName}","${e.email}","${e.phoneNumber || ''}","${dept?.name || ''}","${e.jobTitle}","${e.role}","${e.status}","${e.joiningDate.split('T')[0]}","${e.leaveBalances.annual}","${e.leaveBalances.sick}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`StaffSync_Employee_Directory_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
};
