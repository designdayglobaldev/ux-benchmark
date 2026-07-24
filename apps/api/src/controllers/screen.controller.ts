import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllScreens = async (req: Request, res: Response) => {
  try {
    const { appId } = req.query;
    const whereClause = appId ? { appId: String(appId) } : {};

    const screens = await prisma.screen.findMany({
      where: whereClause,
      include: {
        app: { select: { name: true, slug: true } },
        flow: { select: { name: true, slug: true } },
        uiElements: { select: { id: true, title: true } },
        patterns: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(screens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch screens' });
  }
};

export const getScreenById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        app: { select: { name: true, slug: true, appLogo: true } },
        flow: { select: { name: true, slug: true } },
        uiElements: true,
        patterns: true,
      },
    });

    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    res.json(screen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch screen' });
  }
};

export const createScreen = async (req: Request, res: Response) => {
  try {
    const { 
      appId, flowId, screenNo, name, slug, imageUrl, 
      uxAnalysis, tonalityAndContent, keyHighlights, evidenceWhoWhy, whereToUse, whereNotToUse,
      similarApps, status, uiElementIds, patternIds
    } = req.body;

    const screen = await prisma.screen.create({
      data: {
        name,
        slug,
        imageUrl,
        screenNo: screenNo ? parseInt(screenNo, 10) : null,
        uxAnalysis,
        tonalityAndContent,
        keyHighlights,
        evidenceWhoWhy,
        whereToUse,
        whereNotToUse,
        similarApps: similarApps || [],
        status,
        app: { connect: { id: appId } },
        ...(flowId && { flow: { connect: { id: flowId } } }),
        uiElements: {
          connect: uiElementIds?.map((id: String) => ({ id })) || [],
        },
        patterns: {
          connect: patternIds?.map((id: String) => ({ id })) || [],
        },
      },
    });

    res.status(201).json(screen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create screen' });
  }
};

export const updateScreen = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      appId, flowId, screenNo, name, slug, imageUrl, 
      uxAnalysis, tonalityAndContent, keyHighlights, evidenceWhoWhy, whereToUse, whereNotToUse,
      similarApps, status, uiElementIds, patternIds
    } = req.body;

    const screen = await prisma.screen.update({
      where: { id },
      data: {
        name,
        slug,
        imageUrl,
        screenNo: screenNo ? parseInt(screenNo, 10) : null,
        uxAnalysis,
        tonalityAndContent,
        keyHighlights,
        evidenceWhoWhy,
        whereToUse,
        whereNotToUse,
        similarApps: similarApps || [],
        status,
        app: { connect: { id: appId } },
        ...(flowId ? { flow: { connect: { id: flowId } } } : { flow: { disconnect: true } }),
        uiElements: {
          set: uiElementIds?.map((id: String) => ({ id })) || [],
        },
        patterns: {
          set: patternIds?.map((id: String) => ({ id })) || [],
        },
      },
    });

    res.json(screen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update screen' });
  }
};

export const deleteScreen = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.screen.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete screen' });
  }
};
