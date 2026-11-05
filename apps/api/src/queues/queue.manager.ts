import { Queue, QueueEvents } from 'bullmq';
import { createRedisClient } from '../lib/redis';

// Dedicated connection options for BullMQ
const getRedisConnection = () => {
  return createRedisClient();
};

// 1. Queue Definitions
export const EXPORT_QUEUE_NAME = 'export-jobs';
export const SCREEN_ANALYSIS_QUEUE_NAME = 'screen-analysis-jobs';

export const exportQueue = new Queue(EXPORT_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600, // keep completed jobs for 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // keep failed jobs for 24 hours
    },
  },
});

export const screenAnalysisQueue = new Queue(SCREEN_ANALYSIS_QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 200,
    },
  },
});

// 2. Queue Events Listener for Real-time Monitoring
export const exportQueueEvents = new QueueEvents(EXPORT_QUEUE_NAME, {
  connection: getRedisConnection(),
});

// 3. Status Helper
export async function getJobStatus(queueName: string, jobId: string) {
  const queue = queueName === EXPORT_QUEUE_NAME ? exportQueue : screenAnalysisQueue;
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    name: job.name,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}
