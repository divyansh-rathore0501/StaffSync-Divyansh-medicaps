import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { ITrainingProgram, ITrainingEnrollment, TrainingStatus } from '../types.js';

export const getTrainingPrograms = (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id;

  const enriched = db.trainingPrograms.map(p => {
    const enrollments = db.trainingEnrollments.filter(e => {
      const pId = typeof e.program === 'object' && e.program ? e.program._id : e.program;
      return pId === p._id;
    });

    const enrolledCount = enrollments.length;
    const userEnrollment = userId ? enrollments.find(e => {
      const eEmpId = typeof e.employee === 'object' && e.employee ? e.employee._id : e.employee;
      return eEmpId === userId;
    }) : null;

    const dept = p.department ? db.departments.find(d => d._id === (typeof p.department === 'object' ? p.department?._id : p.department)) : null;

    return {
      ...p,
      department: dept || p.department,
      enrolledCount,
      isUserEnrolled: !!userEnrollment,
      userStatus: userEnrollment ? userEnrollment.status : null,
      enrollmentId: userEnrollment ? userEnrollment._id : null
    };
  });

  // Sort by start date ascending
  enriched.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

  res.json({ success: true, count: enriched.length, programs: enriched });
};

export const createTrainingProgram = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { title, description, instructor, department, startDate, endDate, capacity = 25 } = req.body;

  if (!title || !description || !instructor || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, instructor, start date, and end date are required.'
    });
  }

  const now = new Date().toISOString();
  const program: ITrainingProgram = {
    _id: `train_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    instructor: instructor.trim(),
    department: department || null,
    startDate,
    endDate,
    capacity: Number(capacity) || 25,
    createdBy: req.user._id,
    createdAt: now,
    updatedAt: now
  };

  db.trainingPrograms.push(program);
  db.save();

  res.status(201).json({
    success: true,
    message: 'Training program successfully registered.',
    program
  });
};

export const enrollInProgram = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.params;
  const program = db.trainingPrograms.find(p => p._id === id);

  if (!program) {
    return res.status(404).json({ success: false, message: 'Training program not found.' });
  }

  const enrollments = db.trainingEnrollments.filter(e => {
    const pId = typeof e.program === 'object' && e.program ? e.program._id : e.program;
    return pId === program._id;
  });

  if (enrollments.length >= program.capacity) {
    return res.status(400).json({
      success: false,
      message: `Program has reached maximum seat capacity of ${program.capacity}.`
    });
  }

  const existing = enrollments.find(e => {
    const eEmpId = typeof e.employee === 'object' && e.employee ? e.employee._id : e.employee;
    return eEmpId === req.user!._id;
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You are already enrolled in this training program.'
    });
  }

  const now = new Date().toISOString();
  const enrollment: ITrainingEnrollment = {
    _id: `enroll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    program: program._id,
    employee: req.user._id,
    status: 'Enrolled',
    completionDate: null,
    createdAt: now,
    updatedAt: now
  };

  db.trainingEnrollments.push(enrollment);
  db.save();

  res.status(201).json({
    success: true,
    message: `Enrolled successfully in ${program.title}.`,
    enrollment
  });
};

export const updateEnrollmentStatus = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: TrainingStatus };

  const enrollment = db.trainingEnrollments.find(e => e._id === id);
  if (!enrollment) {
    return res.status(404).json({ success: false, message: 'Enrollment record not found.' });
  }

  enrollment.status = status;
  if (status === 'Completed') {
    enrollment.completionDate = new Date().toISOString();
  }
  enrollment.updatedAt = new Date().toISOString();
  db.save();

  res.json({
    success: true,
    message: `Enrollment status updated to ${status}.`,
    enrollment
  });
};
