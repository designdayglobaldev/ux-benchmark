import { Router } from 'express';
import {
  getAllPatterns,
  getPatternById,
  createPattern,
  updatePattern,
  deletePattern,
  migratePattern,
} from '../controllers/pattern.controller';

const router = Router();

router.get('/', getAllPatterns);
router.get('/:id', getPatternById);
router.post('/', createPattern);
router.put('/:id', updatePattern);
router.delete('/:id', deletePattern);
router.post('/:id/migrate', migratePattern);

export default router;
