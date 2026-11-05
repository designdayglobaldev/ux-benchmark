import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';

export class AIController {
  public static async inspect(req: Request, res: Response) {
    try {
      const { prompt, region, imageBase64 } = req.body;
      const response = await AIService.inspectScreen({ prompt, region, imageBase64 });
      return res.json({ response });
    } catch (error: any) {
      console.error('[AIController.inspect] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred during AI inspection' });
    }
  }

  public static async insights(req: Request, res: Response) {
    try {
      const { imageBase64, screenId, appName } = req.body;
      const data = await AIService.generateInsights({ imageBase64, screenId, appName });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.insights] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating insights' });
    }
  }

  public static async compare(req: Request, res: Response) {
    try {
      const { originalImageBase64, userImageBase64 } = req.body;
      const data = await AIService.compareScreens({ originalImageBase64, userImageBase64 });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.compare] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating comparison' });
    }
  }

  public static async detectContext(req: Request, res: Response) {
    try {
      const { imageBase64 } = req.body;
      const data = await AIService.detectContext({ imageBase64 });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.detectContext] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while detecting context' });
    }
  }

  public static async benchmark(req: Request, res: Response) {
    try {
      const { imageBase64, categoryId, subcategoryId, flowId, screenType } = req.body;
      const data = await AIService.benchmarkScreen({ imageBase64, categoryId, subcategoryId, flowId, screenType });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.benchmark] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating benchmark' });
    }
  }

  public static async generateScreenData(req: Request, res: Response) {
    try {
      const { imageBase64, appId } = req.body;
      const data = await AIService.generateScreenData({ imageBase64, appId });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.generateScreenData] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while generating screen data' });
    }
  }

  public static async benchmarkChat(req: Request, res: Response) {
    try {
      const { message, chatHistory, benchmarkData } = req.body;
      const data = await AIService.chatBenchmark({ message, chatHistory, benchmarkData });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.benchmarkChat] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred while chatting' });
    }
  }

  public static async improveDesign(req: Request, res: Response) {
    try {
      const { imageBase64, benchmarkResult } = req.body;
      const data = await AIService.improveDesign({ imageBase64, benchmarkResult });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.improveDesign] Error:', error);
      return res.status(500).json({ error: error?.message || 'An error occurred during AI design improvement' });
    }
  }

  public static async getDesignAgentFilters(_req: Request, res: Response) {
    try {
      const data = await AIService.getDesignAgentFilters();
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.getDesignAgentFilters] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to fetch categories and flows' });
    }
  }

  public static async generateDesignAgent(req: Request, res: Response) {
    try {
      const { prompt, category, flow, device } = req.body;
      const data = await AIService.generateDesignAgentScreen({ prompt, category, flow, device });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.generateDesignAgent] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to generate design screen' });
    }
  }

  public static async workspaceChat(req: Request, res: Response) {
    try {
      const { prompt, conversationHistory } = req.body;
      const data = await AIService.chatWorkspace({ prompt, conversationHistory });
      return res.json(data);
    } catch (error: any) {
      console.error('[AIController.workspaceChat] Error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to process AI research chat' });
    }
  }
}
