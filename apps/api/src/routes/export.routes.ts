import { Router, Request, Response } from 'express';
import { ExportService } from '../services/export.service';
import { redis } from '../lib/redis';

const router = Router();

// Synchronous fallback endpoint for DOCX download
router.post('/docx', async (req: Request, res: Response): Promise<any> => {
  try {
    const { screens, benchmarkData } = req.body;

    if (!screens || !Array.isArray(screens)) {
      return res.status(400).json({ error: 'Screens data is required.' });
    }

    const buffer = await ExportService.generateDocxBuffer({ screens, benchmarkData });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="UX-Benchmark-Report.docx"');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Download worker-generated artifact from Redis
router.get('/download/:jobId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    const cacheKey = `artifact:export:${jobId}`;

    if (!redis || redis.status !== 'ready') {
      return res.status(503).json({ error: 'Cache unavailable to retrieve completed export.' });
    }

    const cached = await redis.get(cacheKey);
    if (!cached) {
      return res.status(404).json({ error: 'Export artifact not found or expired.' });
    }

    const { bufferBase64, format } = JSON.parse(cached);
    const buffer = Buffer.from(bufferBase64, 'base64');

    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="UX-Benchmark-Report-${jobId}.${format || 'docx'}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (error: any) {
    console.error('Error serving export download:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
