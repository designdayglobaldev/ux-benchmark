import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import {
  validateRequest,
  AIInspectSchema,
  AIInsightsSchema,
  AICompareSchema,
  AIDetectContextSchema,
  AIBenchmarkSchema,
  AIGenerateScreenDataSchema,
  AIBenchmarkChatSchema,
  AIImproveDesignSchema,
  AIDesignAgentGenerateSchema,
  AIWorkspaceChatSchema,
} from '../middleware/validate';

const router = Router();

// 1. Vision & Inspection Routes
router.post('/inspect', validateRequest(AIInspectSchema), AIController.inspect);
router.post('/insights', validateRequest(AIInsightsSchema), AIController.insights);
router.post('/compare', validateRequest(AICompareSchema), AIController.compare);
router.post('/generate-screen-data', validateRequest(AIGenerateScreenDataSchema), AIController.generateScreenData);

// 2. Benchmark Routes
router.post('/detect-context', validateRequest(AIDetectContextSchema), AIController.detectContext);
router.post('/benchmark', validateRequest(AIBenchmarkSchema), AIController.benchmark);
router.post('/benchmark-chat', validateRequest(AIBenchmarkChatSchema), AIController.benchmarkChat);
router.post('/improve-design', validateRequest(AIImproveDesignSchema), AIController.improveDesign);

// 3. Design Agent Studio Routes
router.get('/design-agent/filters', AIController.getDesignAgentFilters);
router.post('/design-agent/generate', validateRequest(AIDesignAgentGenerateSchema), AIController.generateDesignAgent);

// 4. Interactive Workspace Canvas Chat
router.post('/workspace-chat', validateRequest(AIWorkspaceChatSchema), AIController.workspaceChat);

export default router;
