import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllApps = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status) as any } : {};

    const apps = await prisma.app.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true }
    });
    res.json(apps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch apps' });
  }
};

export const getAppById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const app = await prisma.app.findFirst({
      where: { 
        OR: [
          { id: id },
          { slug: id }
        ],
        ...(status && { status: String(status) as any })
      },
      include: { 
        category: true, 
        screens: {
          where: status ? { status: String(status) as any } : undefined,
          orderBy: {
            screenNo: 'asc'
          },
          include: {
            flow: true,
            uiElements: true,
            patterns: true
          }
        } 
      }
    });
    
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }
    
    // Fetch authentic similar apps (same category, exclude current app)
    let similarApps: any[] = [];
    if (app.categoryId) {
      similarApps = await prisma.app.findMany({
        where: { 
          categoryId: app.categoryId,
          id: { not: app.id },
          ...(status && { status: String(status) as any })
        },
        include: {
          category: true,
          screens: {
            where: status ? { status: String(status) as any } : undefined,
            orderBy: { screenNo: 'asc' },
            take: 1
          }
        },
        take: 3 // Show up to 3 similar apps
      });
    }
    
    res.json({ ...app, similarApps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch app' });
  }
};

export const createApp = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    
    if (data.categoryId) {
      data.category = { connect: { id: data.categoryId } };
      delete data.categoryId;
    }
    
    const app = await prisma.app.create({
      data,
    });
    
    res.status(201).json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create app' });
  }
};

export const updateApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.categoryId) {
      data.category = { connect: { id: data.categoryId } };
      delete data.categoryId;
    }
    
    const app = await prisma.app.update({
      where: { id },
      data,
    });
    
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update app' });
  }
};

export const deleteApp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.app.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete app' });
  }
};
