import { Router } from 'express';
import {
  getTrainingPrograms,
  createTrainingProgram,
  enrollInProgram,
  updateEnrollmentStatus
} from '../controllers/trainingController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.get('/', getTrainingPrograms);
router.post('/', authorize('HR', 'Manager'), createTrainingProgram);
router.post('/:id/enroll', enrollInProgram);
router.put('/enrollment/:id', authorize('HR', 'Manager'), updateEnrollmentStatus);

export default router;
