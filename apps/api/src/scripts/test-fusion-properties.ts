import { FusionEngine, FusionArm } from '../services/search/fusion';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Fusion Property Tests...\n');

// 1. Hand-computed Cormack RRF verification
console.log('Test 1: Hand-computed RRF verification');
{
  // Arm 1 (weight 1.0): A at rank 1, B at rank 2
  // Arm 2 (weight 0.5): B at rank 1, C at rank 2
  // k = 60
  // Score(A) = 1.0 / (60 + 1) = 1/61 ≈ 0.0163934426
  // Score(B) = 1.0 / (60 + 2) + 0.5 / (60 + 1) = 1/62 + 0.5/61 ≈ 0.016129032 + 0.008196721 = 0.024325753
  // Score(C) = 0.5 / (60 + 2) = 0.5/62 ≈ 0.008064516
  const arms: FusionArm<{ name: string }>[] = [
    {
      arm: 'vector_dense',
      weight: 1.0,
      candidates: [
        { id: 'item_A', item: { name: 'Item A' } },
        { id: 'item_B', item: { name: 'Item B' } },
      ],
    },
    {
      arm: 'hipporag_graph',
      weight: 0.5,
      candidates: [
        { id: 'item_B', item: { name: 'Item B' } },
        { id: 'item_C', item: { name: 'Item C' } },
      ],
    },
  ];

  const results = FusionEngine.fuse(arms, 60);

  assert(results.length === 3, `Expected 3 fused items, got ${results.length}`);
  assert(results[0].id === 'item_B', `Expected Item B as top rank, got ${results[0].id}`);
  assert(results[1].id === 'item_A', `Expected Item A as rank 2, got ${results[1].id}`);
  assert(results[2].id === 'item_C', `Expected Item C as rank 3, got ${results[2].id}`);

  const expectedScoreB = 1 / 62 + 0.5 / 61;
  const expectedScoreA = 1 / 61;
  const expectedScoreC = 0.5 / 62;

  assert(Math.abs(results[0].rrfScore - expectedScoreB) < 1e-6, `Score B mismatch`);
  assert(Math.abs(results[1].rrfScore - expectedScoreA) < 1e-6, `Score A mismatch`);
  assert(Math.abs(results[2].rrfScore - expectedScoreC) < 1e-6, `Score C mismatch`);

  // Verify sources
  assert(results[0].sources.length === 2, `Expected 2 sources for Item B`);
  assert(results[0].sources[0].arm === 'vector_dense' && results[0].sources[0].rank === 2, `Source 1 for B check`);
  assert(results[0].sources[1].arm === 'hipporag_graph' && results[0].sources[1].rank === 1, `Source 2 for B check`);
  console.log('   ✅ Hand-computed RRF passed with exact precision match.');
}

// 2. Monotonicity Property: Higher rank within arm gives strictly higher score
console.log('Test 2: Monotonicity property');
{
  const arms: FusionArm<string>[] = [
    {
      arm: 'arm_1',
      weight: 1.0,
      candidates: [
        { id: 'x1', item: 'x1' },
        { id: 'x2', item: 'x2' },
        { id: 'x3', item: 'x3' },
      ],
    },
  ];
  const results = FusionEngine.fuse(arms, 60);
  assert(results[0].rrfScore > results[1].rrfScore, 'Rank 1 must score higher than Rank 2');
  assert(results[1].rrfScore > results[2].rrfScore, 'Rank 2 must score higher than Rank 3');
  console.log('   ✅ Monotonicity verified.');
}

// 3. Per-arm Deduplication Property: Repeated IDs in single arm counted only once (at best rank)
console.log('Test 3: Per-arm Deduplication property');
{
  const arms: FusionArm<string>[] = [
    {
      arm: 'arm_1',
      weight: 1.0,
      candidates: [
        { id: 'flow_alpha', item: 'flow_alpha' },
        { id: 'flow_alpha', item: 'flow_alpha' }, // duplicate (e.g. from screen mapping)
        { id: 'flow_alpha', item: 'flow_alpha' }, // duplicate
        { id: 'flow_beta', item: 'flow_beta' },
      ],
    },
  ];
  const results = FusionEngine.fuse(arms, 60);
  assert(results.length === 2, `Expected 2 deduplicated items, got ${results.length}`);
  const expectedAlphaScore = 1.0 / (60 + 1);
  assert(
    Math.abs(results[0].rrfScore - expectedAlphaScore) < 1e-8,
    `Duplicate ID must not inflate score! Expected ${expectedAlphaScore}, got ${results[0].rrfScore}`
  );
  assert(results[0].sources.length === 1, `Expected 1 source entry for flow_alpha`);
  console.log('   ✅ Per-arm deduplication verified (no inflation from screen expansion).');
}

// 4. Invariance Under Arm Permutation: Order of arms does not change resulting scores
console.log('Test 4: Invariance under arm permutation');
{
  const arm1: FusionArm<string> = {
    arm: 'arm_1',
    weight: 0.8,
    candidates: [{ id: 'x', item: 'x' }, { id: 'y', item: 'y' }],
  };
  const arm2: FusionArm<string> = {
    arm: 'arm_2',
    weight: 0.4,
    candidates: [{ id: 'y', item: 'y' }, { id: 'z', item: 'z' }],
  };

  const results12 = FusionEngine.fuse([arm1, arm2], 60);
  const results21 = FusionEngine.fuse([arm2, arm1], 60);

  assert(results12.length === results21.length, 'Length mismatch under arm permutation');
  for (let i = 0; i < results12.length; i++) {
    assert(results12[i].id === results21[i].id, `ID mismatch at index ${i}`);
    assert(Math.abs(results12[i].rrfScore - results21[i].rrfScore) < 1e-10, `Score mismatch at index ${i}`);
  }
  console.log('   ✅ Permutation invariance verified.');
}

// 5. Deterministic Tie-Breaking
console.log('Test 5: Deterministic tie-breaking');
{
  const arms: FusionArm<string>[] = [
    {
      arm: 'arm_1',
      weight: 1.0,
      candidates: [{ id: 'gamma', item: 'gamma' }],
    },
    {
      arm: 'arm_2',
      weight: 1.0,
      candidates: [{ id: 'alpha', item: 'alpha' }],
    },
    {
      arm: 'arm_3',
      weight: 1.0,
      candidates: [{ id: 'beta', item: 'beta' }],
    },
  ];
  // All three items have identical score: 1.0 / (60 + 1)
  const results = FusionEngine.fuse(arms, 60);
  assert(results[0].id === 'alpha', `Expected 'alpha' first on tie, got ${results[0].id}`);
  assert(results[1].id === 'beta', `Expected 'beta' second on tie, got ${results[1].id}`);
  assert(results[2].id === 'gamma', `Expected 'gamma' third on tie, got ${results[2].id}`);
  console.log('   ✅ Deterministic tie-breaking verified.');
}

// 6. Input Validation (Negative weight, non-finite weight, invalid k)
console.log('Test 6: Input validation checks');
{
  let threwNegative = false;
  try {
    FusionEngine.fuse([{ arm: 'bad', weight: -0.5, candidates: [] }]);
  } catch {
    threwNegative = true;
  }
  assert(threwNegative, 'Engine must throw on negative weight');

  let threwK = false;
  try {
    FusionEngine.fuse([{ arm: 'bad', candidates: [] }], -10);
  } catch {
    threwK = true;
  }
  assert(threwK, 'Engine must throw on invalid k <= 0');

  console.log('   ✅ Input validation verified.');
}

console.log('\n🎉 ALL FUSION PROPERTY TESTS PASSED!\n');

