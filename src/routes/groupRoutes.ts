import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { GroupRepository } from '../repositories/groupRepository';
import { GroupService } from '../services/groupService';
import { GroupController } from '../controllers/groupController';
import { validateRequest } from '../middleware/validation';
import { paginationQuerySchema } from '../validations/userValidation';
import { removeUserFromGroupParamsSchema } from '../validations/groupValidation';

const router = Router();

// Dependency injection setup
const groupRepository = new GroupRepository(AppDataSource);
const groupService = new GroupService(groupRepository);
const groupController = new GroupController(groupService);

// GET /api/groups?limit=10&offset=0
router.get('/', validateRequest(paginationQuerySchema, 'query'), groupController.getAllGroups);

// DELETE /api/groups/:groupId/users/:userId
router.delete('/:groupId/users/:userId', validateRequest(removeUserFromGroupParamsSchema, 'params'), groupController.removeUserFromGroup);

export default router;
