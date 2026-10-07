import { Router } from 'express';
import { initiateMobbinAuth, mobbinCallback, searchMobbinScreens, getMobbinStatus } from '../controllers/mobbin.controller';

const router = Router();

// Start the OAuth flow
router.get('/auth', initiateMobbinAuth);

// OAuth callback to receive the authorization code
router.get('/callback', mobbinCallback);

// Get connection status
router.get('/status', getMobbinStatus);

// Example endpoint to use the MCP connection after authentication
router.post('/search', searchMobbinScreens);

export default router;
