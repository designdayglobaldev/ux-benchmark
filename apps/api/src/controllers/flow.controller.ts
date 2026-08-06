import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllFlows = async (req: Request, res: Response) => {
  try {
    const { appId } = req.query;
    
    // For flows, filtering by appId might mean they contain screens that belong to the app
    // Alternatively, if flows are associated directly with an app (wait, let me check prisma schema!)
    // If not, we might need to filter by screens.some: { appId }
    // Let's assume flows don't have appId directly, but if they do, we use it.
    // I'll check prisma schema just in case. But for now, filtering by screens might be safest.
    const whereClause = appId ? { screens: { some: { appId: String(appId) } } } : {};

    const flows = await prisma.flow.findMany({
      where: whereClause,
      include: {
        screens: {
          include: {
            app: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(flows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch flows' });
  }
};

export const getFlowById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appId } = req.query;
    
    const flow = await prisma.flow.findUnique({
      where: { id },
      include: {
        screens: {
          where: appId ? { appId: String(appId) } : undefined,
          include: {
            app: { select: { name: true } }
          }
        },
      }
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    
    res.json(flow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch flow' });
  }
};

export const createFlow = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, status } = req.body;
    
    const flow = await prisma.flow.create({
      data: { name, slug, description, status },
    });
    
    res.status(201).json(flow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create flow' });
  }
};

export const updateFlow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, status } = req.body;
    
    const flow = await prisma.flow.update({
      where: { id },
      data: { name, slug, description, status },
    });
    
    res.json(flow);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update flow' });
  }
};

export const deleteFlow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.flow.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete flow' });
  }
};

export const reorderScreens = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { screenIds } = req.body; // array of screen IDs in the new order

    // Update each screen's screenNo sequentially
    for (let i = 0; i < screenIds.length; i++) {
      await prisma.screen.update({
        where: { id: screenIds[i] },
        data: { screenNo: i + 1 }
      });
    }

    res.json({ message: 'Sequence updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder screens' });
  }
};
