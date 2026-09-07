import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { lite } = req.query;
    
    if (lite === 'true') {
      const categories = await prisma.category.findMany({
        orderBy: { title: 'asc' },
        select: { id: true, title: true, subcategories: { select: { id: true, title: true } } }
      });
      return res.json(categories);
    }

    const categories = await prisma.category.findMany({
      orderBy: { title: 'asc' },
      include: {
        subcategories: true,
        _count: {
          select: {
            apps: {
              where: { status: 'LIVE' }
            }
          }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        subcategories: true,
        apps: {
          select: {
            id: true,
            name: true,
            slug: true,
            appLogo: true,
            appThumbnail: true,
            categoryId: true,
            subcategoryId: true,
            status: true,
            screens: {
              select: { id: true }
            }
          }
        }
      }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { title, slug, description, status } = req.body;
    
    const category = await prisma.category.create({
      data: { title, slug, description, status },
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, slug, description, status } = req.body;
    
    const category = await prisma.category.update({
      where: { id },
      data: { title, slug, description, status },
    });
    
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

export const migrateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({ error: 'targetId is required' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update all apps that belong to this category to the new category
      await tx.app.updateMany({
        where: { categoryId: id },
        data: { categoryId: targetId }
      });
      
      // 2. Delete the old category
      await tx.category.delete({
        where: { id }
      });
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to migrate and delete category' });
  }
};
