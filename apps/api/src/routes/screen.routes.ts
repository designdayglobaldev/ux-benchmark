import { Router } from 'express';
import {
  getAllScreens,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen,
} from '../controllers/screen.controller';

const router = Router();

router.get('/', getAllScreens);
router.get('/:id', getScreenById);
router.post('/', createScreen);
router.put('/:id', updateScreen);
router.delete('/:id', deleteScreen);

export default router;
