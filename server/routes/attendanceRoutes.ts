import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getAttendanceHistory
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);

export default router;
