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

export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  password?: string;
  role: Role;
  department: string | IDepartment;
  manager?: string | IUser | null;
  jobTitle: string;
  phoneNumber?: string;
  joiningDate: string;
  status: UserStatus;
  leaveBalances: LeaveBalances;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance {
  _id: string;
  employee: string | IUser;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO
  checkOut?: string | null; // ISO
  totalHours: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveRequest {
  _id: string;
  employee: string | IUser;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | IUser | null;
  reviewerComment?: string;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  author: string | IUser;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  recipient: string | IUser;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITrainingProgram {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  department?: string | IDepartment | null;
  startDate: string;
  endDate: string;
  capacity: number;
  createdBy: string | IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ITrainingEnrollment {
  _id: string;
  program: string | ITrainingProgram;
  employee: string | IUser;
  status: TrainingStatus;
  completionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}
