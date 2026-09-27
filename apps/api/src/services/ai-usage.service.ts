import { prisma } from '../db/prisma';

export const getTierLimit = async (tier: 'FREE' | 'PREMIUM'): Promise<number> => {
  const config = await prisma.tierConfig.findUnique({
    where: { tier },
  });
  
  if (config) {
    return config.monthlyPromptLimit;
  }
  
  // Default fallbacks if config is missing (or not seeded yet)
  return tier === 'PREMIUM' ? 100 : 10;
};

export const checkCanUseAi = async (userId: string): Promise<boolean> => {
  const user = await prisma.clientUser.findUnique({
    where: { id: userId },
  });
  
  // If user doesn't exist, assume free tier (they might not have triggered the DB sync yet)
  const tier = user?.tier || 'FREE';
  const limit = await getTierLimit(tier);
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const usage = await prisma.aiUsage.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  const promptsUsed = usage?.promptsUsed || 0;
  return promptsUsed < limit;
};

export const getAiUsage = async (userId: string) => {
  const user = await prisma.clientUser.findUnique({
    where: { id: userId },
  });
  
  const tier = user?.tier || 'FREE';
  const limit = await getTierLimit(tier);
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const usage = await prisma.aiUsage.findUnique({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
  });

  return { limit, usage };
};

export const incrementAiUsage = async (userId: string): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Upsert the usage record
  await prisma.aiUsage.upsert({
    where: {
      userId_month_year: {
        userId,
        month,
        year,
      },
    },
    update: {
      promptsUsed: {
        increment: 1,
      },
    },
    create: {
      userId,
      month,
      year,
      promptsUsed: 1,
    },
  });
};
