import { Router } from 'express';
import { getAllGroups, removeUserFromGroup } from '../controllers/groupController';

const router = Router();

// GET /api/groups?page=1&limit=10
router.get('/', getAllGroups);

// DELETE /api/groups/:groupId/users/:userId
router.delete('/:groupId/users/:userId', removeUserFromGroup);

export default router;
