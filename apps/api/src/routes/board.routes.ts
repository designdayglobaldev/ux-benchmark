import { Router } from 'express';
import { createBoard, getBoard, addScreenToBoard, updateBoardState, deleteBoard } from '../controllers/board.controller';

const router = Router();

router.post('/', createBoard);
router.get('/:id', getBoard);
router.post('/:id/screens', addScreenToBoard);
router.put('/:id/state', updateBoardState);
router.delete('/:id', deleteBoard);

export default router;
