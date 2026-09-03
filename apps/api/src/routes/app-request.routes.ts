import { Router } from 'express';
import {
  createAppRequest,
  getAppRequests,
  updateAppRequest,
  deleteAppRequest,
} from '../controllers/app-request.controller';

const router = Router();

// Public route to submit an app request
router.post('/', createAppRequest);

// Admin routes to manage app requests
router.get('/', getAppRequests);
router.put('/:id', updateAppRequest);
router.delete('/:id', deleteAppRequest);

export default router;
