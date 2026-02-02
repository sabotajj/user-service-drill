import { Router } from 'express';
import { getAllUsers } from '../controllers/userController';

const router = Router();

// GET /api/users?page=1&limit=10
router.get('/', getAllUsers);

export default router;
