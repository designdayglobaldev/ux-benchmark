import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllPatterns = async (req: Request, res: Response) => {
  try {
    const patterns = await prisma.pattern.findMany({
      orderBy: { title: 'asc' },
    });
    res.json(patterns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
};

export const getPatternById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pattern = await prisma.pattern.findUnique({
      where: { id },
      include: {
        screens: {
          select: { id: true }
        }
      }
    });
    
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    
    res.json(pattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pattern' });
  }
};

export const createPattern = async (req: Request, res: Response) => {
  try {
    const { title, slug, content, status } = req.body;
    
    const pattern = await prisma.pattern.create({
      data: { title, slug, content, status },
    });
    
    res.status(201).json(pattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create pattern' });
  }
};

export const updatePattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, status } = req.body;
    
    const pattern = await prisma.pattern.update({
      where: { id },
      data: { title, slug, content, status },
    });
    
    res.json(pattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update pattern' });
  }
};

export const deletePattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.pattern.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
};

export const migratePattern = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }

    await prisma.$transaction(async (tx) => {
      const screens = await tx.screen.findMany({
        where: { patterns: { some: { id } } },
        select: { id: true }
      });

      for (const screen of screens) {
        await tx.screen.update({
          where: { id: screen.id },
          data: { patterns: { connect: { id: targetId } } }
        });
      }

      await tx.pattern.delete({ where: { id } });
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to migrate and delete pattern' });
  }
};
