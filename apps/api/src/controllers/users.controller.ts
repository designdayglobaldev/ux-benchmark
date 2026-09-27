import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getClientUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.clientUser.findMany({
      include: {
        usages: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1, // Only get current month usage
        },
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching client users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateClientTier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (tier !== 'FREE' && tier !== 'PREMIUM') {
      return res.status(400).json({ message: 'Invalid tier' });
    }

    const user = await prisma.clientUser.update({
      where: { id },
      data: { tier },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating client tier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
