import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllUiElements = async (req: Request, res: Response) => {
  try {
    const uiElements = await prisma.uiElement.findMany({
      orderBy: { title: 'asc' },
    });
    res.json(uiElements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch UI elements' });
  }
};

export const getUiElementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const uiElement = await prisma.uiElement.findUnique({
      where: { id },
      include: {
        screens: {
          select: { id: true }
        }
      }
    });
    
    if (!uiElement) {
      return res.status(404).json({ error: 'UI Element not found' });
    }
    
    res.json(uiElement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch UI element' });
  }
};

export const createUiElement = async (req: Request, res: Response) => {
  try {
    const { title, slug, content, status } = req.body;
    
    const uiElement = await prisma.uiElement.create({
      data: { title, slug, content, status },
    });
    
    res.status(201).json(uiElement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create UI element' });
  }
};

export const updateUiElement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, status } = req.body;
    
    const uiElement = await prisma.uiElement.update({
      where: { id },
      data: { title, slug, content, status },
    });
    
    res.json(uiElement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update UI element' });
  }
};

export const deleteUiElement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.uiElement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete UI element' });
  }
};

export const migrateUiElement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }

    await prisma.$transaction(async (tx) => {
      const screens = await tx.screen.findMany({
        where: { uiElements: { some: { id } } },
        select: { id: true }
      });

      for (const screen of screens) {
        await tx.screen.update({
          where: { id: screen.id },
          data: { uiElements: { connect: { id: targetId } } }
        });
      }

      await tx.uiElement.delete({ where: { id } });
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to migrate and delete UI element' });
  }
};
