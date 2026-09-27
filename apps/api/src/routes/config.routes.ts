import { Router } from 'express';
import { getTierConfigs, updateTierConfig } from '../controllers/config.controller';
// import { requireAuth, requireStaff } from '../middleware/auth'; // Assuming there's a staff auth middleware

const router = Router();

// In a real app, these should be protected by requireStaff or similar middleware
router.get('/tiers', getTierConfigs);
router.put('/tiers/:tier', updateTierConfig);

export default router;
