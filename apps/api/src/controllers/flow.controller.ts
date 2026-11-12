import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { canViewScreen, redactScreenForViewer, Viewer } from '../policies/can-view-screen';

export const getAllFlows = async (req: Request, res: Response) => {
  try {
    const { appId, lite } = req.query;
    
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

    // Lite mode for dropdowns (id, name only)
    if (lite === 'true') {
      const flows = await prisma.flow.findMany({
        where: whereClause,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      return res.json(flows);
    }

    const flows = await prisma.flow.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        appFlows: actualAppId ? {
          where: { appId: actualAppId }
        } : false,
        screens: {
          orderBy: { screenNo: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            screenNo: true,
            appId: true,
            status: true,
            app: {
              select: {
                id: true,
                name: true,
                appLogo: true,
                slug: true,
                isPremium: true,
                previewLimit: true,
                category: { select: { title: true, slug: true } }
              }
            }
          }
        },
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

    // Resolve viewer for Premium / Paid app content gating
    const userId = (req as any).user?.id;
    let viewer: Viewer | null = null;
    if (userId) {
      const user = await prisma.clientUser.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { entitledUntil: 'desc' },
            take: 1,
          },
        },
      });

      if (user) {
        viewer = {
          user: {
            id: user.id,
            tier: user.tier,
            tierOverride: user.tierOverride,
            tierOverrideUntil: user.tierOverrideUntil,
          },
          sub: user.subscriptions[0] ? { entitledUntil: user.subscriptions[0].entitledUntil } : null,
        };
      }
    }

    // Redact screens for paid apps across all flows
    const sanitizedFlows = flows.map(flow => {
      // Track screen index per app to correctly respect app.previewLimit
      const appScreenIndexMap = new Map<string, number>();

      const redactedScreens = flow.screens.map(screen => {
        const appKey = screen.appId;
        const currentIndex = appScreenIndexMap.get(appKey) || 0;
        appScreenIndexMap.set(appKey, currentIndex + 1);

        // In the cross-app Flows directory, any screen from a PRO/paid app is locked for free users
        const isAllowed = canViewScreen(viewer, screen.app || {}, screen.app?.isPremium ? 999999 : currentIndex);
        return redactScreenForViewer(screen, isAllowed);
      });

      return {
        ...flow,
        screens: redactedScreens,
      };
    });

    res.json(sanitizedFlows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch flows' });
  }
};

export const getFlowById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appId } = req.query;
    
    const flow = await prisma.flow.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        screens: {
          where: appId ? { appId: String(appId) } : undefined,
          orderBy: { screenNo: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            screenNo: true,
            appId: true,
            status: true,
            app: {
              select: {
                id: true,
                name: true,
                slug: true,
                appLogo: true,
                isPremium: true,
                previewLimit: true,
                category: { select: { title: true, slug: true } }
              }
            }
          }
        },
      }
    });
    
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    // Resolve viewer for Premium / Paid app content gating
    const userId = (req as any).user?.id;
    let viewer: Viewer | null = null;
    if (userId) {
      const user = await prisma.clientUser.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { entitledUntil: 'desc' },
            take: 1,
          },
        },
      });

      if (user) {
        viewer = {
          user: {
            id: user.id,
            tier: user.tier,
            tierOverride: user.tierOverride,
            tierOverrideUntil: user.tierOverrideUntil,
          },
          sub: user.subscriptions[0] ? { entitledUntil: user.subscriptions[0].entitledUntil } : null,
        };
      }
    }

    const appScreenIndexMap = new Map<string, number>();
    const redactedScreens = flow.screens.map(screen => {
      const appKey = screen.appId;
      const currentIndex = appScreenIndexMap.get(appKey) || 0;
      appScreenIndexMap.set(appKey, currentIndex + 1);

      const isAllowed = canViewScreen(viewer, screen.app || {}, screen.app?.isPremium ? 999999 : currentIndex);
      return redactScreenForViewer(screen, isAllowed);
    });
    
    res.json({ ...flow, screens: redactedScreens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch flow' });
  }
};

export const createFlow = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, status } = req.body;
    
    // Check if flow with same slug already exists
    const existing = await prisma.flow.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true }
    });

    if (existing) {
      return res.status(409).json({
        error: `Flow "${existing.name}" already exists with slug "${existing.slug}".`,
        code: 'SLUG_EXISTS',
        existingFlow: existing
      });
    }

    const flow = await prisma.flow.create({
      data: { name, slug, description, status },
    });
    
    res.status(201).json(flow);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      const existing = await prisma.flow.findFirst({
        where: { slug: req.body.slug },
        select: { id: true, name: true, slug: true }
      });
      return res.status(409).json({
        error: `Flow already exists with slug "${req.body.slug}".`,
        code: 'SLUG_EXISTS',
        existingFlow: existing
      });
    }
    res.status(500).json({ error: 'Failed to create flow' });
  }
};

export const updateFlow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, status } = req.body;

    // Check if another flow is already using this slug
    const existing = await prisma.flow.findFirst({
      where: {
        slug,
        id: { not: id }
      },
      select: { id: true, name: true, slug: true }
    });

    if (existing) {
      return res.status(409).json({
        error: `Another flow "${existing.name}" is already using slug "${existing.slug}".`,
        code: 'SLUG_EXISTS',
        existingFlow: existing
      });
    }
    
    const flow = await prisma.flow.update({
      where: { id },
      data: { name, slug, description, status },
    });
    
    res.json(flow);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: `Another flow is already using slug "${req.body.slug}".`,
        code: 'SLUG_EXISTS'
      });
    }
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

export const publishFlowScreens = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.screen.updateMany({
      where: { 
        flowId: id,
        status: 'DRAFT'
      },
      data: { 
        status: 'LIVE' 
      },
    });
    
    res.json({ message: 'Successfully published screens', count: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to bulk publish screens' });
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
