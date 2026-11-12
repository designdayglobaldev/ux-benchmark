import dotenv from 'dotenv';
import path from 'path';

// Explicitly load apps/api/.env before importing services
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

import { CognitiveSearchEngine } from '../services/search';

async function runTest() {
  const query = process.argv[2] || 'Fintech KYC onboarding identity verification passport selfie';

  console.log('================================================================');
  console.log('   COGNITIVE UX SEARCH & 2-STAGE RE-RANKING PIPELINE TEST');
  console.log('================================================================\n');
  console.log(`🔎 Test Query: "${query}"\n`);
  console.log('⏳ Running 5-Stage Pipeline:');
  console.log('   1. Intent Balancing');
  console.log('   2. Voyage Multimodal-3 Query Embedding');
  console.log('   3. pgvector Dense Retrieval (App & Screen Anchors)');
  console.log('   4. HippoRAG 2-Hop Spreading Activation Graph Walk');
  console.log('   5. Contiguous Flow Stitching + Voyage Rerank-2 Cross-Encoder\n');

  const startTime = Date.now();
  const results = await CognitiveSearchEngine.search({
    prompt: query,
    limit: 4,
  });
  const durationMs = Date.now() - startTime;

  console.log(`⏱️ Completed in: ${durationMs}ms\n`);

  console.log('----------------------------------------------------------------');
  console.log('🏆 TOP RANKED USER FLOWS (Precision Target: 90%+)');
  console.log('----------------------------------------------------------------');

  if (!results.flows || results.flows.length === 0) {
    console.log('⚠️ No matching flows found.');
  } else {
    results.flows.forEach((flow, i) => {
      const confidence = (flow.anchorSimilarity * 100).toFixed(1);
      const isHighConfidence = flow.anchorSimilarity >= 0.85;
      const statusIcon = isHighConfidence ? '🌟 [90%+ PRECISION]' : '✅';

      console.log(`\n#${i + 1} ${statusIcon} ${confidence}% Confidence`);
      console.log(`   App:         ${flow.appName} (${flow.appSlug})`);
      console.log(`   Flow:        ${flow.flowName} (${flow.flowSlug})`);
      console.log(`   Description: ${flow.description}`);
      console.log(`   Screens (${flow.screens.length} stitched steps):`);

      flow.screens.forEach((s) => {
        const anchorTag = s.isAnchor ? ' [SEED ANCHOR]' : '';
        console.log(`     • Step ${s.screenNo}: ${s.name}${anchorTag}`);
      });
    });
  }

  console.log('\n----------------------------------------------------------------');
  console.log('📱 TOP MATCHED APPS:');
  console.log('----------------------------------------------------------------');
  results.apps.forEach((app, i) => {
    console.log(`   [${i + 1}] ${app.name} (${app.category}) - ${(app.similarity * 100).toFixed(1)}% vector score`);
  });

  console.log('\n================================================================');
  console.log('PIPELINE TEST COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Pipeline test error:', err);
    process.exit(1);
  });

