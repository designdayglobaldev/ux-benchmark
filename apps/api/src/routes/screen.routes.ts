import { Router } from 'express';
import {
  getAllScreens,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
  getUnprocessedScreens,
  analyzeScreen,
  batchAnalyzeScreens,
} from '../controllers/screen.controller';

const router = Router();

router.get('/unprocessed', getUnprocessedScreens);
router.post('/batch-analyze', batchAnalyzeScreens);
router.post('/:id/analyze', analyzeScreen);
router.get('/', getAllScreens);
router.get('/:id', getScreenById);
router.post('/', createScreen);
router.put('/:id', updateScreen);
router.delete('/:id', deleteScreen);

export default router;
