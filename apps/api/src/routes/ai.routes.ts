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
                media_type: 'image/jpeg', // We will force jpeg in canvas extraction
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
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in the server' });
    }

    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: "You are an elite Staff Product Designer. Analyze the provided screenshot and return exactly 4 MINDBLOWING, hidden UX/UI insights. Do NOT state the obvious (e.g., 'this is a button'). Instead, explain the deep psychological reasoning, advanced interaction design choices, conversion optimization tactics, or genius heuristic applications that a senior designer would say 'wow' to. Keep all descriptions concise (max 2-3 short sentences) so they fit perfectly in small UI cards. You MUST return your response as a valid JSON object with the following schema:\n{\n  \"insights\": [\n    {\n      \"title\": \"Insight Title (e.g. Cognitive Load Reduction)\",\n      \"description\": \"Concise explanation of the design choice and its impact (max 2-3 sentences).\",\n      \"x\": 25, // percentage x-coordinate (0-100) of the specific UI element on the screen this insight applies to\n      \"y\": 30 // percentage y-coordinate (0-100) of the specific UI element on the screen this insight applies to\n    }\n  ]\n}\nDo not wrap the JSON in markdown blocks, just return the raw JSON.",
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this UI and provide 4 key insights with exact coordinates.',
            }
          ],
        },
      ],
    });

    let aiResponse = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
      
    // Attempt to parse JSON
    try {
      // Strip markdown JSON wrapping if Claude ignored the instruction
      aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(aiResponse);
      res.json(parsedData);
    } catch (parseError) {
      console.error('Failed to parse AI insights as JSON:', aiResponse);
      res.status(500).json({ error: 'Failed to parse AI response into structured insights data.' });
    }
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
    const { imageBase64, categoryId, flowId, screenType } = req.body;
    if (!imageBase64 || !categoryId || !flowId) {
      return res.status(400).json({ error: 'Missing imageBase64, categoryId, or flowId' });
    }
    // Fetch all screens so the AI can intelligently find the best 5 matches across the entire database, 
    // rather than being strictly limited to a specific flowId which may have too few apps.
    const allScreens = await prisma.screen.findMany({
      include: { app: { select: { name: true } } }
    });

    let benchmarkScreens: typeof allScreens = [];

    if (allScreens.length > 0) {
      const screenMetadata = allScreens.map(s => ({
        id: s.id,
        appName: s.app?.name || 'Unknown',
        screenName: s.name,
        description: s.uxAnalysis ? s.uxAnalysis.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : ''
      }));

      const selectionPrompt = `You are an expert UX researcher. The user has uploaded a screen of type: "${screenType || 'Unknown'}".
Here is a list of screens available in the database for this flow:
${JSON.stringify(screenMetadata, null, 2)}

Your task is to select exactly ONE screen per unique app (appName) that is most functionally and visually similar to "${screenType || 'Unknown'}". If there are more than 5 unique apps, pick the 5 best matching screens overall (max 1 per app).
Output your selection as a JSON array of screen IDs using the tool.`;

      const selectionMessage = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: "You are a helpful AI that selects the most relevant screens.",
        messages: [{ role: 'user', content: selectionPrompt }],
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
                  description: "List of selected screen IDs (max 1 per app, max 5 total)"
                }
              },
              required: ["selectedIds"]
            }
          }
        ],
        tool_choice: { type: "tool", name: "select_screens" }
      });

      const selectToolCall = selectionMessage.content.find((block) => block.type === 'tool_use');
      let selectedIds: string[] = [];
      if (selectToolCall && selectToolCall.type === 'tool_use') {
        selectedIds = (selectToolCall.input as any).selectedIds || [];
      }
      
      // Fallback if empty or invalid IDs
      if (selectedIds.length === 0) {
        selectedIds = allScreens.slice(0, 5).map(s => s.id);
      }

      benchmarkScreens = allScreens.filter(s => selectedIds.includes(s.id));

      // Ultimate fallback: if we still have 0 screens, just grab 1 per unique app manually
      if (benchmarkScreens.length === 0 && allScreens.length > 0) {
        const uniqueApps = new Set();
        for (const s of allScreens) {
          if (!uniqueApps.has(s.app?.name)) {
            uniqueApps.add(s.app?.name);
            benchmarkScreens.push(s);
          }
          if (benchmarkScreens.length >= 5) break;
        }
      }
    }
    
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
The four metrics for commonPatterns are out of 10.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
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
                    evidence: { type: "string" },
                    whyItMatters: { type: "string" },
                    metrics: {
                      type: "object",
                      properties: {
                        marketStandardParity: { type: "integer" },
                        provenPatternAdherence: { type: "integer" },
                        informationDensityMatch: { type: "integer" },
                        competitiveEdge: { type: "integer" }
                      },
                      required: ["marketStandardParity", "provenPatternAdherence", "informationDensityMatch", "competitiveEdge"]
                    }
                  },
                  required: ["title", "evidence", "whyItMatters", "metrics"]
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
                    evidence: { type: "string" },
                    confidence: { type: "string", description: "e.g., 'High', 'Medium'" }
                  },
                  required: ["title", "observation", "recommendation", "evidence", "confidence"]
                }
              }
            },
            required: ["overallAlignment", "snapshot", "commonPatterns", "designDifferences", "opportunities"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_benchmark_report" }
    });
    
    const toolCall = message.content.find((block) => block.type === 'tool_use');
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

export default router;
