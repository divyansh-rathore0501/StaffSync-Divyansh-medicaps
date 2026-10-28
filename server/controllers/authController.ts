import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'staffsync_secret_key_production_grade_jwt_2026';
const JWT_EXPIRES_IN = '7d';

export const login = (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both work email and password.'
    });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password credentials.'
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password || '');
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password credentials.'
    });
  }

  if (user.status === 'Inactive') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact HR.'
    });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  const populated = db.populateUser(user._id);

  res.json({
    success: true,
    token,
    user: {
      _id: populated!._id,
      employeeId: populated!.employeeId,
      fullName: populated!.fullName,
      email: populated!.email,
      role: populated!.role,
      department: populated!.department,
      manager: populated!.manager,
      jobTitle: populated!.jobTitle,
      phoneNumber: populated!.phoneNumber,
      joiningDate: populated!.joiningDate,
      status: populated!.status,
      leaveBalances: populated!.leaveBalances
    }
  });
};

export const getMe = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const user = db.populateUser(req.user._id);
  res.json({ success: true, user });
};

export const updateProfile = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { phoneNumber, password, currentPassword } = req.body;
  const user = db.users.find(u => u._id === req.user!._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (phoneNumber !== undefined) {
    user.phoneNumber = phoneNumber.trim();
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (currentPassword) {
      const match = bcrypt.compareSync(currentPassword, user.password || '');
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Current password provided is incorrect.'
        });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(password, salt);
  }

  user.updatedAt = new Date().toISOString();
  db.save();

  const updatedUser = db.populateUser(user._id);
  res.json({
    success: true,
    message: 'Profile details updated successfully.',
    user: updatedUser
  });
};
