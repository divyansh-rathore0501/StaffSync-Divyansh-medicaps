import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { IUser, IDepartment } from '../types.js';

export const getEmployees = (req: AuthenticatedRequest, res: Response) => {
  const { search, department, role, status, page = '1', limit = '10' } = req.query as Record<string, string>;

  let list = db.users.map(u => db.populateUser(u._id)!);

  // Manager filter: only see their team members plus themselves
  if (req.user?.role === 'Manager') {
    const mgrId = req.user._id;
    list = list.filter(u => {
      const uMgrId = typeof u.manager === 'object' && u.manager ? u.manager._id : u.manager;
      return uMgrId === mgrId || u._id === mgrId;
    });
  }

  // Employee filter: employees only see basic directory or their team
  if (req.user?.role === 'Employee') {
    // Return all active employees for directory lookup, but without sensitive fields
  }

  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.employeeId.toLowerCase().includes(q) ||
      u.jobTitle.toLowerCase().includes(q)
    );
  }

  if (department) {
    list = list.filter(u => {
      const dId = typeof u.department === 'object' && u.department ? u.department._id : u.department;
      return dId === department;
    });
  }

  if (role) {
    list = list.filter(u => u.role === role);
  }

  if (status) {
    list = list.filter(u => u.status === status);
  }

  const total = list.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = list.slice(startIndex, startIndex + limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    employees: paginated
  });
};

export const getEmployeeById = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const emp = db.populateUser(id);

  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  // Security check: If Manager, verify this employee is on their team
  if (req.user?.role === 'Manager' && emp._id !== req.user._id) {
    const uMgrId = typeof emp.manager === 'object' && emp.manager ? emp.manager._id : emp.manager;
    if (uMgrId !== req.user._id) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to your direct reports.'
      });
    }
  }

  res.json({ success: true, employee: emp });
};

export const createEmployee = (req: AuthenticatedRequest, res: Response) => {
  const {
    fullName,
    email,
    password,
    role = 'Employee',
    department,
    manager,
    jobTitle,
    phoneNumber,
    joiningDate
  } = req.body;

  if (!fullName || !email || !department || !jobTitle) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email, department, and job title are required.'
    });
  }

  const emailClean = email.trim().toLowerCase();
  const exists = db.users.some(u => u.email.toLowerCase() === emailClean);
  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'An employee with this email address is already enrolled.'
    });
  }

  // Generate unique employee ID: SS-[DEPTCODE]-[RANDOM3]
  const deptObj = db.departments.find(d => d._id === department);
  const deptCode = deptObj?.code || 'EMP';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const employeeId = `SS-${deptCode}-${randomSuffix}`;

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password || 'StaffSync2026!', salt);

  const now = new Date().toISOString();
  const newEmp: IUser = {
    _id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    employeeId,
    fullName: fullName.trim(),
    email: emailClean,
    password: hashedPassword,
    role: role || 'Employee',
    department,
    manager: manager || null,
    jobTitle: jobTitle.trim(),
    phoneNumber: phoneNumber?.trim() || '',
    joiningDate: joiningDate || now,
    status: 'Active',
    leaveBalances: {
      annual: 20,
      sick: 10,
      casual: 7,
      unpaid: 0
    },
    createdAt: now,
    updatedAt: now
  };

  db.users.push(newEmp);
  db.save();

  const populated = db.populateUser(newEmp._id);

  res.status(201).json({
    success: true,
    message: `Employee ${fullName} successfully enrolled.`,
    employee: populated
  });
};

export const updateEmployee = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.users.find(u => u._id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Employee not found.' });
  }

  const {
    fullName,
    role,
    department,
    manager,
    jobTitle,
    phoneNumber,
    status,
    leaveBalances
  } = req.body;

  if (fullName !== undefined) user.fullName = fullName.trim();
  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (manager !== undefined) user.manager = manager || null;
  if (jobTitle !== undefined) user.jobTitle = jobTitle.trim();
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
  if (status !== undefined) user.status = status;
  if (leaveBalances !== undefined) user.leaveBalances = { ...user.leaveBalances, ...leaveBalances };

  user.updatedAt = new Date().toISOString();
  db.save();

  const populated = db.populateUser(user._id);

  res.json({
    success: true,
    message: 'Employee record successfully updated.',
    employee: populated
  });
};

export const getDepartments = (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, departments: db.departments });
};

export const createDepartment = (req: AuthenticatedRequest, res: Response) => {
  const { name, code, description } = req.body;

  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Department name and code are required.' });
  }

  const codeUpper = code.trim().toUpperCase();
  if (db.departments.some(d => d.code === codeUpper)) {
    return res.status(400).json({ success: false, message: 'A department with this code already exists.' });
  }

  const now = new Date().toISOString();
  const dept: IDepartment = {
    _id: `dept_${Date.now()}`,
    name: name.trim(),
    code: codeUpper,
    description: description?.trim() || '',
    isActive: true,
    createdAt: now,
    updatedAt: now
  };

  db.departments.push(dept);
  db.save();

  res.status(201).json({ success: true, department: dept });
};
