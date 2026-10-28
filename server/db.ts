import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import type {
  IUser,
  IDepartment,
  IAttendance,
  ILeaveRequest,
  IAnnouncement,
  INotification,
  ITrainingProgram,
  ITrainingEnrollment
} from './types.js';

interface DatabaseSchema {
  departments: IDepartment[];
  users: IUser[];
  attendance: IAttendance[];
  leaves: ILeaveRequest[];
  announcements: IAnnouncement[];
  notifications: INotification[];
  trainingPrograms: ITrainingProgram[];
  trainingEnrollments: ITrainingEnrollment[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'staffsync_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    departments: [],
    users: [],
    attendance: [],
    leaves: [],
    announcements: [],
    notifications: [],
    trainingPrograms: [],
    trainingEnrollments: []
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.initialized) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        if (raw.trim()) {
          this.data = JSON.parse(raw);
          // Quick integrity check: if no users, seed
          if (!this.data.users || this.data.users.length === 0) {
            this.seedInitialData();
          }
        } else {
          this.seedInitialData();
        }
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.error('[StaffSync DB] Error reading database file, reseeding:', err);
      this.seedInitialData();
    }
    this.initialized = true;
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StaffSync DB] Failed to persist data to disk:', err);
    }
  }

  public resetAndSeed() {
    this.seedInitialData();
  }

  public seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const hash = (pwd: string) => bcrypt.hashSync(pwd, salt);

    const now = new Date();
    const isoNow = now.toISOString();

    const depts: IDepartment[] = [
      {
        _id: 'dept_eng',
        name: 'Engineering & Technology',
        code: 'ENG',
        description: 'Software development, cloud systems, and platform infrastructure.',
        isActive: true,
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'dept_hr',
        name: 'Human Resources & People Ops',
        code: 'HRD',
        description: 'Talent acquisition, employee experience, and organizational growth.',
        isActive: true,
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'dept_dsn',
        name: 'Product Design & UX',
        code: 'DSN',
        description: 'User interface design, design systems, and product research.',
        isActive: true,
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'dept_ops',
        name: 'Business Operations & Finance',
        code: 'OPS',
        description: 'Financial planning, compliance, and workplace operations.',
        isActive: true,
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    const users: IUser[] = [
      // 1. HR Administrator
      {
        _id: 'user_hr_1',
        employeeId: 'SS-HR-001',
        fullName: 'Elena Rostova',
        email: 'hr@staffsync.com',
        password: hash('AdminPassword123!'),
        role: 'HR',
        department: 'dept_hr',
        manager: null,
        jobTitle: 'VP of Human Resources & Culture',
        phoneNumber: '+1 (555) 234-5678',
        joiningDate: '2023-01-15T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 24, sick: 12, casual: 8, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // 2. Engineering Manager
      {
        _id: 'user_mgr_1',
        employeeId: 'SS-MGR-002',
        fullName: 'Marcus Sterling',
        email: 'manager@staffsync.com',
        password: hash('ManagerPassword123!'),
        role: 'Manager',
        department: 'dept_eng',
        manager: 'user_hr_1',
        jobTitle: 'Director of Software Engineering',
        phoneNumber: '+1 (555) 345-6789',
        joiningDate: '2023-03-01T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 20, sick: 10, casual: 7, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // 3. Team Member / Employee
      {
        _id: 'user_emp_1',
        employeeId: 'SS-DEV-003',
        fullName: 'Aiden Vance',
        email: 'employee@staffsync.com',
        password: hash('EmployeePassword123!'),
        role: 'Employee',
        department: 'dept_eng',
        manager: 'user_mgr_1',
        jobTitle: 'Senior Full-Stack Engineer',
        phoneNumber: '+1 (555) 456-7890',
        joiningDate: '2023-08-10T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 16, sick: 9, casual: 6, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // Additional team members for rich org chart
      {
        _id: 'user_emp_2',
        employeeId: 'SS-DEV-004',
        fullName: 'Sophia Chen',
        email: 'sophia.chen@staffsync.com',
        password: hash('StaffSync2026!'),
        role: 'Employee',
        department: 'dept_eng',
        manager: 'user_mgr_1',
        jobTitle: 'Frontend Engineer',
        phoneNumber: '+1 (555) 567-8901',
        joiningDate: '2024-02-15T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 18, sick: 10, casual: 7, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'user_emp_3',
        employeeId: 'SS-DSN-005',
        fullName: 'Lucas Oliveira',
        email: 'lucas.oliveira@staffsync.com',
        password: hash('StaffSync2026!'),
        role: 'Employee',
        department: 'dept_dsn',
        manager: 'user_hr_1',
        jobTitle: 'Lead Product Designer',
        phoneNumber: '+1 (555) 678-9012',
        joiningDate: '2023-11-01T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 15, sick: 10, casual: 5, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'user_emp_4',
        employeeId: 'SS-OPS-006',
        fullName: 'Zara Al-Mansoor',
        email: 'zara.mansoor@staffsync.com',
        password: hash('StaffSync2026!'),
        role: 'Employee',
        department: 'dept_ops',
        manager: 'user_hr_1',
        jobTitle: 'Financial Operations Analyst',
        phoneNumber: '+1 (555) 789-0123',
        joiningDate: '2024-05-20T09:00:00.000Z',
        status: 'Active',
        leaveBalances: { annual: 19, sick: 10, casual: 7, unpaid: 0 },
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    // Seed attendance for today and past days
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const attendance: IAttendance[] = [
      // Today: Aiden Vance checked in at 09:12 AM
      {
        _id: 'att_today_1',
        employee: 'user_emp_1',
        date: todayStr,
        checkIn: `${todayStr}T09:12:00.000Z`,
        checkOut: null,
        totalHours: 0,
        status: 'Present',
        notes: 'Checked in on schedule from Web Dashboard.',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // Today: Sophia Chen checked in at 09:50 AM (Late)
      {
        _id: 'att_today_2',
        employee: 'user_emp_2',
        date: todayStr,
        checkIn: `${todayStr}T09:50:00.000Z`,
        checkOut: null,
        totalHours: 0,
        status: 'Late',
        notes: 'Delayed due to subway signal disruption.',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // Today: Marcus Sterling (Manager) checked in at 08:45 AM
      {
        _id: 'att_today_3',
        employee: 'user_mgr_1',
        date: todayStr,
        checkIn: `${todayStr}T08:45:00.000Z`,
        checkOut: null,
        totalHours: 0,
        status: 'Present',
        notes: 'Morning leadership sync.',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // Yesterday: Aiden Vance full day 8.5 hours
      {
        _id: 'att_yest_1',
        employee: 'user_emp_1',
        date: yesterdayStr,
        checkIn: `${yesterdayStr}T09:05:00.000Z`,
        checkOut: `${yesterdayStr}T17:35:00.000Z`,
        totalHours: 8.5,
        status: 'Present',
        notes: 'Sprint planning and pull request review.',
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString()
      },
      // Yesterday: Sophia Chen full day 8.0 hours
      {
        _id: 'att_yest_2',
        employee: 'user_emp_2',
        date: yesterdayStr,
        checkIn: `${yesterdayStr}T09:00:00.000Z`,
        checkOut: `${yesterdayStr}T17:00:00.000Z`,
        totalHours: 8.0,
        status: 'Present',
        notes: 'Component library maintenance.',
        createdAt: yesterday.toISOString(),
        updatedAt: yesterday.toISOString()
      }
    ];

    const leaves: ILeaveRequest[] = [
      // 1. Pending leave for Aiden Vance (to test Manager/HR approval workflow)
      {
        _id: 'leave_pending_1',
        employee: 'user_emp_1',
        leaveType: 'annual',
        startDate: new Date(now.getTime() + 86400000 * 5).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 86400000 * 7).toISOString().split('T')[0],
        durationDays: 3,
        reason: 'Attending family celebration and annual personal retreat.',
        status: 'Pending',
        reviewedBy: null,
        reviewerComment: '',
        reviewedAt: null,
        createdAt: isoNow,
        updatedAt: isoNow
      },
      // 2. Approved leave for Sophia Chen
      {
        _id: 'leave_app_2',
        employee: 'user_emp_2',
        leaveType: 'sick',
        startDate: new Date(now.getTime() - 86400000 * 4).toISOString().split('T')[0],
        endDate: new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0],
        durationDays: 2,
        reason: 'Medical appointment and recovery.',
        status: 'Approved',
        reviewedBy: 'user_mgr_1',
        reviewerComment: 'Approved. Get well soon Sophia!',
        reviewedAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
        createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
        updatedAt: new Date(now.getTime() - 86400000 * 5).toISOString()
      },
      // 3. Pending casual leave for Lucas Oliveira
      {
        _id: 'leave_pending_3',
        employee: 'user_emp_3',
        leaveType: 'casual',
        startDate: new Date(now.getTime() + 86400000 * 10).toISOString().split('T')[0],
        endDate: new Date(now.getTime() + 86400000 * 10).toISOString().split('T')[0],
        durationDays: 1,
        reason: 'Moving to new apartment.',
        status: 'Pending',
        reviewedBy: null,
        reviewerComment: '',
        reviewedAt: null,
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    const announcements: IAnnouncement[] = [
      {
        _id: 'ann_1',
        title: 'Q4 All-Hands Town Hall & Product Roadmap Kickoff',
        content: 'Join us this Thursday at 3:00 PM UTC for the quarterly company-wide address. Executive leadership will present the FY27 strategic priorities and celebrate top team performers.',
        category: 'Event',
        author: 'user_hr_1',
        expiresAt: new Date(now.getTime() + 86400000 * 14).toISOString(),
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'ann_2',
        title: 'Updated Policy: Remote Work Equipment Reimbursement',
        content: 'All full-time employees are eligible for an annual $800 wellness & home workstation stipend. Submit expense reports with invoices through the finance portal before month-end.',
        category: 'Company Policy',
        author: 'user_hr_1',
        expiresAt: null,
        createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
        updatedAt: new Date(now.getTime() - 86400000 * 2).toISOString()
      },
      {
        _id: 'ann_3',
        title: 'Security Advisory: Mandatory Multi-Factor Authentication',
        content: 'Please ensure your workstation security credentials adhere to the updated zero-trust standard. Phishing simulation tests will commence next week.',
        category: 'Urgent',
        author: 'user_hr_1',
        expiresAt: null,
        createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
        updatedAt: new Date(now.getTime() - 86400000 * 4).toISOString()
      }
    ];

    const notifications: INotification[] = [
      {
        _id: 'notif_1',
        recipient: 'user_mgr_1',
        title: 'New Leave Request from Aiden Vance',
        message: 'Aiden Vance has submitted an Annual Leave request for 3 day(s). Action required.',
        type: 'Leave',
        isRead: false,
        linkUrl: '/leaves',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'notif_2',
        recipient: 'user_emp_1',
        title: 'Welcome to StaffSync!',
        message: 'Your account is fully activated. You can track attendance, submit leave requests, and enroll in training courses.',
        type: 'System',
        isRead: true,
        linkUrl: '/dashboard',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'notif_3',
        recipient: 'user_hr_1',
        title: 'New Organization Announcement Live',
        message: 'Your announcement "Q4 All-Hands Town Hall" has been broadcasted to all employees.',
        type: 'System',
        isRead: false,
        linkUrl: '/announcements',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    const trainingPrograms: ITrainingProgram[] = [
      {
        _id: 'train_1',
        title: 'Cloud Native Architecture & Distributed Systems',
        description: 'Comprehensive masterclass on container orchestration, event-driven microservices, distributed tracing, and fault-tolerant cloud design.',
        instructor: 'Dr. Gregory Finch (Principal Cloud Architect)',
        department: 'dept_eng',
        startDate: new Date(now.getTime() + 86400000 * 7).toISOString(),
        endDate: new Date(now.getTime() + 86400000 * 28).toISOString(),
        capacity: 25,
        createdBy: 'user_mgr_1',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'train_2',
        title: 'Strategic Agile Leadership & Team Empowerment',
        description: 'Practical workshop focusing on psychological safety in high-performing teams, continuous discovery sprints, and proactive conflict resolution.',
        instructor: 'Sarah Jenkins (VP Agile Coach)',
        department: null,
        startDate: new Date(now.getTime() + 86400000 * 12).toISOString(),
        endDate: new Date(now.getTime() + 86400000 * 20).toISOString(),
        capacity: 30,
        createdBy: 'user_hr_1',
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'train_3',
        title: 'Accessible & Inclusive UI/UX Design Standards (WCAG 2.2)',
        description: 'Hands-on lab exploring accessible typography, screen-reader workflows, color contrast ergonomics, and inclusive design tokens.',
        instructor: 'Lucas Oliveira',
        department: 'dept_dsn',
        startDate: new Date(now.getTime() + 86400000 * 15).toISOString(),
        endDate: new Date(now.getTime() + 86400000 * 22).toISOString(),
        capacity: 20,
        createdBy: 'user_hr_1',
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    const trainingEnrollments: ITrainingEnrollment[] = [
      {
        _id: 'enroll_1',
        program: 'train_1',
        employee: 'user_emp_1',
        status: 'In-Progress',
        completionDate: null,
        createdAt: isoNow,
        updatedAt: isoNow
      },
      {
        _id: 'enroll_2',
        program: 'train_1',
        employee: 'user_emp_2',
        status: 'Enrolled',
        completionDate: null,
        createdAt: isoNow,
        updatedAt: isoNow
      }
    ];

    this.data = {
      departments: depts,
      users,
      attendance,
      leaves,
      announcements,
      notifications,
      trainingPrograms,
      trainingEnrollments
    };

    this.save();
    console.log('[StaffSync DB] Initialized & Seeded with production demo accounts and records.');
  }

  // --- Collection Accessors ---

  public get users() { return this.data.users; }
  public get departments() { return this.data.departments; }
  public get attendance() { return this.data.attendance; }
  public get leaves() { return this.data.leaves; }
  public get announcements() { return this.data.announcements; }
  public get notifications() { return this.data.notifications; }
  public get trainingPrograms() { return this.data.trainingPrograms; }
  public get trainingEnrollments() { return this.data.trainingEnrollments; }

  // Helpers to populate references
  public populateUser(userOrId: string | IUser | null | undefined): IUser | null {
    if (!userOrId) return null;
    const id = typeof userOrId === 'string' ? userOrId : userOrId._id;
    const user = this.data.users.find(u => u._id === id);
    if (!user) return null;

    // populate department and manager
    const dept = this.data.departments.find(d => d._id === (typeof user.department === 'string' ? user.department : user.department?._id));
    const mgr = user.manager ? this.data.users.find(m => m._id === (typeof user.manager === 'string' ? user.manager : (user.manager as IUser)?._id)) : null;

    return {
      ...user,
      department: dept || user.department,
      manager: mgr ? {
        _id: mgr._id,
        employeeId: mgr.employeeId,
        fullName: mgr.fullName,
        email: mgr.email,
        jobTitle: mgr.jobTitle
      } as any : null
    };
  }

  public populateAttendance(att: IAttendance): IAttendance {
    const emp = this.populateUser(att.employee);
    return {
      ...att,
      employee: emp ? {
        _id: emp._id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.department,
        jobTitle: emp.jobTitle
      } as any : att.employee
    };
  }

  public populateLeave(leave: ILeaveRequest): ILeaveRequest {
    const emp = this.populateUser(leave.employee);
    const reviewer = leave.reviewedBy ? this.populateUser(leave.reviewedBy) : null;
    return {
      ...leave,
      employee: emp ? {
        _id: emp._id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.department,
        jobTitle: emp.jobTitle,
        leaveBalances: emp.leaveBalances
      } as any : leave.employee,
      reviewedBy: reviewer ? {
        _id: reviewer._id,
        fullName: reviewer.fullName,
        email: reviewer.email,
        role: reviewer.role
      } as any : null
    };
  }
}

export const db = new DatabaseStore();
