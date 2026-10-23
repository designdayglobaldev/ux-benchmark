import { Router } from 'express';
import { createBoard, getBoard, addScreenToBoard, updateBoardState, deleteBoard, postBoardMessage } from '../controllers/board.controller';

const router = Router();

router.post('/', createBoard);
router.get('/:id', getBoard);
router.post('/:id/screens', addScreenToBoard);
router.put('/:id/state', updateBoardState);
router.delete('/:id', deleteBoard);
router.post('/:id/messages', postBoardMessage);

export default router;
