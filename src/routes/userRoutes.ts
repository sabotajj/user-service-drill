import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { UserController } from '../controllers/userController';

const router = Router();

// Dependency injection setup
const userRepository = new UserRepository(AppDataSource);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// GET /api/users?limit=10&offset=0
router.get('/', userController.getAllUsers);

// POST /api/users/statuses
router.post('/statuses', userController.updateUsersStatuses);

export default router;
