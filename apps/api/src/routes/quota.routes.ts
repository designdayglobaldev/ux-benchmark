import { Router } from 'express';
import { getMyQuota } from '../controllers/quota.controller';

const router = Router();

router.get('/me', getMyQuota);

export default router;
