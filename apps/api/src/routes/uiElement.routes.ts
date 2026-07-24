import { Router } from 'express';
import {
  getAllUiElements,
  getUiElementById,
  createUiElement,
  updateUiElement,
  deleteUiElement,
  migrateUiElement,
} from '../controllers/uiElement.controller';

const router = Router();

router.get('/', getAllUiElements);
router.get('/:id', getUiElementById);
router.post('/', createUiElement);
router.put('/:id', updateUiElement);
router.delete('/:id', deleteUiElement);
router.post('/:id/migrate', migrateUiElement);

export default router;
