import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const createBoard = async (req: Request, res: Response) => {
  try {
    const { name, workspaceId } = req.body;
    const board = await prisma.board.create({
      data: {
        name,
        workspaceId
      }
    });
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
};

export const getBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        screens: {
          include: {
            screen: {
              include: {
                app: true
              }
            }
          }
        },
        workspace: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch board' });
  }
};

export const addScreenToBoard = async (req: Request, res: Response) => {
  try {
    const boardId = req.params.id;
    const { screenId, userId } = req.body;
    const boardScreen = await prisma.boardScreen.create({
      data: {
        boardId,
        screenId,
        addedById: userId
      },
      include: {
        screen: true
      }
    });
    res.status(201).json(boardScreen);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add screen to board' });
  }
};

export const updateBoardState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { elements } = req.body;
    const board = await prisma.board.update({
      where: { id },
      data: {
        canvasState: elements
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to save board state:", error);
    res.status(500).json({ error: 'Failed to save board state' });
  }
};
