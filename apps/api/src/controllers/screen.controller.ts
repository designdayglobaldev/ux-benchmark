import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllScreens = async (req: Request, res: Response) => {
  try {
    const { appId, page, limit, search } = req.query;
    const whereClause: any = appId ? { appId: String(appId) } : {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { app: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    // Default pagination to page 1, 50 items per page if requested
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [screens, total] = await Promise.all([
      prisma.screen.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          screenNo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          appId: true,
          flowId: true,
          app: { select: { name: true, slug: true, appLogo: true } },
          flow: { select: { name: true, slug: true } },
          uiElements: { select: { id: true, title: true } },
          patterns: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.screen.count({ where: whereClause })
    ]);

    // Update consumers to expect { data, meta }
    res.json({
      data: screens,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
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
        appId,
        flowId: flowId || null,
        uiElements: {
          connect: uiElementIds?.map((id: string) => ({ id })) || [],
        },
        patterns: {
          connect: patternIds?.map((id: string) => ({ id })) || [],
        },
      },
    });

    res.status(201).json(screen);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to create screen' });
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
        appId,
        flowId: flowId || null,
        uiElements: {
          set: uiElementIds?.map((id: string) => ({ id })) || [],
        },
        patterns: {
          set: patternIds?.map((id: string) => ({ id })) || [],
        },
      },
    });

    res.json(screen);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to update screen' });
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
