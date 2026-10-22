import { Router } from 'express';
import { getFeatureFlags, updateFeatureFlag } from '../controllers/feature-flag.controller';

const router = Router();

router.get('/', getFeatureFlags);
router.patch('/:key', updateFeatureFlag);

export default router;
