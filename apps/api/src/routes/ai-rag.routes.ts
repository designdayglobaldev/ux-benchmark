import { Router } from 'express';
import { benchmarkRAGHandler } from '../controllers/ai-rag.controller';
import { validateRequest, AIBenchmarkRAGSchema } from '../middleware/validate';

const router = Router();

// Multimodal RAG Benchmark Audit
router.post('/benchmark-rag', validateRequest(AIBenchmarkRAGSchema), benchmarkRAGHandler);

export default router;
