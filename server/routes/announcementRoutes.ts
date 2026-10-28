import { Router } from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('HR'), createAnnouncement);
router.delete('/:id', authorize('HR'), deleteAnnouncement);

export default router;
