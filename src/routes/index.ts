import { Router } from 'express';
import userRoutes from './userRoutes';
import groupRoutes from './groupRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/groups', groupRoutes);

export default router;
