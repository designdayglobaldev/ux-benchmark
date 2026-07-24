import { Router } from 'express';
import { getAllApps, getAppById, createApp, updateApp, deleteApp } from '../controllers/app.controller';

const router = Router();

router.get('/', getAllApps);
router.get('/:id', getAppById);
router.post('/', createApp);
router.put('/:id', updateApp);
router.delete('/:id', deleteApp);

export default router;
