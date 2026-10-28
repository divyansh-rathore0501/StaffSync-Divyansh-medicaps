import { Router } from 'express';
import {
  applyLeave,
  getLeaveRequests,
  reviewLeaveRequest,
  cancelLeaveRequest
} from '../controllers/leaveController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.post('/apply', applyLeave);
router.get('/', getLeaveRequests);
router.put('/:id/review', authorize('HR', 'Manager'), reviewLeaveRequest);
router.put('/:id/cancel', cancelLeaveRequest);

export default router;
