export type Role = 'HR' | 'Manager' | 'Employee';
export type UserStatus = 'Active' | 'Inactive' | 'OnLeave';
export type AttendanceStatus = 'Present' | 'Late' | 'Half-Day' | 'Absent';
export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type AnnouncementCategory = 'Company Policy' | 'Event' | 'Urgent' | 'General';
export type NotificationType = 'Leave' | 'Attendance' | 'Training' | 'System';
export type TrainingStatus = 'Enrolled' | 'In-Progress' | 'Completed' | 'Dropped';

export interface LeaveBalances {
  annual: number;
  sick: number;
  casual: number;
  unpaid: number;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: Role;
  department: string | Department;
  manager?: string | User | null;
  jobTitle: string;
  phoneNumber?: string;
  joiningDate: string;
  status: UserStatus;
  leaveBalances: LeaveBalances;
}

export interface Attendance {
  _id: string;
  employee: string | User;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  totalHours: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface LeaveRequest {
  _id: string;
  employee: string | User;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | User | null;
  reviewerComment?: string;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  author: string | User;
  expiresAt?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string | User;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface TrainingProgram {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  department?: Department | string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount?: number;
  isUserEnrolled?: boolean;
  userStatus?: TrainingStatus | null;
  enrollmentId?: string | null;
  createdAt: string;
}
