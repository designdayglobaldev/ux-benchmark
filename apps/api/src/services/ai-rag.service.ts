import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/prisma';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

function extractImageDetails(base64Str: string) {
  const match = base64Str.match(/^data:(image\/(png|jpeg|jpg|webp|gif));base64,/);
  if (match) {
    let mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    if (mediaType === ('image/jpg' as any)) mediaType = 'image/jpeg';
    return { mediaType, data: base64Str.replace(match[0], '') };
  }
  return { mediaType: 'image/jpeg' as const, data: base64Str };
}

async function fetchImageBase64(url: string) {
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
}

export interface BenchmarkRAGResult {
  report: any;
  benchmarkScreens: Array<{
    id: string;
    name: string;
    app: { name: string };
    imageUrl: string;
    uxAnalysis?: string | null;
    keyHighlights?: string | null;
    tonalityAndContent?: string | null;
    similarity: number;
  }>;
}

/**
 * Executes multimodal RAG UX benchmark analysis using Voyage AI multimodal embeddings,
 * Supabase pgvector cosine search, and Claude 3.5 Sonnet structured synthesis.
 */
export async function executeBenchmarkRAG(imageBase64: string): Promise<BenchmarkRAGResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not configured');
  }

  const userImg = extractImageDetails(imageBase64);
  const fullUserBase64 = `data:${userImg.mediaType};base64,${userImg.data}`;

  console.log('[RAG Benchmark] 1. Generating multimodal vector for uploaded screen...');

  const voyageRes = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + VOYAGE_API_KEY,
    },
    body: JSON.stringify({
      model: 'voyage-multimodal-3',
      inputs: [
        {
          content: [{ type: 'image_base64', image_base64: fullUserBase64 }],
        },
      ],
    }),
  });

  const voyageData = await voyageRes.json();
  if (!voyageRes.ok) {
    console.error('[RAG Benchmark] Voyage error:', voyageData);
    throw new Error('Failed to generate visual embedding for query screen.');
  }

  const queryVector = voyageData.data[0].embedding;

  console.log('[RAG Benchmark] 2. Querying Supabase pgvector for top matching benchmark screens...');

  const matches: any = await prisma.$queryRawUnsafe(
    `
    SELECT 
      se."screenId",
      se."metadataText",
      s."id",
      s."name",
      s."imageUrl",
      s."uxAnalysis",
      s."keyHighlights",
      s."tonalityAndContent",
      s."evidenceWhoWhy",
      s."whereToUse",
      s."whereNotToUse",
      a."id" AS "appId",
      a."name" AS "appName",
      1 - (se."embedding" <=> $1::vector) AS "similarity"
    FROM "ScreenEmbedding" se
    JOIN "Screen" s ON s."id" = se."screenId"
    JOIN "App" a ON a."id" = s."appId"
    ORDER BY se."embedding" <=> $1::vector ASC
    LIMIT 12;
  `,
    JSON.stringify(queryVector)
  );

  if (!matches || matches.length === 0) {
    throw new Error('No benchmark screens found in vector database.');
  }

  const selectedScreens: any[] = [];
  const seenApps = new Set<string>();

  for (const match of matches) {
    if (!seenApps.has(match.appName)) {
      seenApps.add(match.appName);
      selectedScreens.push(match);
    }
    if (selectedScreens.length >= 3) break;
  }

  console.log(
    `[RAG Benchmark] 3. Retrieved ${selectedScreens.length} diverse benchmark competitors:`,
    selectedScreens.map((s) => `${s.appName} - ${s.name} (${(s.similarity * 100).toFixed(1)}%)`).join(', ')
  );

  const benchmarkImages = await Promise.all(
    selectedScreens.map(async (screen) => {
      const img = await fetchImageBase64(screen.imageUrl);
      return { ...screen, img };
    })
  );

  const validBenchmarkImages = benchmarkImages.filter(
    (s): s is typeof s & { img: NonNullable<typeof s.img> } => !!s.img
  );

  const imageContents = validBenchmarkImages
    .map((s, index) => [
      {
        type: 'text' as const,
        text: `\n=== COMPETITOR BENCHMARK IMAGE ${index + 2}: ${s.appName} - ${s.name} (Similarity: ${(s.similarity * 100).toFixed(1)}%) ===\n${s.metadataText}\n`,
      },
      {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: s.img.mediaType as any, data: s.img.data },
      },
    ])
    .flat();

  const systemPrompt = `You are a Principal Product Design Critic and Growth Teardown Leader.
Conduct a structured UX benchmark audit of the user's design against the retrieved competitor benchmarks.

CRITICAL FIELD REQUIREMENTS:
1. 'snapshot':
   - 'strongConventions': array of strings (e.g. ["Prominent numerical keypad", "Clear amount display"])
   - 'notableDifferences': array of strings (e.g. ["Missing biometric / faceID prompt", "No recipient avatar"])
   - 'keyOpportunities': array of strings (e.g. ["Anchor primary CTA sticky to bottom"])
2. 'commonPatterns':
   - Each item MUST have: 'title', 'evidence' (e.g. "3/3 benchmark apps use sticky bottom CTAs"), 'confidence' (e.g. "High — 90%"), 'whyItMatters', 'exceptions', 'benchmarkExamples' (array of app names), and 'metrics' (4 metrics with integer score 1-10 and reasoning).
3. 'designDifferences':
   - Each item MUST have: 'title', 'yourDesign', 'benchmark', 'difference', 'potentialImpact'.
4. 'opportunities':
   - Each item MUST have: 'title', 'observation', 'recommendation', 'evidence', 'confidence', 'exceptions', 'benchmarkExamples'.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: "Image 1: User's Design" },
          { type: 'image', source: { type: 'base64', media_type: userImg.mediaType, data: userImg.data } },
          ...imageContents,
          { type: 'text', text: 'Please generate the comprehensive UX benchmark report matching the tool schema.' },
        ],
      },
    ],
    tools: [
      {
        name: 'submit_benchmark_report',
        description: 'Submit the structured benchmark UX report',
        input_schema: {
          type: 'object',
          properties: {
            overallAlignment: { type: 'string', description: 'e.g. 78' },
            snapshot: {
              type: 'object',
              properties: {
                strongConventions: { type: 'array', items: { type: 'string' } },
                notableDifferences: { type: 'array', items: { type: 'string' } },
                keyOpportunities: { type: 'array', items: { type: 'string' } },
              },
              required: ['strongConventions', 'notableDifferences', 'keyOpportunities'],
            },
            commonPatterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  evidence: { type: 'string' },
                  confidence: { type: 'string' },
                  whyItMatters: { type: 'string' },
                  exceptions: { type: 'string' },
                  benchmarkExamples: { type: 'array', items: { type: 'string' } },
                  metrics: {
                    type: 'object',
                    properties: {
                      marketStandardParity: {
                        type: 'object',
                        properties: { score: { type: 'integer' }, reasoning: { type: 'string' } },
                        required: ['score', 'reasoning'],
                      },
                      provenPatternAdherence: {
                        type: 'object',
                        properties: { score: { type: 'integer' }, reasoning: { type: 'string' } },
                        required: ['score', 'reasoning'],
                      },
                      informationDensityMatch: {
                        type: 'object',
                        properties: { score: { type: 'integer' }, reasoning: { type: 'string' } },
                        required: ['score', 'reasoning'],
                      },
                      competitiveEdge: {
                        type: 'object',
                        properties: { score: { type: 'integer' }, reasoning: { type: 'string' } },
                        required: ['score', 'reasoning'],
                      },
                    },
                    required: ['marketStandardParity', 'provenPatternAdherence', 'informationDensityMatch', 'competitiveEdge'],
                  },
                },
                required: ['title', 'evidence', 'confidence', 'whyItMatters', 'exceptions', 'benchmarkExamples', 'metrics'],
              },
            },
            designDifferences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  yourDesign: { type: 'string' },
                  benchmark: { type: 'string' },
                  difference: { type: 'string' },
                  potentialImpact: { type: 'string' },
                },
                required: ['title', 'yourDesign', 'benchmark', 'difference', 'potentialImpact'],
              },
            },
            opportunities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  observation: { type: 'string' },
                  recommendation: { type: 'string' },
                  evidence: { type: 'string' },
                  confidence: { type: 'string' },
                  exceptions: { type: 'string' },
                  benchmarkExamples: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'observation', 'recommendation', 'evidence', 'confidence', 'exceptions', 'benchmarkExamples'],
              },
            },
          },
          required: ['overallAlignment', 'snapshot', 'commonPatterns', 'designDifferences', 'opportunities'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_benchmark_report' },
  });

  const toolCall = message.content.find((block) => block.type === 'tool_use');

  if (toolCall && toolCall.type === 'tool_use') {
    return {
      report: toolCall.input,
      benchmarkScreens: validBenchmarkImages.map((s) => ({
        id: s.id,
        name: s.name,
        app: { name: s.appName },
        imageUrl: s.imageUrl,
        uxAnalysis: s.uxAnalysis,
        keyHighlights: s.keyHighlights,
        tonalityAndContent: s.tonalityAndContent,
        similarity: s.similarity,
      })),
    };
  }

  throw new Error('Claude did not return the expected tool call');
}

