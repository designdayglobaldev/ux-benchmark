import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

router.post('/inspect', async (req, res) => {
  try {
    const { prompt, region, imageBase64 } = req.body;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: 'Missing prompt or imageBase64 in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    // Prepare context about the region
    let regionContext = '';
    if (region && typeof region.x === 'number') {
      regionContext = `The user has highlighted a specific region of this screen (x: ${Math.round(region.x)}, y: ${Math.round(region.y)}, width: ${Math.round(region.width)}, height: ${Math.round(region.height)}). `;
    }

    // Ensure the image string doesn't contain the data URI prefix if it's there
    const match = imageBase64.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/);
    const mediaType = match ? (match[1] === 'image/jpg' ? 'image/jpeg' : match[1]) : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: "You are an expert UX/UI designer and software engineer. Analyze the provided screenshot and answer the user's question. If they highlighted a region, focus specifically on that region and its context within the broader screen.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', // We will force jpeg in canvas extraction
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `${regionContext}User's Question: ${prompt}`,
            }
          ],
        },
      ],
    });

    // The response is an array of content blocks, usually just one text block
    const aiResponse = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    res.json({ response: aiResponse });
  } catch (error: any) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred during AI inspection' });
  }
});
router.post('/insights', async (req, res) => {
  try {
    const { imageBase64, screenId, appName } = req.body;

    // 1. Database Check & Metadata Retrieval
    let screenMetadata: { name?: string; flowName?: string; appName?: string } = { appName };
    if (screenId) {
      const existingScreen: any = await (prisma.screen as any).findUnique({
        where: { id: screenId },
        select: { 
          name: true,
          hotspots: true,
          flow: { select: { name: true } },
          app: { select: { name: true } }
        }
      });

      if (existingScreen) {
        screenMetadata.name = existingScreen.name;
        screenMetadata.flowName = existingScreen.flow?.name;
        screenMetadata.appName = existingScreen.app?.name || appName;

        // Return cached hotspots immediately if already generated
        if (existingScreen.hotspots && Array.isArray((existingScreen.hotspots as any).insights) && (existingScreen.hotspots as any).insights.length > 0) {
          return res.json(existingScreen.hotspots);
        }
      }
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    const match = imageBase64.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/);
    const mediaType = match ? (match[1] === 'image/jpg' ? 'image/jpeg' : match[1]) : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const screenContextStr = [
      screenMetadata.appName ? `App: "${screenMetadata.appName}"` : '',
      screenMetadata.flowName ? `User Flow: "${screenMetadata.flowName}"` : '',
      screenMetadata.name ? `Screen Name: "${screenMetadata.name}"` : ''
    ].filter(Boolean).join(' | ');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 3000,
      system: `You are the lead product designer & growth teardown critic at a tier-1 product studio (Figma, Linear, Apple, Mobbin caliber).
Analyze the provided mobile UI screenshot with intense product critique and surgical spatial accuracy.
${screenContextStr ? `Context: ${screenContextStr}.` : ''}

=== PART 1: COMPUTER GRAPHICS (CG) BOUNDING BOX GROUNDING (0 to 1000 Grid) ===
To position the inspection pin with exact mathematical precision, you MUST define the physical bounding box of the visual element on a normalized 1000 x 1000 coordinate grid:
- "ymin": Top edge of the element (0 = top of screen, 1000 = bottom of screen)
- "xmin": Left edge of the element (0 = left border, 1000 = right border)
- "ymax": Bottom edge of the element
- "xmax": Right edge of the element

=== PART 2: TEARDOWN CONTENT STANDARDS (SHORT, PUNCHY & SHARP) ===
STRICTLY FORBIDDEN:
❌ Do NOT write long paragraphs. Keep each description strictly to 1 or 2 concise, punchy sentences (UNDER 35 WORDS TOTAL).
❌ Do NOT use generic textbook clichés: "reduces cognitive load", "applies Hick's law", "uses progressive disclosure", "creates visual hierarchy".

REQUIRED TEARDOWN FRAMEWORK:
State the deliberate trade-off and the conversion lever in under 35 words.
Example: "Spotify promotes 'Wrapped' to a solid white campaign button instead of a neutral chip, guaranteeing seasonal engagement at the expense of regular feed navigation."

=== PART 3: DYNAMIC DENSITY COUNT ===
- Minimal / Splash / Single-Action screens: Return ONLY 1 or 2 high-impact teardowns. NEVER invent weak filler points!
- Rich Feeds / Complex Dashboards: Return 3 or 4 deep teardowns.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Perform an elite product design teardown with exact CG bounding boxes (0-1000 scale).',
            }
          ],
        },
      ],
      tools: [
        {
          name: 'submit_hotspots',
          description: 'Submit structured UX hotspot insights with exact 0-1000 CG bounding boxes',
          input_schema: {
            type: 'object',
            properties: {
              insights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    targetElement: { type: 'string', description: 'Brief element name' },
                    visibleReference: { type: 'string', description: 'Exact text or visual snippet' },
                    title: { type: 'string', description: 'Punchy growth critique title' },
                    category: { 
                      type: 'string', 
                      enum: ['Heuristic', 'Microcopy', 'Hierarchy', 'Conversion', 'Friction'] 
                    },
                    description: { type: 'string', description: 'Two crisp sentences with deliberate sacrifice and psychological mechanism' },
                    box_2d: {
                      type: 'array',
                      items: { type: 'number' },
                      description: '[ymin, xmin, ymax, xmax] on a 0-1000 grid'
                    }
                  },
                  required: ['targetElement', 'title', 'category', 'description', 'box_2d']
                }
              }
            },
            required: ['insights']
          }
        }
      ],
      tool_choice: { type: 'tool', name: 'submit_hotspots' }
    });

    const toolCall = message.content.find((block: any) => block.type === 'tool_use');
    if (!toolCall || toolCall.type !== 'tool_use') {
      throw new Error('Claude did not return structured hotspot data');
    }

    const parsedData = toolCall.input as any;

    // Computer Graphics Centroid Calculation:
    // Robustly handles both 0-1000 integer grids and 0.0-1.0 float scales
    if (parsedData.insights && Array.isArray(parsedData.insights)) {
      parsedData.insights = parsedData.insights.map((item: any) => {
        let x = typeof item.x === 'number' ? item.x : 50;
        let y = typeof item.y === 'number' ? item.y : 50;

        if (Array.isArray(item.box_2d) && item.box_2d.length === 4) {
          const [ymin, xmin, ymax, xmax] = item.box_2d.map(Number);
          
          // Check if coordinates are 0.0 - 1.0 (float) or 0 - 1000 (integer)
          const isFloatScale = (xmax <= 1.0 && ymax <= 1.0 && xmin <= 1.0 && ymin <= 1.0);
          const scaleMultiplier = isFloatScale ? 100 : 0.1;

          const centroidX = ((xmin + xmax) / 2) * scaleMultiplier;
          const centroidY = ((ymin + ymax) / 2) * scaleMultiplier;

          if (!isNaN(centroidX) && !isNaN(centroidY)) {
            x = Math.round(Math.max(5, Math.min(95, centroidX)) * 10) / 10;
            y = Math.round(Math.max(5, Math.min(95, centroidY)) * 10) / 10;
          }
        }

        return {
          title: item.title,
          description: item.description,
          category: item.category || 'Heuristic',
          x,
          y,
          targetElement: item.targetElement,
          visibleReference: item.visibleReference
        };
      });
    }

    // 2. Persist to Database if screenId is present
    if (screenId && parsedData.insights && Array.isArray(parsedData.insights)) {
      try {
        await (prisma.screen as any).update({
          where: { id: screenId },
          data: { hotspots: parsedData }
        });
      } catch (dbErr) {
        console.warn('Could not cache hotspots in DB:', dbErr);
      }
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while generating insights' });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { originalImageBase64, userImageBase64 } = req.body;

    if (!originalImageBase64 || !userImageBase64) {
      return res.status(400).json({ error: 'Missing originalImageBase64 or userImageBase64 in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    const extractImageDetails = (base64Str: string) => {
      const match = base64Str.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/);
      if (match) {
        let mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        if (mediaType === 'image/jpg' as any) mediaType = 'image/jpeg';
        return {
          mediaType,
          data: base64Str.replace(match[0], '')
        };
      }
      return { mediaType: 'image/jpeg' as const, data: base64Str };
    };

    const originalImg = extractImageDetails(originalImageBase64);
    const userImg = extractImageDetails(userImageBase64);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: `You are an elite Senior UX Researcher. You are conducting a blind comparison between two UI screens: Screen A (Original) and Screen B (User Redesign).
CRITICAL: Do not assume either screen is better. Be ruthless, objective, and highly critical of both designs equally based strictly on UX heuristics.

Judge each category holistically across the entire screen — don't just point to one or two UI elements as your evidence. Your originalText/userText should describe the overall page-level accessibility/usability/etc., using specific elements only as supporting examples, not as the entire basis for the verdict.

Do NOT just describe the UI line-by-line. You must evaluate the *holistic UX impact* of the designs according to these exact parameters:
1. Accessibility: Is contrast sufficient across the entire screen? Are all interactive elements distinguishable without relying on color alone? Is text legible at a glance? Is the reading order logical top to bottom?
2. Usability: Does the whole flow make sense? Can a first-time user tell what to do next? Is the primary action obvious? Is there wasted or confusing structure anywhere?
3. Content Language: Evaluate page-level microcopy, scannability, tone, and clarity of information architecture.
4. Visual Language: Evaluate aesthetic consistency, overall visual hierarchy, spacing, and modern UI patterns across the entire screen.
5. Dependability: Evaluate predictable interaction patterns, layout stability, and how the entire design builds user trust.

IMPORTANT: You MUST use the submit_comparison tool properly. Do NOT stringify the metrics array. Output a real JSON array of 5 objects, and output the scores as real integers.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Image 1: Screen A',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: originalImg.mediaType,
                data: originalImg.data,
              },
            },
            {
              type: 'text',
              text: 'Image 2: Screen B',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: userImg.mediaType,
                data: userImg.data,
              },
            },
            {
              type: 'text',
              text: 'Please compare the two UI screens and provide the structured analysis.',
            }
          ],
        },
      ],
      tools: [
        {
          name: "submit_comparison",
          description: "Submit the structured UI comparison result",
          input_schema: {
            type: "object",
            properties: {
              accessibility: {
                type: "object",
                properties: { originalText: { type: "string" }, userText: { type: "string" } },
                required: ["originalText", "userText"]
              },
              usability: {
                type: "object",
                properties: { originalText: { type: "string" }, userText: { type: "string" } },
                required: ["originalText", "userText"]
              },
              contentLanguage: {
                type: "object",
                properties: { originalText: { type: "string" }, userText: { type: "string" } },
                required: ["originalText", "userText"]
              },
              visualLanguage: {
                type: "object",
                properties: { originalText: { type: "string" }, userText: { type: "string" } },
                required: ["originalText", "userText"]
              },
              dependability: {
                type: "object",
                properties: { originalText: { type: "string" }, userText: { type: "string" } },
                required: ["originalText", "userText"]
              },
              originalScore: { type: "integer", description: "Score out of 10" },
              userScore: { type: "integer", description: "Score out of 10" },
              verdict: { type: "string" }
            },
            required: ["accessibility", "usability", "contentLanguage", "visualLanguage", "dependability", "originalScore", "userScore", "verdict"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_comparison" }
    });

    const toolCall = message.content.find((block) => block.type === 'tool_use');
    
    if (toolCall && toolCall.type === 'tool_use') {
      let input = toolCall.input as any;
      
      if (message.stop_reason === "max_tokens") {
        console.warn("WARNING: Claude reached max_tokens. Output might be truncated.");
      }

      console.log("Raw Tool Call Input:", JSON.stringify(input, null, 2));

      // Reconstruct the flat schema back into the array shape expected by CompareMode.tsx
      const finalResponse = {
        metrics: [
          { name: "Accessibility", ...input.accessibility },
          { name: "Usability", ...input.usability },
          { name: "Content Language", ...input.contentLanguage },
          { name: "Visual Language", ...input.visualLanguage },
          { name: "Dependability", ...input.dependability }
        ],
        originalScore: input.originalScore,
        userScore: input.userScore,
        verdict: input.verdict
      };
      
      res.json(finalResponse);
    } else {
      throw new Error("Model did not return the expected tool call");
    }
  } catch (error: any) {
    console.error('AI Compare Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while generating comparison' });
  }
});

import { prisma } from '../db/prisma';

router.post('/generate-screen-data', async (req, res) => {
  try {
    const { imageBase64, appId } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    const extractImageDetails = (base64Str: string) => {
      const match = base64Str.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/);
      if (match) {
        let mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        if (mediaType === 'image/jpg' as any) mediaType = 'image/jpeg';
        return {
          mediaType,
          data: base64Str.replace(match[0], '')
        };
      }
      return { mediaType: 'image/jpeg' as const, data: base64Str };
    };

    const img = extractImageDetails(imageBase64);

    // Fetch available UI Elements and UX Patterns from the database (tags only)
    const [uiElements, patterns] = await Promise.all([
      prisma.uiElement.findMany({ select: { id: true, title: true } }),
      prisma.pattern.findMany({ select: { id: true, title: true } })
    ]);

    const uiElementsList = uiElements.map(e => `- ${e.title} (ID: ${e.id})`).join('\n');
    const patternsList = patterns.map(p => `- ${p.title} (ID: ${p.id})`).join('\n');

    // Optionally fetch associated app context
    let appContext = '';
    if (appId) {
      const app = await prisma.app.findUnique({
        where: { id: appId },
        select: {
          name: true,
          description: true,
          targetAudience: true,
          market: true,
          lookAndFeelTags: true,
          easeOfUseTags: true
        }
      });
      if (app) {
        appContext = `
APP CONTEXT (Use this to deeply contextualize your analysis):
- App Name: ${app.name}
- Description: ${app.description || 'N/A'}
- Target Audience: ${app.targetAudience || 'N/A'}
- Market: ${app.market?.join(', ') || 'N/A'}
- Look & Feel: ${app.lookAndFeelTags?.join(', ') || 'N/A'}
- Ease of Use: ${app.easeOfUseTags?.join(', ') || 'N/A'}
`;
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
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
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: img.mediaType,
                data: img.data,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this UI screen and generate the structured screen data, including assigning relevant uiElementIds and patternIds.',
            }
          ],
        },
      ],
      tools: [
        {
          name: "submit_screen_data",
          description: "Submit the structured screen metadata and UX analysis",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "A concise, descriptive name for this screen (e.g., 'Onboarding Step 2: Permissions', 'Crypto Portfolio Dashboard')" },
              uxAnalysis: { type: "string", description: "Deep analysis of the overall user experience and layout. Format as HTML." },
              tonalityAndContent: { type: "string", description: "Analysis of the copywriting, tone of voice, and messaging strategy. Format as HTML." },
              keyHighlights: { type: "string", description: "The most brilliant or noteworthy UX/UI decisions on this screen. Format as HTML." },
              evidenceWhoWhy: { type: "string", description: "Analysis of the target demographic this screen serves and the psychological triggers it relies on. Format as HTML." },
              whereToUse: { type: "string", description: "Recommendations on when a designer should steal or adapt this pattern. Format as HTML." },
              whereNotToUse: { type: "string", description: "Warnings on when this pattern would fail or be inappropriate. Format as HTML." },
              uiElementIds: { 
                type: "array", 
                items: { type: "string" }, 
                description: "Array of UI Element IDs present on this screen, selected ONLY from the provided list." 
              },
              patternIds: { 
                type: "array", 
                items: { type: "string" }, 
                description: "Array of UX Pattern IDs present on this screen, selected ONLY from the provided list." 
              }
            },
            required: ["name", "uxAnalysis", "tonalityAndContent", "keyHighlights", "evidenceWhoWhy", "whereToUse", "whereNotToUse", "uiElementIds", "patternIds"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_screen_data" }
    });

    const toolCall = message.content.find((block) => block.type === 'tool_use');
    
    if (toolCall && toolCall.type === 'tool_use') {
      let input = toolCall.input as any;
      res.json(input);
    } else {
      throw new Error("Model did not return the expected tool call");
    }
  } catch (error: any) {
    console.error('AI Generate Screen Data Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while generating screen data' });
  }
});

router.post('/detect-context', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });

    const extractImageDetails = (base64Str: string) => {
      const match = base64Str.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/);
      if (match) {
        let mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        if (mediaType === 'image/jpg' as any) mediaType = 'image/jpeg';
        return { mediaType, data: base64Str.replace(match[0], '') };
      }
      return { mediaType: 'image/jpeg' as const, data: base64Str };
    };

    const img = extractImageDetails(imageBase64);

    const [categories, flows] = await Promise.all([
      prisma.category.findMany({ select: { id: true, title: true } }),
      prisma.flow.findMany({ select: { id: true, name: true } })
    ]);

    const categoriesList = categories.map(c => `- ${c.title} (ID: ${c.id})`).join('\n');
    const flowsList = flows.map(f => `- ${f.name} (ID: ${f.id})`).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: `You are an elite AI UX analyzer. Analyze the provided screenshot of a mobile/web application screen.
Your job is to categorize this screen into ONE Category and ONE Flow from our database, and also provide a generic name for the Screen Type (e.g., "Account Switcher", "Login", "Dashboard").

AVAILABLE CATEGORIES:
${categoriesList}

AVAILABLE FLOWS:
${flowsList}

IMPORTANT: You MUST use the submit_detected_context tool to output the JSON response. Do not guess IDs that don't exist in the list. Pick the closest matching ones. If absolutely none match, just pick the closest approximation.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: img.mediaType, data: img.data }
            },
            {
              type: 'text',
              text: 'Please analyze this UI screen and submit the detected context using the tool.'
            }
          ]
        }
      ],
      tools: [
        {
          name: "submit_detected_context",
          description: "Submit the detected category, flow, and screen type",
          input_schema: {
            type: "object",
            properties: {
              categoryId: { type: "string", description: "The ID of the best matching category from the available list." },
              flowId: { type: "string", description: "The ID of the best matching flow from the available list." },
              screenType: { type: "string", description: "A generic, descriptive name for the type of screen (e.g., 'Login', 'Account Creation', 'Settings Dashboard')." }
            },
            required: ["categoryId", "flowId", "screenType"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_detected_context" }
    });

    const toolCall = message.content.find((block) => block.type === 'tool_use');
    if (toolCall && toolCall.type === 'tool_use') {
      res.json(toolCall.input);
    } else {
      throw new Error("Model did not return the expected tool call");
    }
  } catch (error: any) {
    console.error('AI Detect Context Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while detecting context' });
  }
});

router.post('/benchmark', async (req, res) => {
  try {
    const { imageBase64, categoryId, subcategoryId, flowId, screenType } = req.body;
    if (!imageBase64 || !categoryId || !subcategoryId || !flowId) {
      return res.status(400).json({ error: 'Missing imageBase64, categoryId, subcategoryId, or flowId' });
    }

    const extractImageDetails = (base64Str: string) => {
      const match = base64Str.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/);
      if (match) {
        let mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        if (mediaType === 'image/jpg' as any) mediaType = 'image/jpeg';
        return { mediaType, data: base64Str.replace(match[0], '') };
      }
      return { mediaType: 'image/jpeg' as const, data: base64Str };
    };

    const userImg = extractImageDetails(imageBase64);

    // AI Step 1: Fetch apps in the category/subcategory and ask AI to pick the most similar ones
    const availableApps = await prisma.app.findMany({
      where: { categoryId, subcategoryId },
      select: { id: true, name: true, description: true, tags: true }
    });

    if (availableApps.length === 0) {
      return res.status(400).json({ error: 'No apps found in this category and subcategory.' });
    }

    const appSelectionPrompt = `You are an expert UX researcher. The user has uploaded a UI screen.
Here is a list of available apps in this specific category:
${JSON.stringify(availableApps, null, 2)}

Your task is to analyze the uploaded screen to determine what type of app it is. Then, based on the descriptions and tags of the available apps, pick up to 5 apps that are the MOST structurally and functionally similar to the uploaded screen.
Output your selection as a JSON array of app IDs using the tool.`;

    const appSelectionMessage = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: "You are a helpful AI that selects the most relevant apps.",
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: userImg.mediaType, data: userImg.data } },
            { type: 'text', text: appSelectionPrompt }
          ]
        }
      ],
      tools: [
        {
          name: "select_apps",
          description: "Select the most relevant app IDs",
          input_schema: {
            type: "object",
            properties: {
              selectedAppIds: {
                type: "array",
                items: { type: "string" },
                description: "List of selected app IDs (max 5)"
              }
            },
            required: ["selectedAppIds"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "select_apps" }
    });

    const appSelectToolCall = appSelectionMessage.content.find((block) => block.type === 'tool_use');
    let selectedAppIds: string[] = [];
    if (appSelectToolCall && appSelectToolCall.type === 'tool_use') {
      selectedAppIds = (appSelectToolCall.input as any).selectedAppIds || [];
    }

    if (selectedAppIds.length === 0) {
      selectedAppIds = availableApps.slice(0, 5).map(a => a.id);
    }

    // Step 2: Fetch all screens for those specific apps and the chosen flow
    const candidateScreens = await prisma.screen.findMany({
      where: {
        appId: { in: selectedAppIds },
        flowId: flowId
      },
      include: { app: { select: { name: true } } }
    });

    if (candidateScreens.length === 0) {
      return res.status(400).json({ error: 'No screens found for this flow in similar apps.' });
    }

    const screenMetadata = candidateScreens.map(s => ({
      id: s.id,
      appName: s.app?.name || 'Unknown',
      screenName: s.name,
      description: s.uxAnalysis ? s.uxAnalysis.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : ''
    }));

    const screenSelectionPrompt = `You are an expert UX researcher. The user has uploaded a screen of type: "${screenType || 'Unknown'}".
Here is a list of candidate screens available from the selected competitor apps:
${JSON.stringify(screenMetadata, null, 2)}

Your task is to select exactly ONE screen per unique app (appName) that is most functionally and visually similar to the uploaded screen (i.e. pick the "real" main screen, and avoid meaningless sub-menus or loading states).
Output your selection as a JSON array of screen IDs using the tool.`;

    const screenSelectionMessage = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: "You are a helpful AI that selects the most relevant screens.",
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: userImg.mediaType, data: userImg.data } },
            { type: 'text', text: screenSelectionPrompt }
          ]
        }
      ],
      tools: [
        {
          name: "select_screens",
          description: "Select the most relevant screen IDs",
          input_schema: {
            type: "object",
            properties: {
              selectedIds: {
                type: "array",
                items: { type: "string" },
                description: "List of selected screen IDs (exactly 1 per app)"
              }
            },
            required: ["selectedIds"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "select_screens" }
    });

    const selectToolCall = screenSelectionMessage.content.find((block) => block.type === 'tool_use');
    let finalScreenIds: string[] = [];
    if (selectToolCall && selectToolCall.type === 'tool_use') {
      finalScreenIds = (selectToolCall.input as any).selectedIds || [];
    }

    if (finalScreenIds.length === 0) {
      // Fallback: pick the first screen for each app manually
      const uniqueApps = new Set();
      for (const s of candidateScreens) {
        if (!uniqueApps.has(s.app?.name)) {
          uniqueApps.add(s.app?.name);
          finalScreenIds.push(s.id);
        }
      }
    }

    const benchmarkScreens = candidateScreens.filter(s => finalScreenIds.includes(s.id));
    
    const fetchImageBase64 = async (url: string) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return { data: buffer.toString('base64'), mediaType: mimeType };
      } catch (err) {
        console.error(`Failed to fetch image ${url}:`, err);
        return null;
      }
    };
    
    const benchmarkImages = await Promise.all(benchmarkScreens.map(async (screen) => {
      const img = await fetchImageBase64(screen.imageUrl);
      return { ...screen, img };
    }));
    
    const validBenchmarkImages = benchmarkImages.filter((s): s is typeof s & { img: NonNullable<typeof s.img> } => !!s.img);
    
    const imageContents = validBenchmarkImages.map((s, index) => [
      { type: 'text' as const, text: `Competitor Benchmark Image ${index + 2}: ${s.app?.name || 'Competitor App'} - ${s.name}` },
      { type: 'image' as const, source: { type: 'base64' as const, media_type: s.img.mediaType as any, data: s.img.data } }
    ]).flat();
    
    const systemPrompt = `You are a Principal UX Researcher analyzing a user's design against top market competitors in the ${screenType || 'given'} screen context.
  You will be provided with:
  1. The User's Design (Image 1)
  2. Up to 5 competitor benchmark designs (Images 2-6)
  
  Your goal is to conduct a highly structured UX audit by outputting the specific requested JSON structure using the tool.
  Keep all text fields concise, actionable, and focused purely on UX/UI design heuristics. Do not write generic fluff.
   CRITICAL INSTRUCTION FOR EVIDENCE & CONFIDENCE:
  When providing 'evidence', you MUST count the exact number of benchmark screens that exhibit this pattern (e.g. '4/5 benchmark apps use a floating action button'). Do NOT invent numbers outside the provided benchmarks.
  When calculating 'confidence', base it mathematically on the consistency across the provided benchmark screens. For example:
  - High — [Percentage]% (80-100% adherence among benchmarks + strong UX principle)
  - Medium — [Percentage]% (50-80% adherence)
  - Low — [Percentage]% (Under 50% adherence or conflicting patterns)
  
  CRITICAL INSTRUCTION FOR METRICS:
  The four metrics for commonPatterns are out of 10. For each metric, you MUST provide the integer score AND a 'reasoning' string explaining exactly why you gave that score.
  
  CRITICAL INSTRUCTION FOR OPPORTUNITIES AND PATTERNS:
  You MUST fully populate the 'opportunities' array with at least 3 detailed, actionable items. Do NOT return an empty array.
  You MUST fully populate the 'commonPatterns' array with at least 3 patterns.`;
 
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Image 1: User Design' },
            { type: 'image', source: { type: 'base64', media_type: userImg.mediaType, data: userImg.data } },
            ...imageContents,
            { type: 'text', text: 'Please generate the UX benchmark report JSON via the tool.' }
          ]
        }
      ],
      tools: [
        {
          name: "submit_benchmark_report",
          description: "Submit the structured benchmark UX report",
          input_schema: {
            type: "object",
            properties: {
              overallAlignment: { type: "string" },
              snapshot: {
                type: "object",
                properties: {
                  strongConventions: { type: "array", items: { type: "string" } },
                  notableDifferences: { type: "array", items: { type: "string" } },
                  keyOpportunities: { type: "array", items: { type: "string" } }
                },
                required: ["strongConventions", "notableDifferences", "keyOpportunities"]
              },
              commonPatterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    evidence: { type: "string", description: "e.g. 4/5 relevant products use red. Calculate exactly." },
                    confidence: { type: "string", description: "e.g. High — 80%" },
                    whyItMatters: { type: "string", description: "Why this pattern works." },
                    exceptions: { type: "string", description: "When this pattern breaks or is not used." },
                    benchmarkExamples: { type: "array", items: { type: "string" }, description: "List of app names from the benchmarks that use this." },
                    metrics: {
                      type: "object",
                      properties: {
                        marketStandardParity: { type: "object", properties: { score: { type: "integer" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
                        provenPatternAdherence: { type: "object", properties: { score: { type: "integer" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
                        informationDensityMatch: { type: "object", properties: { score: { type: "integer" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] },
                        competitiveEdge: { type: "object", properties: { score: { type: "integer" }, reasoning: { type: "string" } }, required: ["score", "reasoning"] }
                      },
                      required: ["marketStandardParity", "provenPatternAdherence", "informationDensityMatch", "competitiveEdge"]
                    }
                  },
                  required: ["title", "evidence", "confidence", "whyItMatters", "exceptions", "benchmarkExamples", "metrics"]
                }
              },
              designDifferences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    yourDesign: { type: "string" },
                    benchmark: { type: "string" },
                    difference: { type: "string" },
                    potentialImpact: { type: "string" }
                  },
                  required: ["title", "yourDesign", "benchmark", "difference", "potentialImpact"]
                }
              },
              opportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    observation: { type: "string" },
                    recommendation: { type: "string" },
                    evidence: { type: "string", description: "e.g. 4/5 relevant products use red. Calculate exactly." },
                    confidence: { type: "string", description: "e.g. High — 80%" },
                    exceptions: { type: "string", description: "When this pattern breaks or is not used." },
                    benchmarkExamples: { type: "array", items: { type: "string" }, description: "List of app names from the benchmarks that use this." }
                  },
                  required: ["title", "observation", "recommendation", "evidence", "confidence", "exceptions", "benchmarkExamples"]
                }
              }
            },
            required: ["overallAlignment", "snapshot", "commonPatterns", "designDifferences", "opportunities"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_benchmark_report" }
    }, {
      headers: { 'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15' }
    });
    
    const toolCall = message.content.find((block) => block.type === 'tool_use');
    
    if (message.stop_reason === "max_tokens") {
      console.warn("WARNING: Claude reached max_tokens. Output might be truncated.");
    }

    if (toolCall && toolCall.type === 'tool_use') {
      res.json({
        report: toolCall.input,
        benchmarkScreens: validBenchmarkImages.map(s => ({
          id: s.id,
          name: s.name,
          app: s.app,
          imageUrl: s.imageUrl,
          uxAnalysis: s.uxAnalysis,
          keyHighlights: s.keyHighlights,
          tonalityAndContent: s.tonalityAndContent
        }))
      });
    } else {
      throw new Error("Model did not return the expected tool call");
    }
  } catch (error: any) {
    console.error('AI Benchmark Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while generating benchmark' });
  }
});

router.post('/benchmark-chat', async (req, res) => {
  try {
    const { message, chatHistory, benchmarkData } = req.body;

    if (!message || !benchmarkData) {
      return res.status(400).json({ error: 'Missing message or benchmarkData' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    let messages = (chatHistory || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Anthropic requires the first message to be from a user
    while (messages.length > 0 && messages[0].role === 'assistant') {
      messages.shift();
    }

    messages.push({
      role: 'user',
      content: message
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are an expert UX/UI designer and AI assistant. The user is asking a follow-up question about a Benchmark UX Analysis report that was just generated for them. 

Here is the context of the generated Benchmark Report:
${JSON.stringify(benchmarkData, null, 2)}

Answer the user's question clearly, concisely, and professionally based on the provided report context. If they ask about something not in the report, use your general expert knowledge.`,
      messages: messages,
    });

    console.log('Anthropic Chat Response:', JSON.stringify(response, null, 2));

    let textContent = 'Could not generate text.';
    if (response && response.content) {
      const textBlock = response.content.find((block: any) => block.type === 'text');
      if (textBlock && 'text' in textBlock) {
        textContent = textBlock.text;
      }
    }

    res.json({
      role: 'assistant',
      content: textContent
    });
  } catch (error: any) {
    console.error('AI Benchmark Chat Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred while chatting' });
  }
});

router.post('/improve-design', async (req, res) => {
  try {
    const { imageBase64, benchmarkResult } = req.body;

    if (!imageBase64 || !benchmarkResult) {
      return res.status(400).json({ error: 'Missing imageBase64 or benchmarkResult in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    let mediaType = 'image/jpeg';
    const match = imageBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
    if (match && match[1]) {
      mediaType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
    }
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8192,
      system: `You are an expert UX/UI designer and frontend developer. Based on the attached UI screenshot and the following benchmark feedback, generate a fully functional HTML page using Tailwind CSS that implements the improved design fixing the UX issues.

CRITICAL INSTRUCTIONS:
- Return ONLY the raw HTML code. Do NOT wrap it in markdown blocks.
- Start directly with <!DOCTYPE html> and end with </html>.
- Include the Tailwind CSS CDN script: <script src="https://cdn.tailwindcss.com"></script> in the <head>.
- Use default HTML elements and inline SVGs for icons.
- Ensure the design is complete, self-contained, and looks beautiful.
- AESTHETICS ARE CRITICAL: Use modern, premium design trends (e.g. glassmorphism, subtle soft drop shadows, sleek gradients, Apple-like rounded corners, perfect padding/margins, and high-contrast readable typography). Make it look like a state-of-the-art Dribbble mockup or an iOS 18 app. Do NOT output a basic, flat, generic UI.
- VERY IMPORTANT: Be extremely concise to prevent truncation. Use placeholder text (Lorem ipsum) if it saves space. Do NOT let the output cut off.

Benchmark Feedback:
${JSON.stringify(benchmarkResult, null, 2)}
`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Please generate the improved HTML code now. Remember, output ONLY valid HTML code, no markdown blocks.',
            }
          ],
        },
      ],
    }, {
      headers: {
        "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15"
      }
    });

    const aiResponse = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    let cleanedResponse = aiResponse;
    const htmlBlockMatch = aiResponse.match(/```(?:html)?\n([\s\S]*?)```/);
    if (htmlBlockMatch) {
      cleanedResponse = htmlBlockMatch[1];
    }
    cleanedResponse = cleanedResponse.trim();

    res.json({ code: cleanedResponse });
  } catch (error: any) {
    console.error('AI Improve Design Error:', error);
    res.status(500).json({ error: error?.message || 'An error occurred during AI design improvement' });
  }
});

// GET /api/ai/design-agent/filters
// Fetches only categories and flows that have published apps and screens in the database
router.get('/design-agent/filters', async (req, res) => {
  try {
    const db = req.app.get('prisma') || prisma;

    // 1. Fetch categories that actually contain apps that have screens
    const categories = await prisma.category.findMany({
      where: {
        apps: {
          some: {
            screens: {
              some: {}
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: {
            apps: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });

    // 2. Fetch flows that have screens associated with them
    const flows = await prisma.flow.findMany({
      where: {
        screens: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            screens: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ categories, flows });
  } catch (error: any) {
    console.error('Failed to fetch design agent filters:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch categories and flows' });
  }
});

// POST /api/ai/design-agent/generate
// Generates high-fidelity, production-ready screen specs grounded in UX benchmark library & Vision
router.post('/design-agent/generate', async (req, res) => {
  try {
    const { prompt, category, flow, device = 'mobile' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
    }

    const db = req.app.get('prisma') || prisma;

    // Step 1: Query relevant UX screens from Database that actually have images
    let referenceScreen: any = null;
    let benchmarkContext = '';

    try {
      const searchWords = prompt.split(/\s+/).filter((w: string) => w.length > 2);
      
      // Attempt to find screens matching app name, flow, or keywords
      const potentialScreens = await prisma.screen.findMany({
        where: {
          imageUrl: { not: '' },
          OR: [
            ...(category ? [{ app: { category: { slug: category } } }] : []),
            ...(flow ? [{ flow: { slug: flow } }] : []),
            ...searchWords.slice(0, 4).map((word: string) => ({
              OR: [
                { app: { name: { contains: word, mode: 'insensitive' as const } } },
                { name: { contains: word, mode: 'insensitive' as const } },
                { flow: { name: { contains: word, mode: 'insensitive' as const } } }
              ]
            }))
          ]
        },
        include: {
          app: {
            select: { name: true, category: { select: { title: true } } }
          },
          flow: {
            select: { name: true }
          }
        },
        take: 3
      });

      if (potentialScreens.length > 0) {
        referenceScreen = potentialScreens[0];
        benchmarkContext = `Here are benchmark reference screens from our curated library:
${potentialScreens.map((s: any) => `- App: ${s.app?.name}, Screen: "${s.name}", Flow: "${s.flow?.name || 'General'}"`).join('\n')}`;
      }
    } catch (dbErr) {
      console.warn('Benchmark RAG fallback:', dbErr);
    }

    // Step 2: Prompt Claude to synthesize an elite screen spec adhering to modern Auto-Layout
    const systemPrompt = `You are a Principal Product Designer at Apple / Linear with world-class UX taste.
Your task is to design a state-of-the-art UI screen based on the user's prompt and our real UX library benchmark.

${benchmarkContext}

CRITICAL RULES:
1. Output MUST be valid, parseable JSON only. Do NOT wrap in markdown \`\`\`json.
2. Return an object matching this EXACT schema:
{
  "title": "Short descriptive screen title",
  "subtitle": "Clear UX rationale or purpose",
  "category": "${category || 'general'}",
  "badge": "Short badge e.g. STEP 1 or PRO",
  "flowStep": "Step indicator e.g. Step 1 of 3",
  "referenceApp": "${referenceScreen?.app?.name || ''}",
  "referenceScreen": "${referenceScreen?.name || ''}",
  "layoutType": "pricing-tiers" | "feature-list" | "card-grid",
  "elements": {
    "heroTitle": "Punchy, modern headline (max 7 words)",
    "heroSubtitle": "Clean supporting copy (max 15 words)",
    "pricingTiers": [
      {
        "id": "tier-1",
        "name": "Standard",
        "price": "Free",
        "period": "",
        "highlight": false,
        "features": ["Feature 1", "Feature 2"]
      },
      {
        "id": "tier-2",
        "name": "Metal",
        "price": "$14.99",
        "period": "/mo",
        "badge": "MOST POPULAR",
        "highlight": true,
        "features": ["18g Metal card", "Unlimited free withdrawals", "5% Vault interest"]
      }
    ],
    "features": [
      { "title": "Feature title", "desc": "Brief 1-line description", "icon": "layers", "tag": "optional tag" },
      { "title": "Feature title", "desc": "Brief 1-line description", "icon": "star", "tag": "optional tag" },
      { "title": "Feature title", "desc": "Brief 1-line description", "icon": "wand", "tag": "optional tag" }
    ],
    "primaryCTA": "Actionable button label",
    "secondaryCTA": "Optional secondary action",
    "disclaimer": "Optional subtext disclaimer"
  },
  "styleTokens": {
    "theme": "dark",
    "accentColor": "#6366F1",
    "bgGradient": "from-[#0F0F14] via-[#09090C] to-[#040406]",
    "cardBg": "bg-white/[0.04] border-white/[0.08]",
    "roundness": "rounded-2xl"
  }
}

3. HIGH TASTE REQUIREMENT:
- If the user prompt asks for tiers / plans / pricing comparison (e.g. Standard vs Metal), set "layoutType": "pricing-tiers" and populate "pricingTiers" with clear contrasting plans!
- Clean copy, zero boilerplate jargon.
- Accent colors must be curated hex values (#6366F1, #0075FF, #10B981, #EC4899, #8B5CF6).`;

    // Multimodal Vision: If we have an image URL from our library, send it to Claude!
    const userContent: any[] = [];
    
    if (referenceScreen?.imageUrl && (referenceScreen.imageUrl.startsWith('http://') || referenceScreen.imageUrl.startsWith('https://'))) {
      userContent.push({
        type: 'image',
        source: {
          type: 'url',
          url: referenceScreen.imageUrl
        }
      });
      userContent.push({
        type: 'text',
        text: `Inspect the visual hierarchy, component layout, and spacing from this benchmark screen (${referenceScreen.app?.name} - ${referenceScreen.name}). Ground your design in its layout mechanics. User Prompt: "${prompt}" for device: ${device}.`
      });
    } else {
      userContent.push({
        type: 'text',
        text: `Generate a screen spec for device: ${device}. User Prompt: "${prompt}"`
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent
        }
      ]
    });

    const aiText = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    let cleanJson = aiText.trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const screenData = JSON.parse(cleanJson);
    res.json({ 
      screen: screenData,
      referenceScreen: referenceScreen ? {
        id: referenceScreen.id,
        appName: referenceScreen.app?.name,
        screenName: referenceScreen.name,
        imageUrl: referenceScreen.imageUrl
      } : null
    });
  } catch (error: any) {
    console.error('Design Agent Generator Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate design screen' });
  }
});


/**
 * POST /api/ai/workspace-chat
 * Real-time AI research chat using Claude Sonnet with UX database context
 */
router.post('/workspace-chat', async (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prompt in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    const db = req.app.get('prisma') || prisma;

    // Fast selective query: Get apps and flows without heavy full-table scanning
    let appsContextList: any[] = [];
    try {
      const allApps = await db.app.findMany({
        select: {
          name: true,
          slug: true,
          appFlows: {
            select: {
              flow: {
                select: {
                  name: true,
                  slug: true,
                }
              }
            },
            take: 10,
          }
        },
        take: 30,
      });

      appsContextList = allApps.map((a: any) => ({
        name: a.name,
        slug: a.slug,
        availableFlows: (a.appFlows || []).map((af: any) => af.flow?.name).filter(Boolean)
      }));
    } catch (dbErr) {
      console.warn('Non-blocking: could not fetch full apps list, continuing with AI generation:', dbErr);
    }

    const systemPrompt = `You are Zibo AI, a world-class Staff Product Designer and interactive canvas AI researcher (like ChatGPT Canvas, Perplexity Pro, and Mobbin AI).
The user is working in an interactive design workspace. Instead of returning a plain wall of text or rigid hardcoded layouts, you dynamically structure your response into an expressive, modular Generative UI (GenUI) array of sections.

Available apps in the UX library:
${JSON.stringify(appsContextList)}

You have the following modular UI components available in your palette:
1. "text": Markdown formatted analysis, explanations, and breakdowns. Use standard markdown formatting (**bold**, lists, etc.).
2. "comparison_table": A structured matrix table comparing UX dimensions, patterns, or heuristics across apps (columns: headers, rows: 2D array of string cells).
3. "timeline": A step-by-step user journey or onboarding flow for an app (with step numbers, titles, badges, and descriptions).
4. "insight_card": High-impact takeaway bullet points or psychological heuristics.
5. "interactive_flow": A full multi-screen app flow (e.g., "Purchasing & Ordering", "Onboarding", "Transfer Money") featuring sequential screen cards and an "interactive flow" inspector button.

DO NOT use "screen_gallery" anymore; always use "interactive_flow" for showing screens.

Respond in valid JSON ONLY with the following schema:
{
  "introText": "A warm, high-level 1-2 sentence executive summary of your findings.",
  "sections": [
    {
      "type": "text",
      "content": "### Detailed Breakdown\\nHere is why this flow works..."
    },
    {
      "type": "interactive_flow",
      "flowName": "Purchasing & Ordering",
      "appName": "Apple Wallet",
      "appSlug": "apple-wallet",
      "description": "Screens for the Purchasing & Ordering flow. Use the interactive flow button to inspect.",
      "screens": [
        { "name": "Card Balance", "uxAnalysis": "Biometric trigger with instant tactile feedback." },
        { "name": "Double-Click to Pay", "uxAnalysis": "Physical button confirmation reducing accidental spend." },
        { "name": "Done / Success", "uxAnalysis": "Haptic chime and checkmark confirming transaction." }
      ]
    },
    {
      "type": "timeline",
      "appName": "Duolingo",
      "steps": [
        {
          "number": 1,
          "title": "Language Selection",
          "badge": "Low friction",
          "description": "Users immediately pick a target language before any registration wall."
        },
        {
          "number": 2,
          "title": "Motivation Framing",
          "badge": "Goal-gradient priming",
          "description": "Asks why you are learning to personalize the journey."
        }
      ]
    },
    {
      "type": "comparison_table",
      "title": "UX Comparison Matrix",
      "headers": ["UX Dimension", "Duolingo", "Cleo"],
      "rows": [
        ["Onboarding Tone", "Gamified, playful & cartoonish", "Witty, conversational AI chat"],
        ["Time to Value", "Instant lesson in < 30 seconds", "Fast chat rapport before bank link"],
        ["Conversion Gate", "Delayed until after 1st lesson completed", "Delayed until value & trust established"]
      ]
    },
    {
      "type": "insight_card",
      "title": "Key UX Takeaways",
      "points": [
        "Delayed registration (soft wall) boosts activation by over 20% compared to upfront auth.",
        "Micro-commitments create cognitive momentum through consistency bias before asking for sensitive bank credentials."
      ]
    }
  ],
  "recommendedApps": [
    {
      "name": "Duolingo",
      "slug": "duolingo",
      "category": "Gamified Education",
      "reason": "Masterclass in gamified commitment escalation"
    }
  ],
  "suggestedFollowUps": [
    "What onboarding patterns work best for financial trust-building?",
    "How does progressive disclosure differ between gamified apps and fintech apps?"
  ]
}

CRITICAL RULES:
1. FOCUS ON THE CURRENT USER PROMPT: 
   - Answer ONLY the user's latest request! Do NOT blend, drag, or copy topics from previous questions unless the user explicitly refers back to them (e.g. "compare those two" or "tell me more about that").
   - If the user switches topics (e.g. from "Venmo retention" to "dashboard design for my finance app"), do NOT re-hash the old topic. Focus 100% on the new subject!
2. FLOW MATCHING & IDENTIFICATION: When generating "interactive_flow", you MUST match the flow directly to the current question!
   - Inspect the app's 'availableFlows' in the context list above and select the exact real flow name that answers the user's prompt (e.g., if the user asks for dashboard inspiration, pick "Dashboard", "Home", or "Account Overview"; do NOT return social feed or onboarding unless asked).
   - Use the exact flowName from 'availableFlows' whenever possible so the database can fetch the real verified screens!
3. PREFER "interactive_flow": When comparing flows, app features, or step-by-step journeys, use "interactive_flow" for each app.
4. Always compose a rich, multi-component visual answer! Combine "text", "interactive_flow", "comparison_table", and "insight_card". Never use "screen_gallery".
5. Keep markdown text concise and readable.
6. Output RAW JSON ONLY without markdown backticks or explanations.`;

    const formattedMessages: any[] = [];

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.role && msg.content) {
          formattedMessages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
          });
        }
      }
    }

    formattedMessages.push({
      role: 'user',
      content: prompt.trim()
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: formattedMessages,
    });

    const aiText = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    let parsedResult: any = null;

    // 1. Try direct JSON parse
    try {
      parsedResult = JSON.parse(aiText.trim());
    } catch (_) {}

    // 2. Try regex extraction of JSON block
    if (!parsedResult) {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (_) {
          // If truncated at the end due to token limit, try to salvage sections array or introText
          try {
            // Attempt auto-closing incomplete JSON structure
            let unclosed = jsonMatch[0];
            const openBrackets = (unclosed.match(/\[/g) || []).length;
            const closeBrackets = (unclosed.match(/\]/g) || []).length;
            const openBraces = (unclosed.match(/\{/g) || []).length;
            const closeBraces = (unclosed.match(/\}/g) || []).length;
            
            for (let i = 0; i < openBrackets - closeBrackets; i++) unclosed += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) unclosed += '}';
            
            parsedResult = JSON.parse(unclosed);
          } catch (_) {}

          if (!parsedResult) {
            const introMatch = jsonMatch[0].match(/"introText"\s*:\s*"((?:[^"\\]|\\.)*)/);
            if (introMatch && introMatch[1]) {
              try {
                const sanitized = JSON.parse(`"${introMatch[1]}"`);
                parsedResult = {
                  introText: sanitized,
                  sections: [],
                  recommendedApps: [],
                  uxInsights: "",
                  suggestedFollowUps: []
                };
              } catch (e) {
                parsedResult = {
                  introText: introMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                  sections: [],
                  recommendedApps: [],
                  uxInsights: "",
                  suggestedFollowUps: []
                };
              }
            }
          }
        }
      }
    }

    if (!parsedResult) {
      parsedResult = {
        introText: aiText.replace(/^\{[\s\S]*?"introText"\s*:\s*"/, '').replace(/"[\s\S]*$/, '').replace(/\\n/g, '\n'),
        recommendedApps: [],
        uxInsights: "",
        suggestedFollowUps: []
      };
    }

    const allSlugsOrNames = new Set<string>();
    (parsedResult.recommendedApps || []).forEach((a: any) => {
      if (a.slug) allSlugsOrNames.add(a.slug);
      if (a.name) allSlugsOrNames.add(a.name);
    });
    (parsedResult.comparisonFlows || []).forEach((f: any) => {
      if (f.slug) allSlugsOrNames.add(f.slug);
      if (f.appName) allSlugsOrNames.add(f.appName);
    });
    (parsedResult.sections || []).forEach((s: any) => {
      if (s.appName) allSlugsOrNames.add(s.appName);
      if (s.screens && Array.isArray(s.screens)) {
        s.screens.forEach((sc: any) => {
          if (sc.appName) allSlugsOrNames.add(sc.appName);
          if (sc.appSlug) allSlugsOrNames.add(sc.appSlug);
        });
      }
      if (s.headers && Array.isArray(s.headers)) {
        s.headers.slice(1).forEach((h: string) => allSlugsOrNames.add(h));
      }
    });

    const queryList = Array.from(allSlugsOrNames);
    const matchedDbApps = await db.app.findMany({
      where: {
        OR: [
          { slug: { in: queryList } },
          { name: { in: queryList } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        appLogo: true,
        appThumbnail: true,
        category: { select: { title: true } },
        subcategory: { select: { title: true } },
        screens: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            screenNo: true,
            uxAnalysis: true,
            flow: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          },
          orderBy: { screenNo: 'asc' }
        }
      }
    });

    // Helper to find app by name or slug
    const findDbApp = (nameOrSlug?: string) => {
      if (!nameOrSlug) return null;
      const lower = nameOrSlug.toLowerCase();
      return matchedDbApps.find(
        (m: any) => m.slug.toLowerCase() === lower || m.name.toLowerCase() === lower
      ) || null;
    };

    // Enrich dynamic sections (e.g. screen_gallery and interactive_flow with real imageUrls from DB)
    const enrichedSections = (parsedResult.sections || []).map((sec: any) => {
      if (sec.type === 'screen_gallery' && Array.isArray(sec.screens)) {
        const enrichedScreens = sec.screens.map((sc: any, scIdx: number) => {
          const dbApp = findDbApp(sc.appName || sc.appSlug);
          const dbScreens = dbApp?.screens || [];
          const matchedScreen = dbScreens[scIdx] || dbScreens[0];
          return {
            ...sc,
            id: matchedScreen?.id || `scr-${scIdx}`,
            imageUrl: matchedScreen?.imageUrl || sc.imageUrl || dbApp?.appThumbnail || null,
            appSlug: dbApp?.slug || sc.appSlug || sc.appName?.toLowerCase().replace(/\s+/g, '-'),
            appName: dbApp?.name || sc.appName,
          };
        });
        return { ...sec, screens: enrichedScreens.filter((s: any) => !!s.imageUrl) };
      }

      if (sec.type === 'interactive_flow') {
        const dbApp = findDbApp(sec.appName || sec.appSlug);
        const allAppScreens = dbApp?.screens || [];

        // Determine requested flow name keywords (e.g. "feed", "social", "onboarding", "investing", etc.)
        const flowKeyword = (sec.flowName || '').toLowerCase().trim();

        // 1. Try matching by exact or partial flow name / slug in database
        let flowScreens: any[] = [];
        if (flowKeyword) {
          flowScreens = allAppScreens.filter((s: any) => {
            const sFlowName = (s.flow?.name || '').toLowerCase();
            const sFlowSlug = (s.flow?.slug || '').toLowerCase();
            const sName = (s.name || '').toLowerCase();

            // Direct substring match with flow name or screen name
            if (sFlowName && (sFlowName.includes(flowKeyword) || flowKeyword.includes(sFlowName))) return true;
            if (sFlowSlug && (sFlowSlug.includes(flowKeyword) || flowKeyword.includes(sFlowSlug))) return true;

            // Keyword semantic aliases
            if (flowKeyword.includes('onboard') || flowKeyword.includes('sign')) {
              return sFlowName.includes('onboard') || sFlowSlug.includes('onboard') || sName.includes('onboard') ||
                     sFlowName.includes('creating account') || sFlowSlug.includes('creating-account');
            }
            if (flowKeyword.includes('feed') || flowKeyword.includes('social') || flowKeyword.includes('activity')) {
              return sFlowName.includes('feed') || sFlowSlug.includes('feed') || sFlowName.includes('home') ||
                     sFlowName.includes('activity') || sName.includes('feed') || sName.includes('social');
            }
            if (flowKeyword.includes('pay') || flowKeyword.includes('transfer') || flowKeyword.includes('send')) {
              return sFlowName.includes('pay') || sFlowName.includes('transfer') || sFlowName.includes('send') ||
                     sFlowSlug.includes('transfer') || sFlowSlug.includes('payment');
            }
            return false;
          });
        }

        // 2. If no flow-specific match found, check if screens have names matching the keyword
        if (flowScreens.length === 0 && flowKeyword) {
          flowScreens = allAppScreens.filter((s: any) => {
            const sName = (s.name || '').toLowerCase();
            return flowKeyword.split(/\s+/).some((kw: string) => kw.length > 3 && sName.includes(kw));
          });
        }

        // 3. Fallback to first N screens if still nothing matched
        if (flowScreens.length === 0) {
          flowScreens = allAppScreens.slice(0, (sec.screens && sec.screens.length > 0) ? sec.screens.length : 5);
        }

        // Sort accurately by screenNo so the user journey flow is in true sequential order
        flowScreens.sort((a: any, b: any) => (a.screenNo || 0) - (b.screenNo || 0));

        const enrichedScreens = flowScreens.slice(0, 10).map((screen: any, idx: number) => {
          const aiScreenDesc = sec.screens && sec.screens[idx];
          return {
            id: screen.id,
            imageUrl: screen.imageUrl,
            name: aiScreenDesc?.name || screen.name || `Screen ${idx + 1}`,
            uxAnalysis: aiScreenDesc?.uxAnalysis || screen.uxAnalysis || "",
            screenNo: screen.screenNo || idx + 1,
            slug: screen.slug
          };
        });

        return {
          ...sec,
          appSlug: dbApp?.slug || sec.appSlug || sec.appName?.toLowerCase().replace(/\s+/g, '-'),
          screens: enrichedScreens.filter((s: any) => !!s.imageUrl)
        };
      }

      return sec;
    });

    // Enrich comparisonFlows with actual screens matching each step!
    const enrichedComparisonFlows = (parsedResult.comparisonFlows || []).map((flow: any) => {
      const dbMatch = matchedDbApps.find(
        (m: any) => 
          (flow.slug && m.slug.toLowerCase() === flow.slug.toLowerCase()) || 
          (flow.appName && m.name.toLowerCase() === flow.appName.toLowerCase())
      );

      const dbScreens = dbMatch?.screens || [];

      const enrichedSteps = (flow.steps || []).map((step: any, sIdx: number) => {
        // Try to find a matching screen by step index or name
        const screen = dbScreens[sIdx] || dbScreens[sIdx % (dbScreens.length || 1)] || null;

        return {
          ...step,
          screenImageUrl: screen?.imageUrl || null,
          screenName: screen?.name || null,
          screenId: screen?.id || null,
        };
      });

      return {
        ...flow,
        appLogo: dbMatch?.appLogo || null,
        appThumbnail: dbMatch?.appThumbnail || null,
        slug: dbMatch?.slug || flow.slug,
        appName: dbMatch?.name || flow.appName,
        steps: enrichedSteps,
        totalScreens: dbScreens.length
      };
    });

    const enrichedApps = (parsedResult.recommendedApps || []).map((rec: any) => {
      const dbMatch = matchedDbApps.find(
        (m: any) => m.slug.toLowerCase() === (rec.slug || '').toLowerCase() || m.name.toLowerCase() === rec.name.toLowerCase()
      );

      return {
        id: dbMatch?.id || rec.slug || rec.name,
        name: rec.name,
        slug: dbMatch?.slug || rec.slug,
        category: dbMatch?.subcategory?.title || dbMatch?.category?.title || rec.category || 'Finance',
        reason: rec.reason,
        appLogo: dbMatch?.appLogo || null,
        appThumbnail: dbMatch?.appThumbnail || null,
      };
    });

    return res.json({
      success: true,
      data: {
        introText: parsedResult.introText || "Here are the top recommended apps matching your request.",
        sections: enrichedSections,
        comparisonFlows: enrichedComparisonFlows,
        apps: enrichedApps,
        uxInsights: parsedResult.uxInsights || "",
        suggestedFollowUps: parsedResult.suggestedFollowUps || []
      }
    });
  } catch (error: any) {
    console.error('Workspace AI Chat Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to process AI research chat' });
  }
});

export default router;
