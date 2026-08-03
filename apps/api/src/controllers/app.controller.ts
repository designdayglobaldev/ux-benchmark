import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllApps = async (req: Request, res: Response) => {
  try {
    const apps = await prisma.app.findMany({
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
    const app = await prisma.app.findFirst({
      where: { 
        OR: [
          { id: id },
          { slug: id }
        ]
      },
      include: { 
        category: true, 
        screens: {
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
    
    res.json(app);
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
