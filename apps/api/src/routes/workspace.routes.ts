import { Router } from 'express';
import { createWorkspace, getWorkspaces, inviteToWorkspace, deleteWorkspace } from '../controllers/workspace.controller';

const router = Router();

router.post('/', createWorkspace);
router.get('/user/:userId', getWorkspaces);
router.post('/:id/invite', inviteToWorkspace);
router.delete('/:id', deleteWorkspace);

export default router;
