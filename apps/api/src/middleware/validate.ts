import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error: any) {
      if (error && error.issues) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request payload',
          errors: error.issues.map((issue: any) => ({
            field: issue.path ? issue.path.join('.') : '',
            message: issue.message
          }))
        });
      }
      return res.status(400).json({ status: 'error', message: 'Bad Request' });
    }
  };
};

export const RegionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).optional();

export const AIInspectSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
  region: RegionSchema,
});

export const AIInsightsSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
  screenId: z.string().optional(),
  appName: z.string().optional(),
});

export const AICompareSchema = z.object({
  originalImageBase64: z.string().min(1, 'Original screen image is required'),
  userImageBase64: z.string().min(1, 'User screen redesign image is required'),
});

export const AIDetectContextSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
});

export const AIBenchmarkSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
  categoryId: z.string().min(1, 'categoryId is required'),
  subcategoryId: z.string().min(1, 'subcategoryId is required'),
  flowId: z.string().min(1, 'flowId is required'),
  screenType: z.string().optional(),
});

export const AIGenerateScreenDataSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
  appId: z.string().optional(),
});

export const AIBenchmarkChatSchema = z.object({
  message: z.string().min(1, 'Chat message is required'),
  chatHistory: z.array(z.any()).optional().default([]),
  benchmarkData: z.record(z.string(), z.any()),
});

export const AIImproveDesignSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
  benchmarkResult: z.record(z.string(), z.any()),
});

export const AIDesignAgentGenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  category: z.string().optional(),
  flow: z.string().optional(),
  device: z.string().optional().default('mobile'),
});

export const AIWorkspaceChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  conversationHistory: z.array(z.any()).optional().default([]),
});

export const AIBenchmarkRAGSchema = z.object({
  imageBase64: z.string().min(1, 'Screen image base64 is required'),
});
