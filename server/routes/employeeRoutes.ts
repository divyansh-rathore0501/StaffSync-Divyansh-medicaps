import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getDepartments,
  createDepartment
} from '../controllers/employeeController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.get('/departments', getDepartments);
router.post('/departments', authorize('HR'), createDepartment);

router.get('/', authorize('HR', 'Manager', 'Employee'), getEmployees);
router.post('/', authorize('HR'), createEmployee);
router.get('/:id', authorize('HR', 'Manager', 'Employee'), getEmployeeById);
router.put('/:id', authorize('HR'), updateEmployee);

export default router;
