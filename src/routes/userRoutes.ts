import { Router } from 'express';
import { getAllUsers, updateUsersStatuses } from '../controllers/userController';

const router = Router();

// GET /api/users?limit=10&offset=0
router.get('/', getAllUsers);

// POST /api/users/statuses
router.post('/statuses', updateUsersStatuses);

export default router;
