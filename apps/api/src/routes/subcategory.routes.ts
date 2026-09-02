import { Router } from 'express';
import {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  migrateSubcategory,
} from '../controllers/subcategory.controller';

const router = Router();

router.get('/', getAllSubcategories);
router.get('/:id', getSubcategoryById);
router.post('/', createSubcategory);
router.put('/:id', updateSubcategory);
router.delete('/:id', deleteSubcategory);
router.post('/:id/migrate', migrateSubcategory);

export default router;
