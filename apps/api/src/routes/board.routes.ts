import { Router } from 'express';
import { createBoard, getBoard, addScreenToBoard, updateBoardState } from '../controllers/board.controller';

const router = Router();

router.post('/', createBoard);
router.get('/:id', getBoard);
router.post('/:id/screens', addScreenToBoard);
router.put('/:id/state', updateBoardState);

export default router;
