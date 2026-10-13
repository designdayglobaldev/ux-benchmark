import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import Anthropic from '@anthropic-ai/sdk';
import { activeProcessingScreens, markScreensProcessing, unmarkScreenProcessing } from '../services/analysis-queue.service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_to_prevent_crash',
});

export const getAllScreens = async (req: Request, res: Response) => {
  try {
    const { appId, page, limit, search } = req.query;
    const whereClause: any = appId ? { appId: String(appId) } : {};

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { app: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    // Default pagination to page 1, 50 items per page if requested
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    const [screens, total] = await Promise.all([
      prisma.screen.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          screenNo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          appId: true,
          flowId: true,
          app: { select: { name: true, slug: true, appLogo: true } },
          flow: { select: { name: true, slug: true } },
          uiElements: { select: { id: true, title: true } },
          patterns: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.screen.count({ where: whereClause })
    ]);

    // Update consumers to expect { data, meta }
    res.json({
      data: screens,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch screens' });
  }
};

export const getScreenById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        app: { select: { name: true, slug: true, appLogo: true } },
        flow: { select: { name: true, slug: true } },
        uiElements: true,
        patterns: true,
      },
    });

    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' });
    }

    res.json(screen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch screen' });
  }
};

export const createScreen = async (req: Request, res: Response) => {
  try {
    const { 
      appId, flowId, screenNo, name, slug, imageUrl, 
      uxAnalysis, tonalityAndContent, keyHighlights, evidenceWhoWhy, whereToUse, whereNotToUse,
      similarApps, status, uiElementIds, patternIds
    } = req.body;

    const screen = await prisma.screen.create({
      data: {
        name,
        slug,
        imageUrl,
        screenNo: screenNo ? parseInt(screenNo, 10) : null,
        uxAnalysis,
        tonalityAndContent,
        keyHighlights,
        evidenceWhoWhy,
        whereToUse,
        whereNotToUse,
        similarApps: similarApps || [],
        status,
        appId,
        flowId: flowId || null,
        uiElements: {
          connect: uiElementIds?.map((id: string) => ({ id })) || [],
        },
        patterns: {
          connect: patternIds?.map((id: string) => ({ id })) || [],
        },
      },
    });

    res.status(201).json(screen);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to create screen' });
  }
};

export const updateScreen = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      appId, flowId, screenNo, name, slug, imageUrl, 
      uxAnalysis, tonalityAndContent, keyHighlights, evidenceWhoWhy, whereToUse, whereNotToUse,
      similarApps, status, uiElementIds, patternIds
    } = req.body;

    const screen = await prisma.screen.update({
      where: { id },
      data: {
        name,
        slug,
        imageUrl,
        screenNo: screenNo ? parseInt(screenNo, 10) : null,
        uxAnalysis,
        tonalityAndContent,
        keyHighlights,
        evidenceWhoWhy,
        whereToUse,
        whereNotToUse,
        similarApps: similarApps || [],
        status,
        appId,
        flowId: flowId || null,
        uiElements: {
          set: uiElementIds?.map((id: string) => ({ id })) || [],
        },
        patterns: {
          set: patternIds?.map((id: string) => ({ id })) || [],
        },
      },
    });

    res.json(screen);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to update screen' });
  }
};

export const deleteScreen = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.screen.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete screen' });
  }
};

export const getUnprocessedScreens = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const pageNum = page ? parseInt(String(page), 10) : 1;
    const limitNum = limit ? parseInt(String(limit), 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    // Get current IDs actively processing in background
    const activeIds = Array.from(activeProcessingScreens);

    const whereClause: any = {
      AND: [
        {
          OR: [
            { uxAnalysis: null },
            { uxAnalysis: '' }
          ]
        }
      ]
    };

    // Only exclude actively processing jobs if there are any
    if (activeIds.length > 0) {
      whereClause.AND.push({
        id: { notIn: activeIds }
      });
    }

    const [screens, total] = await Promise.all([
      prisma.screen.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          screenNo: true,
          status: true,
          createdAt: true,
          appId: true,
          flowId: true,
          app: { select: { name: true, slug: true, appLogo: true } },
          flow: { select: { name: true, slug: true } },
          uiElements: { select: { id: true } },
          patterns: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.screen.count({ where: whereClause })
    ]);

    res.json({
      data: screens,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching unprocessed screens:', error);
    res.status(500).json({ error: 'Failed to fetch unprocessed screens' });
  }
};

async function executeClaudeScreenAnalysis(screenId: string) {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
    include: {
      app: true,
      flow: true,
    }
  });

  if (!screen) {
    throw new Error('Screen not found');
  }

  if (!screen.imageUrl) {
    throw new Error('Screen has no image URL');
  }

  // Fetch UI elements and Patterns for categorisation
  const [uiElements, patterns] = await Promise.all([
    prisma.uiElement.findMany({ select: { id: true, title: true } }),
    prisma.pattern.findMany({ select: { id: true, title: true } })
  ]);

  const validUiElementIds = new Set(uiElements.map(u => u.id));
  const validPatternIds = new Set(patterns.map(p => p.id));

  const uiElementsList = uiElements.map(u => `- ID: ${u.id} | Name: ${u.title}`).join('\n');
  const patternsList = patterns.map(p => `- ID: ${p.id} | Name: ${p.title}`).join('\n');

  let appContext = '';
  if (screen.app) {
    appContext = `
APP CONTEXT (Use this to deeply contextualize your analysis):
- App Name: ${screen.app.name}
- Description: ${screen.app.description || 'N/A'}
- Target Audience: ${screen.app.targetAudience || 'N/A'}
- Market: ${screen.app.market?.join(', ') || 'N/A'}
- Look & Feel: ${screen.app.lookAndFeelTags?.join(', ') || 'N/A'}
- Ease of Use: ${screen.app.easeOfUseTags?.join(', ') || 'N/A'}
`;
  }

  // Fetch image buffer & convert to base64
  const imgRes = await fetch(screen.imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Failed to download screen image: ${imgRes.statusText}`);
  }
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString('base64');

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system: `You are an elite Senior UX Researcher and Product Designer. Your task is to analyze the provided screenshot of a mobile/web application screen and auto-generate comprehensive metadata for a UX library database.
Write high-quality, professional, descriptive, and actionable content. Be very insightful and focus on the deep psychological and usability reasons for the design. Use proper HTML formatting (e.g., <p>, <strong>, <ul>) for all text fields since they will be rendered in a Rich Text Editor.

${appContext}

Additionally, you must accurately categorize the screen by selecting the most relevant UI Elements and UX Patterns from the following available lists. Return an array of the corresponding IDs. Do not make up IDs.

AVAILABLE UI ELEMENTS:
${uiElementsList}

AVAILABLE UX PATTERNS:
${patternsList}

IMPORTANT: You MUST use the submit_screen_data tool properly. Output a real JSON object with the generated data.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/webp", data: base64Image } },
          { type: "text", text: "Please analyze this UI screen and generate the structured screen data, including assigning relevant uiElementIds and patternIds." }
        ]
      }
    ],
    tools: [
      {
        name: "submit_screen_data",
        description: "Submit the structured screen metadata and UX analysis",
        input_schema: {
          type: "object",
          properties: {
            uxAnalysis: { type: "string", description: "Deep analysis of the overall user experience and layout. Format as HTML." },
            tonalityAndContent: { type: "string", description: "Analysis of the copywriting, tone of voice, and messaging strategy. Format as HTML." },
            keyHighlights: { type: "string", description: "The most brilliant or noteworthy UX/UI decisions on this screen. Format as HTML." },
            evidenceWhoWhy: { type: "string", description: "Analysis of the target demographic this screen serves and the psychological triggers it relies on. Format as HTML." },
            whereToUse: { type: "string", description: "Recommendations on when a designer should steal or adapt this pattern. Format as HTML." },
            whereNotToUse: { type: "string", description: "Warnings on when this pattern would fail or be inappropriate. Format as HTML." },
            uiElementIds: { type: "array", items: { type: "string" } },
            patternIds: { type: "array", items: { type: "string" } }
          },
          required: ["uxAnalysis", "tonalityAndContent", "keyHighlights", "evidenceWhoWhy", "whereToUse", "whereNotToUse", "uiElementIds", "patternIds"]
        }
      }
    ],
    tool_choice: { type: "tool", name: "submit_screen_data" }
  });

  const toolCall = message.content.find((block: any) => block.type === 'tool_use');
  if (!toolCall || toolCall.type !== 'tool_use') {
    throw new Error('Claude did not return structured screen data');
  }

  const parsed = toolCall.input as any;

  const updatedScreen = await prisma.screen.update({
    where: { id: screenId },
    data: {
      uxAnalysis: parsed.uxAnalysis || '',
      tonalityAndContent: parsed.tonalityAndContent || '',
      keyHighlights: parsed.keyHighlights || '',
      evidenceWhoWhy: parsed.evidenceWhoWhy || '',
      whereToUse: parsed.whereToUse || '',
      whereNotToUse: parsed.whereNotToUse || '',
      uiElements: Array.isArray(parsed.uiElementIds) 
        ? { connect: parsed.uiElementIds.filter((id: string) => validUiElementIds.has(id)).map((id: string) => ({ id })) } 
        : undefined,
      patterns: Array.isArray(parsed.patternIds) 
        ? { connect: parsed.patternIds.filter((id: string) => validPatternIds.has(id)).map((id: string) => ({ id })) } 
        : undefined,
    },
    include: {
      uiElements: true,
      patterns: true,
    }
  });

  return updatedScreen;
}

export const analyzeScreen = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await executeClaudeScreenAnalysis(id);
    res.json({ message: 'Screen analyzed successfully', screen: updated });
  } catch (error: any) {
    console.error(`Analyze screen ${req.params.id} error:`, error);
    const msg = (error?.message || '').toLowerCase();
    if (error?.status === 429 || error?.status === 402 || msg.includes('credit') || msg.includes('balance') || msg.includes('billing') || msg.includes('quota') || msg.includes('fund')) {
      return res.status(402).json({ error: 'Claude AI credits expired! Please recharge your Anthropic account.' });
    }
    res.status(500).json({ error: error.message || 'Failed to analyze screen' });
  }
};

export const batchAnalyzeScreens = async (req: Request, res: Response) => {
  try {
    const { screenIds } = req.body;
    if (!Array.isArray(screenIds) || screenIds.length === 0) {
      return res.status(400).json({ error: 'screenIds array is required' });
    }

    const results: { screenId: string; success: boolean; error?: string }[] = [];

    for (const screenId of screenIds) {
      try {
        await executeClaudeScreenAnalysis(screenId);
        results.push({ screenId, success: true });
      } catch (err: any) {
        console.error(`Batch analyze failed for ${screenId}:`, err);
        const msg = (err?.message || '').toLowerCase();
        const isQuotaError = err?.status === 429 || err?.status === 402 || msg.includes('credit') || msg.includes('balance') || msg.includes('billing') || msg.includes('quota') || msg.includes('fund');
        
        results.push({ 
          screenId, 
          success: false, 
          error: isQuotaError ? 'Claude AI credits expired' : (err.message || 'Analysis failed') 
        });

        if (isQuotaError) {
          // Short-circuit the remaining batch
          console.warn('[Batch Analyze] Stopping remaining batch due to Claude credit depletion.');
          break;
        }
      }
    }

    res.json({
      message: 'Batch analysis completed',
      results,
      successfulCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length
    });
  } catch (error: any) {
    console.error('Batch analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed batch analysis' });
  }
};

