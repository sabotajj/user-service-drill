import { Router } from 'express';
import { getAllUsers } from '../controllers/userController';

const router = Router();

// GET /api/users?limit=10&offset=0
router.get('/', getAllUsers);

export default router;
