import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllFlows = async (req: Request, res: Response) => {
  try {
    const { appId } = req.query;
    
    let actualAppId: string | undefined;
    
    if (appId) {
      const app = await prisma.app.findFirst({
        where: {
          OR: [{ id: String(appId) }, { slug: String(appId) }]
        }
      });
      if (app) {
        actualAppId = app.id;
      } else {
        actualAppId = String(appId); // Fallback
      }
    }

    const whereClause = actualAppId ? { screens: { some: { appId: actualAppId } } } : {};

    const flows = await prisma.flow.findMany({
      where: whereClause,
      include: {
        screens: {
          include: {
            app: { select: { name: true } }
          }
        },
        appFlows: actualAppId ? {
          where: { appId: actualAppId }
        } : false
      },
      orderBy: !actualAppId ? { createdAt: 'desc' } : undefined,
    });

    if (actualAppId) {
      flows.sort((a, b) => {
        const seqA = a.appFlows?.[0]?.sequence ?? 999999;
        const seqB = b.appFlows?.[0]?.sequence ?? 999999;
        return seqA - seqB || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

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

export const reorderAppFlows = async (req: Request, res: Response) => {
  try {
    const { appId: idOrSlug } = req.params;
    const { flowIds } = req.body;

    const app = await prisma.app.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }]
      }
    });

    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const actualAppId = app.id;

    for (let i = 0; i < flowIds.length; i++) {
      await prisma.appFlow.upsert({
        where: {
          appId_flowId: {
            appId: actualAppId,
            flowId: flowIds[i]
          }
        },
        update: {
          sequence: i + 1
        },
        create: {
          appId: actualAppId,
          flowId: flowIds[i],
          sequence: i + 1
        }
      });
    }

    res.json({ message: 'App Flow sequence updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder app flows' });
  }
};
