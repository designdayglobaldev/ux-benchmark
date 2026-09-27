import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const getTierConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.tierConfig.findMany();
    res.status(200).json(configs);
  } catch (error) {
    console.error('Error fetching tier configs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTierConfig = async (req: Request, res: Response) => {
  try {
    const { tier } = req.params;
    const { monthlyPromptLimit } = req.body;

    if (typeof monthlyPromptLimit !== 'number') {
      return res.status(400).json({ message: 'monthlyPromptLimit must be a number' });
    }

    const config = await prisma.tierConfig.upsert({
      where: { tier: tier as any },
      update: { monthlyPromptLimit },
      create: { tier: tier as any, monthlyPromptLimit },
    });

    res.status(200).json(config);
  } catch (error) {
    console.error('Error updating tier config:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
