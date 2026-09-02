import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllSubcategories = async (req: Request, res: Response) => {
  try {
    const subcategories = await prisma.subcategory.findMany({
      orderBy: { title: 'asc' },
      include: {
        category: true
      }
    });
    res.json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subcategory = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
        apps: {
          include: {
            screens: {
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    
    res.json(subcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subcategory' });
  }
};

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { title, slug, description, status, categoryId } = req.body;
    
    const subcategory = await prisma.subcategory.create({
      data: { title, slug, description, status, categoryId },
    });
    
    res.status(201).json(subcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
};

export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, description, status, categoryId } = req.body;
    
    const subcategory = await prisma.subcategory.update({
      where: { id },
      data: { title, slug, description, status, categoryId },
    });
    
    res.json(subcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update subcategory' });
  }
};

export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subcategory.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
};

export const migrateSubcategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update all apps that belong to this subcategory to the new subcategory
      await tx.app.updateMany({
        where: { subcategoryId: id },
        data: { subcategoryId: targetId }
      });
      
      // 2. Delete the old subcategory
      await tx.subcategory.delete({
        where: { id }
      });
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to migrate and delete subcategory' });
  }
};
