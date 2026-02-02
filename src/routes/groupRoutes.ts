import { Router } from 'express';
import { getAllGroups, removeUserFromGroup } from '../controllers/groupController';

const router = Router();

// GET /api/groups?limit=10&offset=0
router.get('/', getAllGroups);

// DELETE /api/groups/:groupId/users/:userId
router.delete('/:groupId/users/:userId', removeUserFromGroup);

export default router;
