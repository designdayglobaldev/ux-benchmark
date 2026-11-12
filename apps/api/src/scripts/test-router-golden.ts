import { IntentRouter } from '../services/search/intent-router';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Intent Router Golden Tests...\n');

// 1. Input Guard Tests (Empty, whitespace, excessive length)
console.log('Test 1: Input guards');
{
  const emptyRes = IntentRouter.classify('');
  assert(emptyRes.activeRoutes.includes('flow'), 'Empty query should fallback to flow');
  assert(emptyRes.scores.flow === 0.25, 'Flow score should be 0.25 prior');

  const whitespaceRes = IntentRouter.classify('   \n\t  ');
  assert(whitespaceRes.activeRoutes.includes('flow'), 'Whitespace query should fallback to flow');

  const longQuery = 'checkout '.repeat(100); // 900 chars
  const longRes = IntentRouter.classify(longQuery);
  assert(longRes.activeRoutes.includes('flow'), 'Long query should be safely truncated and processed');
  console.log('   ✅ Input guards verified.');
}

// 2. Plural and Word Form Variations
console.log('Test 2: Plurals and grammatical variations');
{
  const keypadSingular = IntentRouter.classify('number keypad');
  const keypadPlural = IntentRouter.classify('number keypads');
  assert(keypadSingular.activeRoutes.includes('component'), 'Singular keypad must trigger component');
  assert(keypadPlural.activeRoutes.includes('component'), 'Plural keypads must trigger component');

  const flowPlural = IntentRouter.classify('user onboarding flows');
  assert(flowPlural.activeRoutes.includes('flow'), 'Plural flows must trigger flow');

  const guidelinePlural = IntentRouter.classify('accessibility guidelines');
  assert(guidelinePlural.activeRoutes.includes('situational'), 'Plural guidelines must trigger situational');

  const dropoffPlural = IntentRouter.classify('user drop-offs');
  assert(dropoffPlural.activeRoutes.includes('situational'), 'Plural drop-offs must trigger situational');

  const modalPlural = IntentRouter.classify('confirmation modals');
  assert(modalPlural.activeRoutes.includes('component'), 'Plural modals must trigger component');

  const loginSpaced = IntentRouter.classify('log in process');
  const signupSpaced = IntentRouter.classify('sign up flow');
  assert(loginSpaced.activeRoutes.includes('flow'), '"log in" must trigger flow');
  assert(signupSpaced.activeRoutes.includes('flow'), '"sign up" must trigger flow');

  const compareForms = ['compare checkout', 'comparing checkout', 'comparison of checkout', 'compared checkout'];
  for (const q of compareForms) {
    const res = IntentRouter.classify(q);
    assert(res.activeRoutes.includes('compare'), `"${q}" must trigger compare`);
  }
  console.log('   ✅ Plurals and grammatical forms verified.');
}

// 3. Ambiguous Keyword Disambiguation
console.log('Test 3: Ambiguous keyword disambiguation');
{
  // "freeze card" should NOT trigger component intent
  const freezeCard = IntentRouter.classify('how to freeze card in revolut');
  assert(
    !freezeCard.activeRoutes.includes('component'),
    '"freeze card" should NOT trigger component intent (bare "card" without UI context)'
  );

  // "card component" or "card design" SHOULD trigger component intent
  const cardComponent = IntentRouter.classify('revolut card component layout');
  assert(
    cardComponent.activeRoutes.includes('component'),
    '"card component" MUST trigger component intent'
  );

  // "rank of results" should NOT trigger compare intent
  const rankResults = IntentRouter.classify('rank of search results');
  assert(
    !rankResults.activeRoutes.includes('compare'),
    'Bare "rank" should NOT trigger compare intent'
  );

  // "versus" SHOULD trigger compare
  const compareRes = IntentRouter.classify('revolut vs monzo onboarding');
  assert(compareRes.activeRoutes.includes('compare'), '"revolut vs monzo" MUST trigger compare');
  console.log('   ✅ Ambiguous keyword protection verified.');
}

// 4. Non-flow routing away test (Verifying flow base prior does not force flow on pure component/situational)
console.log('Test 4: Non-flow queries can route away from flow');
{
  const pureComponent = IntentRouter.classify('pin pad keypad button modal');
  assert(pureComponent.activeRoutes.includes('component'), 'Must have component active');
  assert(!pureComponent.activeRoutes.includes('flow'), 'Pure component query must NOT have flow active!');

  const pureSituational = IntentRouter.classify('where not to use drop-off friction anti-pattern');
  assert(pureSituational.activeRoutes.includes('situational'), 'Must have situational active');
  assert(!pureSituational.activeRoutes.includes('flow'), 'Pure situational query must NOT have flow active!');
  console.log('   ✅ Clean routing away from flow verified.');
}

console.log('\n🎉 ALL INTENT ROUTER TESTS PASSED!\n');

