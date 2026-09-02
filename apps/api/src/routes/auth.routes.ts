import { Router } from 'express';
import { registerWaitlist, approveUser, getWaitlist, rejectUser } from '../controllers/auth.controller';

const router = Router();

router.get('/waitlist', getWaitlist);
router.post('/waitlist', registerWaitlist);
router.post('/approve', approveUser);
router.post('/reject', rejectUser);

export default router;
