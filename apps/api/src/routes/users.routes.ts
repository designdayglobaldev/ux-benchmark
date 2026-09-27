import { Router } from 'express';
import { getClientUsers, updateClientTier } from '../controllers/users.controller';

const router = Router();

// In a real app, protect these with requireStaff middleware
router.get('/', getClientUsers);
router.put('/:id/tier', updateClientTier);

export default router;
