import dotenv from 'dotenv';
import path from 'path';
import { prisma } from '../db/prisma';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';

async function verify() {
  console.log('======================================================');
  console.log('   VECTOR DATABASE HEALTH & EMBEDDING AUDIT');
  console.log('======================================================\n');

  // 1. Total Screen Count vs Embedded Count
  const totalScreens = await prisma.screen.count();
  const validScreensWithImages = await prisma.screen.count({ where: { imageUrl: { not: '' } } });

  const totalEmbeddingsRaw: any = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count FROM "ScreenEmbedding";
  `);
  const totalEmbeddings = totalEmbeddingsRaw[0]?.count || 0;

  const multimodalEmbeddingsRaw: any = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count FROM "ScreenEmbedding"
    WHERE "metadataText" LIKE '%=== 1. APP & FLOW CONTEXT ===%'
       OR "metadataText" LIKE '%=== 1. APP-LEVEL INTELLIGENCE ===%';
  `);
  const multimodalEmbeddings = multimodalEmbeddingsRaw[0]?.count || 0;

  console.log(`📊 SCREEN STATS:`);
  console.log(`  • Total Screens in DB:             ${totalScreens}`);
  console.log(`  • Screens with Valid Image URLs:   ${validScreensWithImages}`);
  console.log(`  • Total ScreenEmbedding Rows:      ${totalEmbeddings} (${((totalEmbeddings / (totalScreens || 1)) * 100).toFixed(1)}%)`);
  console.log(`  • Full Multimodal (Image+Text):    ${multimodalEmbeddings}`);
  console.log(`  • Legacy / Text-Only Embeddings:   ${totalEmbeddings - multimodalEmbeddings}`);

  // 2. Apps Embedding
  const totalApps = await prisma.app.count();
  const totalAppEmbeddingsRaw: any = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count FROM "AppEmbedding";
  `);
  const totalAppEmbeddings = totalAppEmbeddingsRaw[0]?.count || 0;
  console.log(`\n📱 APP STATS:`);
  console.log(`  • Total Apps in DB:                ${totalApps}`);
  console.log(`  • Apps with Embeddings:            ${totalAppEmbeddings}`);

  // 3. Graph Edges
  const totalEdgesRaw: any = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count FROM "ScreenEdge";
  `);
  const totalEdges = totalEdgesRaw[0]?.count || 0;
  console.log(`\n🕸️ GRAPH EDGES (HippoRAG):`);
  console.log(`  • Total Sequential Graph Edges:    ${totalEdges}`);

  // 4. Live Cosine Similarity Test Query
  console.log(`\n🔍 TESTING LIVE VECTOR SIMILARITY SEARCH:`);
  if (!VOYAGE_API_KEY) {
    console.log(`  ⚠️ VOYAGE_API_KEY missing - skipping live search test.`);
    return;
  }

  const testQuery = 'Fintech KYC onboarding identity verification passport selfie';
  console.log(`  Query: "${testQuery}"`);

  const voyageRes = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: [testQuery]
    })
  });

  if (!voyageRes.ok) {
    console.error(`  ❌ Voyage query failed:`, await voyageRes.text());
    return;
  }

  const voyageData = await voyageRes.json();
  const testVector = voyageData.data[0].embedding;

  const results: any = await prisma.$queryRawUnsafe(
    `
    SELECT 
      s."name" as screen_name,
      a."name" as app_name,
      f."name" as flow_name,
      1 - (se."embedding" <=> $1::vector) AS similarity
    FROM "ScreenEmbedding" se
    JOIN "Screen" s ON s."id" = se."screenId"
    JOIN "App" a ON a."id" = s."appId"
    LEFT JOIN "Flow" f ON f."id" = s."flowId"
    ORDER BY se."embedding" <=> $1::vector ASC
    LIMIT 3;
    `,
    JSON.stringify(testVector)
  );

  console.log(`  Top 3 Nearest Vectors:`);
  results.forEach((r: any, idx: number) => {
    console.log(`    [${idx + 1}] ${(r.similarity * 100).toFixed(1)}% match -> "${r.screen_name}" (${r.app_name} | ${r.flow_name || 'General'})`);
  });

  if (results.length > 0 && results[0].similarity > 0.45) {
    console.log(`\n✅ VECTOR RETRIEVAL TEST PASSED WITH HIGH CONFIDENCE!`);
  } else {
    console.log(`\n⚠️ Vector search returned results with low confidence.`);
  }
}

verify()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });

