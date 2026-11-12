import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { AiChatController } from '../controllers/ai-chat.controller';
import { metered } from '../middleware/metered';
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

// 1. Vision & Inspection Routes (Metered)
router.post('/inspect', validateRequest(AIInspectSchema), metered('SCREEN_INSPECT', AIController.inspect));
router.post('/insights', validateRequest(AIInsightsSchema), metered('SCREEN_INSIGHTS', AIController.insights));
router.post('/compare', validateRequest(AICompareSchema), metered('SCREEN_COMPARE', AIController.compare));
router.post('/generate-screen-data', validateRequest(AIGenerateScreenDataSchema), AIController.generateScreenData);

// 2. Benchmark Routes (Metered)
router.post('/detect-context', validateRequest(AIDetectContextSchema), metered('DETECT_CONTEXT', AIController.detectContext));
router.post('/benchmark', validateRequest(AIBenchmarkSchema), metered('BENCHMARK', AIController.benchmark));
router.post('/benchmark-chat', validateRequest(AIBenchmarkChatSchema), metered('BENCHMARK_CHAT', AIController.benchmarkChat));
router.post('/improve-design', validateRequest(AIImproveDesignSchema), metered('IMPROVE_DESIGN', AIController.improveDesign));

// 3. Design Agent Studio Routes (Metered)
router.get('/design-agent/filters', AIController.getDesignAgentFilters);
router.post('/design-agent/generate', validateRequest(AIDesignAgentGenerateSchema), metered('DESIGN_AGENT', AIController.generateDesignAgent));

// 4. Interactive Workspace Canvas Chat (Synchronous & Real-Time SSE Stream - Metered)
router.post('/workspace-chat', validateRequest(AIWorkspaceChatSchema), metered('WORKSPACE_CHAT', AIController.workspaceChat));
router.post('/workspace-chat/stream', validateRequest(AIWorkspaceChatSchema), metered('WORKSPACE_CHAT', AIController.workspaceChatStream));

// 5. Continuous AI Chat Sessions & Context Window
router.get('/sessions', AiChatController.listSessions);
router.get('/sessions/:id', AiChatController.getSession);
router.delete('/sessions/:id', AiChatController.deleteSession);
router.post('/sessions', AiChatController.createSession);
router.post('/feedback', AiChatController.submitFeedback);
router.get('/training/export', AiChatController.exportDataset);
router.get('/admin/chats', AiChatController.adminListChats);

export default router;
