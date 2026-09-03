import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { z } from 'zod';

const createRequestSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  productLink: z.string().min(2),
});

export const createAppRequest = async (req: Request, res: Response) => {
  try {
    const validatedData = createRequestSchema.parse(req.body);

    const appRequest = await prisma.appRequest.create({
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        productLink: validatedData.productLink,
      },
    });

    res.status(201).json(appRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating app request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAppRequests = async (req: Request, res: Response) => {
  try {
    const appRequests = await prisma.appRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(appRequests);
  } catch (error) {
    console.error('Error fetching app requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAppRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appRequest = await prisma.appRequest.update({
      where: { id },
      data: { status },
    });

    res.json(appRequest);
  } catch (error) {
    console.error('Error updating app request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAppRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.appRequest.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting app request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
