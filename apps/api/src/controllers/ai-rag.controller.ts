import { Request, Response } from 'express';
import { executeBenchmarkRAG } from '../services/ai-rag.service';

export const benchmarkRAGHandler = async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const result = await executeBenchmarkRAG(imageBase64);
    res.json(result);
  } catch (error: any) {
    console.error('[AI RAG Controller] Benchmark RAG Error:', error);
    const statusCode = error.message?.includes('No benchmark screens found') ? 404 : 500;
    res.status(statusCode).json({
      error: error?.message || 'An error occurred during RAG benchmark audit',
    });
  }
};

