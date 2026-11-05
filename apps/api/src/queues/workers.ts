import { Worker, type Job } from 'bullmq';
import { createRedisClient, redis } from '../lib/redis';
import { EXPORT_QUEUE_NAME, SCREEN_ANALYSIS_QUEUE_NAME } from './queue.manager';
import { markScreensProcessing, unmarkScreenProcessing } from '../services/analysis-queue.service';
import { ExportService } from '../services/export.service';
import { prisma } from '../db/prisma';

// 1. Export Worker Processor
export const exportWorker = new Worker(
  EXPORT_QUEUE_NAME,
  async (job: Job) => {
    console.log(`[BullMQ:Export] Processing job ${job.id}: ${job.name}`);
    await job.updateProgress(15);

    const { screens = [], benchmarkData, format = 'docx' } = job.data;

    await job.updateProgress(35);

    // Generate real document buffer using ExportService
    const docBuffer = await ExportService.generateDocxBuffer({ screens, benchmarkData });
    await job.updateProgress(75);

    // Cache the base64 artifact in Redis for 1 hour
    const cacheKey = `artifact:export:${job.id}`;
    if (redis && redis.status === 'ready') {
      await redis.set(
        cacheKey,
        JSON.stringify({
          bufferBase64: docBuffer.toString('base64'),
          format,
          completedAt: new Date().toISOString()
        }),
        'EX',
        3600
      );
    }

    await job.updateProgress(100);
    return {
      status: 'completed',
      downloadUrl: `/export/download/${job.id}`,
      format,
    };
  },
  {
    connection: createRedisClient(),
    concurrency: 5,
  }
);

// 2. Screen Analysis Worker Processor
export const screenAnalysisWorker = new Worker(
  SCREEN_ANALYSIS_QUEUE_NAME,
  async (job: Job) => {
    console.log(`[BullMQ:ScreenAnalysis] Processing job ${job.id} for screens:`, job.data.screenIds);
    const { screenIds } = job.data;

    if (!Array.isArray(screenIds) || screenIds.length === 0) {
      return { processed: 0 };
    }

    await markScreensProcessing(screenIds);
    await job.updateProgress(10);

    try {
      let completedCount = 0;
      for (const screenId of screenIds) {
        const screen = await prisma.screen.findUnique({
          where: { id: screenId },
          select: { id: true, name: true, imageUrl: true }
        });

        if (screen) {
          completedCount++;
        }

        await unmarkScreenProcessing(screenId);
        const progressPercentage = Math.round((completedCount / screenIds.length) * 100);
        await job.updateProgress(progressPercentage);
      }

      return {
        status: 'completed',
        processedScreens: completedCount,
      };
    } catch (err: any) {
      for (const screenId of screenIds) {
        await unmarkScreenProcessing(screenId);
      }
      throw err;
    }
  },
  {
    connection: createRedisClient(),
    concurrency: 3,
  }
);
