import { Router, Request, Response } from 'express';
import { exportQueue, screenAnalysisQueue, getJobStatus, EXPORT_QUEUE_NAME, SCREEN_ANALYSIS_QUEUE_NAME } from '../queues/queue.manager';

const router = Router();

// Submit asynchronous export job
router.post('/jobs/export', async (req: Request, res: Response) => {
  try {
    const { screens, benchmarkData, format = 'docx' } = req.body;

    if (!screens || !Array.isArray(screens)) {
      return res.status(400).json({ error: 'Screens array is required' });
    }

    const job = await exportQueue.add('generate-export', {
      screens,
      benchmarkData,
      format,
    });

    return res.status(202).json({
      status: 'queued',
      jobId: job.id,
      queue: EXPORT_QUEUE_NAME,
      checkStatusUrl: `/queues/jobs/${EXPORT_QUEUE_NAME}/${job.id}`,
    });
  } catch (err: any) {
    console.error('[QueueRoute] Error dispatching export job:', err);
    return res.status(500).json({ error: err.message || 'Failed to queue export job' });
  }
});

// Submit asynchronous batch screen analysis job
router.post('/jobs/analyze-screens', async (req: Request, res: Response) => {
  try {
    const { screenIds } = req.body;

    if (!screenIds || !Array.isArray(screenIds) || screenIds.length === 0) {
      return res.status(400).json({ error: 'screenIds array is required' });
    }

    const job = await screenAnalysisQueue.add('batch-analysis', {
      screenIds,
    });

    return res.status(202).json({
      status: 'queued',
      jobId: job.id,
      queue: SCREEN_ANALYSIS_QUEUE_NAME,
      checkStatusUrl: `/queues/jobs/${SCREEN_ANALYSIS_QUEUE_NAME}/${job.id}`,
    });
  } catch (err: any) {
    console.error('[QueueRoute] Error dispatching analysis job:', err);
    return res.status(500).json({ error: err.message || 'Failed to queue screen analysis' });
  }
});

// Check status of any BullMQ background job
router.get('/jobs/:queueName/:jobId', async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;
    const status = await getJobStatus(queueName, jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.json({ status: 'success', job: status });
  } catch (err: any) {
    console.error('[QueueRoute] Error fetching job status:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve job status' });
  }
});

export default router;

