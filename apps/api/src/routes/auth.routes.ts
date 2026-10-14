import { Router } from 'express';
import { 
  registerWaitlist, 
  approveUser, 
  getWaitlist, 
  rejectUser,
  getApprovalSettings,
  updateApprovalSettings
} from '../controllers/auth.controller';

const router = Router();

router.get('/waitlist', getWaitlist);
router.post('/waitlist', registerWaitlist);
router.post('/approve', approveUser);
router.post('/reject', rejectUser);
router.get('/approval-settings', getApprovalSettings);
router.post('/approval-settings', updateApprovalSettings);

export default router;
