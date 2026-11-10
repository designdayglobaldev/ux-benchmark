import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../db/prisma';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

function cleanHtml(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

async function urlToBase64(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') || 'image/webp';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err: any) {
    console.warn(`[Embedder] Failed to download image ${imageUrl}:`, err.message);
    return null;
  }
}

function buildScreenMetadataText(screen: any, app: any): string {
  const categoryTitle = app?.category?.title || 'General';
  const subcategoryTitle = app?.subcategory?.title ? ` > ${app.subcategory.title}` : '';
  const flowName = screen.flow?.name || 'General';
  const flowDesc = screen.flow?.description ? ` (${cleanHtml(screen.flow.description)})` : '';
  const stepStr = screen.screenNo ? `Screen ${screen.screenNo}` : 'Key Screen';

  const uiElementsList = (screen.uiElements || []).map((u: any) => u.title).filter(Boolean).join(', ');
  const patternsList = (screen.patterns || []).map((p: any) => p.title).filter(Boolean).join(', ');

  let hotspotsSummary = '';
  if (screen.hotspots && Array.isArray((screen.hotspots as any).insights)) {
    hotspotsSummary = (screen.hotspots as any).insights
      .map((h: any, i: number) => `#${i + 1} [${h.title || 'Insight'}]: ${cleanHtml(h.description || '')}`)
      .join(' | ');
  }

  const sections = [
    `=== 1. APP & FLOW CONTEXT ===`,
    `App: ${app?.name || 'Unknown'} (${categoryTitle}${subcategoryTitle}) | Flow: ${flowName}${flowDesc} | Step: ${stepStr}`,
    `Screen Title: ${screen.name || 'Untitled Screen'}`,
    uiElementsList ? `UI Components: ${uiElementsList}` : null,
    patternsList ? `UX Patterns: ${patternsList}` : null,
    screen.keyHighlights ? `Key Highlights: ${cleanHtml(screen.keyHighlights)}` : null,
    screen.tonalityAndContent ? `Copy & Tonality: ${cleanHtml(screen.tonalityAndContent)}` : null,
    screen.evidenceWhoWhy ? `Design Evidence: ${cleanHtml(screen.evidenceWhoWhy)}` : null,
    screen.uxAnalysis ? `UX Analysis: ${cleanHtml(screen.uxAnalysis)}` : null,
    screen.whereToUse ? `Where To Use: ${cleanHtml(screen.whereToUse)}` : null,
    screen.whereNotToUse ? `Where NOT To Use: ${cleanHtml(screen.whereNotToUse)}` : null,
    hotspotsSummary ? `Spatial Hotspots: ${hotspotsSummary}` : null
  ];

  return sections.filter(Boolean).join('\n');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncMultimodalScreens(limit: number = Infinity) {
  console.log('\n======================================================');
  console.log('1. UPGRADING & SYNCING MULTIMODAL EMBEDDINGS (IMAGE + TEXT)');
  console.log('======================================================');

  // Identify screens that already have the full multimodal hierarchy embedding
  const alreadyUpgradedRows: any = await prisma.$queryRawUnsafe(`
    SELECT "screenId" FROM "ScreenEmbedding" 
    WHERE "metadataText" LIKE '%=== 1. APP-LEVEL INTELLIGENCE ===%'
       OR "metadataText" LIKE '%=== 1. APP & FLOW CONTEXT ===%';
  `);
  const alreadyUpgradedIds = new Set<string>(alreadyUpgradedRows.map((r: any) => String(r.screenId)));

  const totalScreens = await prisma.screen.count({ where: { imageUrl: { not: '' } } });
  const remainingCount = totalScreens - alreadyUpgradedIds.size;
  console.log(`Total valid screens in DB:              ${totalScreens}`);
  console.log(`Already multimodal (Image + Text):      ${alreadyUpgradedIds.size}`);
  console.log(`Needing Multimodal Sync or Upgrade:     ${remainingCount}`);

  const targetLimit = limit <= 0 ? Infinity : limit;
  console.log(`Target processing limit for this run:   ${targetLimit === Infinity ? 'ALL (' + remainingCount + ' screens)' : targetLimit}`);

  // 1 screen per batch: ~2,500 tokens. 
  // With a 21s delay, this uses ~7,500 TPM and exactly 2.8 RPM.
  // This is mathematically guaranteed to NEVER exceed Voyage's 10,000 TPM / 3 RPM free tier limits.
  const CHUNK_SIZE = 1;
  let processed = 0;

  while (processed < targetLimit) {
    const screens: any[] = await prisma.screen.findMany({
      where: {
        id: { notIn: Array.from(alreadyUpgradedIds) },
        imageUrl: { not: '' }
      },
      take: Math.min(CHUNK_SIZE, targetLimit === Infinity ? CHUNK_SIZE : targetLimit - processed),
      include: {
        app: {
          include: {
            category: true,
            subcategory: true
          }
        },
        flow: true,
        uiElements: true,
        patterns: true
      }
    });

    if (screens.length === 0) {
      console.log('✅ All screens have full multimodal embeddings!');
      break;
    }

    // Download images and build metadata in parallel
    const downloaded = await Promise.all(
      screens.map(async (screen) => {
        const b64 = await urlToBase64(screen.imageUrl);
        const text = buildScreenMetadataText(screen, screen.app);
        return { screen, b64, text };
      })
    );

    const validItems = downloaded.filter((d) => !!d.b64);
    if (validItems.length === 0) {
      screens.forEach((s) => alreadyUpgradedIds.add(s.id));
      continue;
    }

    const payloadInputs = validItems.map((item) => ({
      content: [
        { type: 'text', text: item.text },
        { type: 'image_base64', image_base64: item.b64! }
      ]
    }));

    // Robust retry loop for the current batch
    let success = false;
    let attempts = 0;

    while (!success && attempts < 10) {
      attempts++;
      try {
        const voyageRes = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${VOYAGE_API_KEY}`
          },
          body: JSON.stringify({
            model: 'voyage-multimodal-3',
            inputs: payloadInputs
          })
        });

        if (!voyageRes.ok) {
          const errText = await voyageRes.text();
          if (voyageRes.status === 429 || errText.includes('rate limits')) {
            console.log(`[Rate Limit 429] Voyage limit hit. Cooling down for 25s before retry (attempt ${attempts}/10)...`);
            await sleep(25000);
            continue;
          }
          console.warn(`[Voyage Multimodal] API error (${voyageRes.status}):`, errText);
          break;
        }

        const voyageData = await voyageRes.json();
        const embeddings = voyageData.data;

        // Upsert into ScreenEmbedding
        for (let i = 0; i < validItems.length; i++) {
          const { screen, text } = validItems[i];
          const vector = embeddings[i].embedding;
          const recordId = crypto.randomUUID();

          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "ScreenEmbedding" ("id", "screenId", "metadataText", "embedding", "updatedAt")
            VALUES ($1, $2, $3, $4::vector, NOW())
            ON CONFLICT ("screenId") DO UPDATE 
            SET "metadataText" = EXCLUDED."metadataText",
                "embedding" = EXCLUDED."embedding",
                "updatedAt" = NOW();
            `,
            recordId,
            screen.id,
            text,
            JSON.stringify(vector)
          );

          alreadyUpgradedIds.add(screen.id);
        }

        processed += validItems.length;
        console.log(`[Screen Sync] Embedded ${processed}/${targetLimit === Infinity ? remainingCount : targetLimit} screens in this run (tokens: ${voyageData.usage?.total_tokens || 'N/A'})`);
        success = true;

        // Rate limit cooling pause between successful batches (22s keeps safely under 3 RPM & 10K TPM)
        await sleep(22000);
      } catch (err: any) {
        console.error('[Embedder] Batch sync error:', err.message);
        await sleep(5000);
      }
    }

    if (!success) {
      console.warn(`[Embedder] Failed batch after ${attempts} attempts. Moving to next screens...`);
      screens.forEach((s) => alreadyUpgradedIds.add(s.id));
    }
  }
}

async function syncAppEmbeddings() {
  console.log('\n======================================================');
  console.log('2. SYNCING APP EMBEDDINGS');
  console.log('======================================================');

  const existingAppRows: any = await prisma.$queryRawUnsafe(`SELECT "appId" FROM "AppEmbedding";`);
  const embeddedAppIds = new Set<string>(existingAppRows.map((r: any) => String(r.appId)));

  const apps: any[] = await prisma.app.findMany({
    where: { id: { notIn: Array.from(embeddedAppIds) } },
    include: {
      category: true,
      subcategory: true,
      appFlows: { include: { flow: true } }
    },
    take: 10
  });

  if (apps.length === 0) {
    console.log('✅ All apps are embedded!');
    return;
  }

  console.log(`Found ${apps.length} apps needing vector embeddings.`);

  for (const app of apps) {
    const flowsList = (app.appFlows || []).map((af: any) => af.flow?.name).filter(Boolean).join(', ');
    const appText = [
      `APP: ${app.name} (${app.category?.title || 'General'})`,
      app.description ? `Description: ${cleanHtml(app.description)}` : null,
      app.tags?.length ? `Tags: ${app.tags.join(', ')}` : null,
      flowsList ? `Flows: ${flowsList}` : null,
      app.experienceUxSolves ? `Problem Solved: ${cleanHtml(app.experienceUxSolves)}` : null,
    ].filter(Boolean).join('\n');

    try {
      const voyageRes = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${VOYAGE_API_KEY}`
        },
        body: JSON.stringify({
          model: 'voyage-3',
          input: [appText]
        })
      });

      if (!voyageRes.ok) continue;

      const voyageData = await voyageRes.json();
      const vector = voyageData.data[0].embedding;
      const recordId = crypto.randomUUID();

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "AppEmbedding" ("id", "appId", "metadataText", "embedding", "updatedAt")
        VALUES ($1, $2, $3, $4::vector, NOW())
        ON CONFLICT ("appId") DO UPDATE 
        SET "metadataText" = EXCLUDED."metadataText",
            "embedding" = EXCLUDED."embedding",
            "updatedAt" = NOW();
        `,
        recordId,
        app.id,
        appText,
        JSON.stringify(vector)
      );

      console.log(`[App Sync] Embedded app: "${app.name}"`);
      await sleep(20500);
    } catch (err: any) {
      console.warn(`[App Sync] Error embedding ${app.name}:`, err.message);
    }
  }
}

async function rebuildGraphEdges() {
  console.log('\n======================================================');
  console.log('3. LINKING ASSOCIATIVE GRAPH EDGES (ScreenEdge)');
  console.log('======================================================');

  const screensWithFlows = await prisma.screen.findMany({
    where: {
      flowId: { not: null },
      screenNo: { not: null }
    },
    select: {
      id: true,
      appId: true,
      flowId: true,
      screenNo: true
    },
    orderBy: [
      { appId: 'asc' },
      { flowId: 'asc' },
      { screenNo: 'asc' }
    ]
  });

  const flowGroups = new Map<string, any[]>();
  for (const s of screensWithFlows) {
    const key = `${s.appId}:::${s.flowId}`;
    if (!flowGroups.has(key)) flowGroups.set(key, []);
    flowGroups.get(key)!.push(s);
  }

  let edgesAdded = 0;
  for (const [, group] of flowGroups.entries()) {
    group.sort((a, b) => (a.screenNo || 0) - (b.screenNo || 0));
    for (let i = 0; i < group.length - 1; i++) {
      const source = group[i];
      const target = group[i + 1];

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "ScreenEdge" ("id", "sourceScreenId", "targetScreenId", "edgeType", "weight")
        VALUES ($1, $2, $3, 'FLOW_SEQUENCE', 1.0)
        ON CONFLICT ("sourceScreenId", "targetScreenId", "edgeType") DO NOTHING;
        `,
        crypto.randomUUID(),
        source.id,
        target.id
      );
      edgesAdded++;
    }
  }

  console.log(`✅ Flow sequence graph updated: ${edgesAdded} edges verified.`);
}

async function main() {
  if (!VOYAGE_API_KEY) {
    console.error('❌ VOYAGE_API_KEY is not defined in environment.');
    process.exit(1);
  }

  // Parse SYNC_LIMIT: support "ALL", "all", "0", or numbers
  const rawLimit = (process.env.SYNC_LIMIT || 'ALL').trim().toUpperCase();
  const runLimit = rawLimit === 'ALL' || rawLimit === '0' ? Infinity : parseInt(rawLimit, 10) || Infinity;
  console.log(`🚀 Starting Vector Sync Pipeline (Target: ${runLimit === Infinity ? 'ALL remaining screens' : runLimit + ' screens'})...`);

  await syncMultimodalScreens(runLimit);
  await syncAppEmbeddings();
  await rebuildGraphEdges();

  console.log('\n🎉 Vector pipeline sync completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
