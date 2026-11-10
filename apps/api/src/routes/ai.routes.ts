import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { AiChatController } from '../controllers/ai-chat.controller';
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

// 4. Interactive Workspace Canvas Chat (Synchronous & Real-Time SSE Stream)
router.post('/workspace-chat', validateRequest(AIWorkspaceChatSchema), AIController.workspaceChat);
router.post('/workspace-chat/stream', validateRequest(AIWorkspaceChatSchema), AIController.workspaceChatStream);

// 5. Continuous AI Chat Sessions & Context Window
router.get('/sessions', AiChatController.listSessions);
router.get('/sessions/:id', AiChatController.getSession);
router.delete('/sessions/:id', AiChatController.deleteSession);
router.post('/sessions', AiChatController.createSession);
router.post('/feedback', AiChatController.submitFeedback);
router.get('/training/export', AiChatController.exportDataset);
router.get('/admin/chats', AiChatController.adminListChats);

export default router;
