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

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Ensure the ClientUser record exists in Prisma DB
    const existingUser = await prisma.clientUser.findUnique({
      where: { id: userId }
    });
    if (!existingUser) {
      await prisma.clientUser.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `user_${userId}@placeholder.local`,
          tier: 'FREE'
        }
      });
    }

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
  } catch (error: any) {
    console.error('Failed to add screen to board:', error);
    res.status(500).json({ error: error?.message || 'Failed to add screen to board' });
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

export const deleteBoard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = (req.headers['x-user-id'] || req.query.userId || req.body?.userId) as string | undefined;

    // Fetch board and its workspace to verify ownership
    const board = await prisma.board.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!board) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (requesterId && board.workspace?.ownerId && board.workspace.ownerId !== requesterId) {
      return res.status(403).json({ error: 'Only the workspace owner can delete this collection' });
    }

    // Delete board screens and chat messages first
    await prisma.boardScreen.deleteMany({
      where: { boardId: id }
    });
    await prisma.chatMessage.deleteMany({
      where: { boardId: id }
    });
    // Delete the board
    await prisma.board.deleteMany({
      where: { id }
    });
    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error("Failed to delete collection board:", error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

export const postBoardMessage = async (req: Request, res: Response) => {
  try {
    const { id: boardId } = req.params;
    const { message } = req.body;

    if (!message || !message.content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        screens: {
          include: {
            screen: {
              include: { app: true }
            }
          }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    let currentMessages: any[] = [];
    if (board.canvasState && Array.isArray(board.canvasState)) {
      currentMessages = board.canvasState;
    }

    // Append user message
    currentMessages.push(message);

    await prisma.board.update({
      where: { id: boardId },
      data: { canvasState: currentMessages }
    });

    // Handle @ai mention via HTTP endpoint as well
    if (message.content.toLowerCase().includes('@ai')) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      let screenContext = "The board has no screens saved yet.";
      if (board.screens && board.screens.length > 0) {
        const screenNames = board.screens.map((s: any) => `"${s.screen?.name || 'Screen'}" from the app ${s.screen?.app?.name || 'Unknown'}`).join(', ');
        screenContext = `The user has saved the following UI screens to this board for inspiration: ${screenNames}. Use this context if they ask questions about the board's designs.`;
      }

      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 1024,
          system: `You are Zibo AI, a helpful, witty, and concise AI assistant built into the Zibo design platform workspace. You help teams collaborate and answer questions.\n\nContext about the current workspace: ${screenContext}`,
          messages: [
            { role: 'user', content: message.content }
          ]
        });

        const aiText = response.content
          .filter((block) => block.type === 'text')
          .map((block: any) => block.text)
          .join('\n') || "Sorry, I couldn't generate a response.";

        const aiMessage = {
          id: Date.now().toString(),
          content: aiText,
          user: { email: "Zibo AI" },
          createdAt: new Date().toISOString()
        };

        currentMessages.push(aiMessage);
        await prisma.board.update({
          where: { id: boardId },
          data: { canvasState: currentMessages }
        });

        return res.json({ success: true, userMessage: message, aiMessage });
      } catch (aiErr: any) {
        console.error("HTTP AI chat error:", aiErr);
        const fallbackMsg = {
          id: Date.now().toString(),
          content: `I encountered an issue generating a response: ${aiErr?.message || 'Please check API quota or try again.'}`,
          user: { email: "Zibo AI" },
          createdAt: new Date().toISOString()
        };
        currentMessages.push(fallbackMsg);
        await prisma.board.update({
          where: { id: boardId },
          data: { canvasState: currentMessages }
        });
        return res.json({ success: true, userMessage: message, aiMessage: fallbackMsg });
      }
    }

    return res.json({ success: true, userMessage: message });
  } catch (error: any) {
    console.error("Failed to post board message via HTTP:", error);
    res.status(500).json({ error: error?.message || 'Failed to post message' });
  }
};

