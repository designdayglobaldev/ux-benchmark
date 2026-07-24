import { Router } from 'express';
import { getAllFlows, getFlowById, createFlow, updateFlow, deleteFlow, reorderScreens } from '../controllers/flow.controller';

const router = Router();

router.get('/', getAllFlows);
router.get('/:id', getFlowById);
router.post('/', createFlow);
router.put('/:id', updateFlow);
router.delete('/:id', deleteFlow);
router.put('/:id/reorder', reorderScreens);

export default router;
