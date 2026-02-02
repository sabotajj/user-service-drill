import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { UserController } from '../controllers/userController';
import { validateRequest } from '../middleware/validation';
import { paginationQuerySchema, bulkUserStatusUpdateSchema } from '../validations/userValidation';

const router = Router();

// Dependency injection setup
const userRepository = new UserRepository(AppDataSource);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// GET /api/users?limit=10&offset=0
router.get('/', validateRequest(paginationQuerySchema, 'query'), userController.getAllUsers);

// POST /api/users/statuses
router.post('/statuses', validateRequest(bulkUserStatusUpdateSchema, 'body'), userController.updateUsersStatuses);

export default router;
