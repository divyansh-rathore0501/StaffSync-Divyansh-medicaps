import { Router } from 'express';
import {
  getDashboardStats,
  exportAttendanceCSV,
  exportLeavesCSV,
  exportEmployeesCSV
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.get('/dashboard-stats', getDashboardStats);
router.get('/export/attendance', authorize('HR', 'Manager'), exportAttendanceCSV);
router.get('/export/leaves', authorize('HR', 'Manager'), exportLeavesCSV);
router.get('/export/employees', authorize('HR', 'Manager'), exportEmployeesCSV);

export default router;
