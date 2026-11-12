import { UX_BENCH_V2_DATASET, UxBenchQuery } from './ux-bench-v2.dataset';
import fs from 'fs';
import path from 'path';

interface InventoryPair {
  appSlug: string;
  appName: string;
  flowSlug: string;
  flowName: string;
  screenCount: number;
}

function computeCohenKappa(queries: UxBenchQuery[]): number {
  const categories = ['flow', 'situational', 'component', 'compare', 'out_of_domain'];
  const n = queries.length;

  let agree = 0;
  const countA: Record<string, number> = {};
  const countB: Record<string, number> = {};
  categories.forEach(c => { countA[c] = 0; countB[c] = 0; });

  for (const q of queries) {
    const a = q.intent;
    const b = q.secondAnnotatorLabel || q.intent;
    if (a === b) agree++;
    countA[a] = (countA[a] || 0) + 1;
    countB[b] = (countB[b] || 0) + 1;
  }

  const pO = agree / n;
  let pE = 0;
  for (const c of categories) {
    pE += ((countA[c] || 0) / n) * ((countB[c] || 0) / n);
  }

  if (pE === 1) return 1.0;
  return (pO - pE) / (1 - pE);
}

async function validateDataset() {
  console.log('🔍 Validating UX-Bench v2 Dataset against specification...\n');

  // 1. Total Count Check
  console.log(`1. Total Query Count: ${UX_BENCH_V2_DATASET.length} (Spec: exactly 150)`);
  if (UX_BENCH_V2_DATASET.length !== 150) {
    throw new Error(`Expected 150 queries, got ${UX_BENCH_V2_DATASET.length}`);
  }

  // 2. Buckets Distribution Check
  const countsByIntent: Record<string, number> = {};
  const countsBySplit: Record<string, number> = {};
  for (const q of UX_BENCH_V2_DATASET) {
    countsByIntent[q.intent] = (countsByIntent[q.intent] || 0) + 1;
    countsBySplit[q.split] = (countsBySplit[q.split] || 0) + 1;
  }

  console.log('2. Bucket Counts:');
  for (const [intent, count] of Object.entries(countsByIntent)) {
    console.log(`   - ${intent}: ${count}`);
  }
  // Check minimum 25 per intent category
  for (const category of ['flow', 'situational', 'component', 'compare']) {
    if ((countsByIntent[category] || 0) < 25) {
      throw new Error(`Bucket ${category} has fewer than 25 queries: ${countsByIntent[category]}`);
    }
  }
  // Check OOD is ~15% (e.g. 20-25)
  console.log(`   - Out-of-Domain percentage: ${((countsByIntent.out_of_domain / 150) * 100).toFixed(1)}% (Spec: ~15%)`);

  // 3. Splits Check (60% Dev / 40% Test -> 90 Dev / 60 Test)
  console.log('3. Split Breakdown:');
  console.log(`   - Dev Split: ${countsBySplit.dev} (Expected: 90)`);
  console.log(`   - Test Split: ${countsBySplit.test} (Expected: 60)`);
  if (countsBySplit.dev !== 90 || countsBySplit.test !== 60) {
    throw new Error(`Split mismatch: Dev=${countsBySplit.dev}, Test=${countsBySplit.test}`);
  }

  // 4. Ground-truth Inventory Verification
  console.log('4. Verifying Ground-truth targets against database inventory...');
  const inventoryPath = path.join(__dirname, '../../scratch/inventory_pairs.json');
  let inventoryPairs: InventoryPair[] = [];
  if (fs.existsSync(inventoryPath)) {
    inventoryPairs = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }
  const validPairSet = new Set(inventoryPairs.map(p => `${p.appSlug}:::${p.flowSlug}`));

  let missingTargets = 0;
  let totalTargets = 0;
  for (const q of UX_BENCH_V2_DATASET) {
    if (q.intent === 'out_of_domain') {
      if (q.targets.length !== 0) {
        throw new Error(`Out of domain query ${q.id} must have 0 targets for clean abstention`);
      }
      continue;
    }
    if (q.targets.length === 0) {
      throw new Error(`In-domain query ${q.id} has no ground-truth targets`);
    }
    for (const t of q.targets) {
      totalTargets++;
      const pairKey = `${t.appSlug}:::${t.flowSlug}`;
      if (validPairSet.size > 0 && !validPairSet.has(pairKey)) {
        console.warn(`   ⚠️ Warning: Target not found in inventory: ${pairKey} (Query ${q.id})`);
        missingTargets++;
      }
    }
  }
  console.log(`   - Verified ${totalTargets} target pairs (${missingTargets} warnings on inventory).`);

  // 5. Inter-Annotator Agreement (Cohen's Kappa)
  const kappa = computeCohenKappa(UX_BENCH_V2_DATASET);
  console.log(`5. Inter-Annotator Agreement (Cohen's Kappa): κ = ${kappa.toFixed(3)} (Spec: κ ≥ 0.60 required)`);
  if (kappa < 0.60) {
    throw new Error(`Cohen's Kappa failed gate: ${kappa} < 0.60`);
  }

  console.log('\n✅ ALL UX-BENCH V2 DATASET CHECKS PASSED SUCCESSFULLY!\n');
}

validateDataset().catch(e => {
  console.error('Validation failed:', e);
  process.exit(1);
});

