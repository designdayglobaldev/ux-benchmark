import { IntentRouter, IntentType } from '../services/search/intent-router';

// 40 Designer-written colloquial queries covering all intents without dataset templating ("When to...", "Where to avoid...")
interface DesignerQuery {
  query: string;
  expectedPrimary: IntentType;
  notes: string;
}

const DESIGNER_QUERIES: DesignerQuery[] = [
  // FLOW (End-to-end user journeys, walkthroughs, task sequences)
  { query: 'clean checkout friction reduction in mobile shopping', expectedPrimary: 'flow', notes: 'Checkout journey' },
  { query: 'how users sign up with phone number OTP', expectedPrimary: 'flow', notes: 'Sign-up / onboarding sequence' },
  { query: 'crypto onboarding wallet seed phrase walkthrough', expectedPrimary: 'flow', notes: 'Web3 onboarding flow' },
  { query: 'requesting refund for damaged delivery', expectedPrimary: 'flow', notes: 'Refund workflow' },
  { query: 'cancelling subscription retention offer discount', expectedPrimary: 'flow', notes: 'Cancellation flow' },
  { query: 'how drivers accept ride and view map route', expectedPrimary: 'flow', notes: 'Dispatch journey' },
  { query: 'booking flight seat reservation with baggage add-ons', expectedPrimary: 'flow', notes: 'Booking flow' },
  { query: 'linking external bank account via plaid', expectedPrimary: 'flow', notes: 'Bank account connection flow' },
  { query: 'splitting dinner bill with friends instant cash', expectedPrimary: 'flow', notes: 'P2P payment sequence' },
  { query: 'posting a photo reel with music and captions', expectedPrimary: 'flow', notes: 'Social media post creation' },

  // SITUATIONAL (UX rationale, cognitive load, trade-offs, guidance, edge cases, friction)
  { query: 'handling high cognitive load in multi-currency portfolio balance', expectedPrimary: 'situational', notes: 'Information architecture cognitive load' },
  { query: 'why modal sheets cause keyboard dismissal clipping on android', expectedPrimary: 'situational', notes: 'Anti-pattern mobile sheets' },
  { query: 'best practices for camera glare fallback during passport scan', expectedPrimary: 'situational', notes: 'Graceful degradation' },
  { query: 'how to reduce anxiety during slow 5-minute KYC verification', expectedPrimary: 'situational', notes: 'User anxiety progress UX' },
  { query: 'should we prompt for push notifications on first app launch', expectedPrimary: 'situational', notes: 'Permission priming timing' },
  { query: 'trade-offs between optimistic UI comments vs spinner loading', expectedPrimary: 'situational', notes: 'Optimistic UI trade-offs' },
  { query: 'preventing rage clicks during slow network retry', expectedPrimary: 'situational', notes: 'Network error handling UX' },
  { query: 'tone of voice guidelines for overdraft warning banners', expectedPrimary: 'situational', notes: 'Copy & empathy guidelines' },
  { query: 'why full-screen takeovers kill search exploration conversion', expectedPrimary: 'situational', notes: 'Search takeover anti-pattern' },
  { query: 'guidance on streak freeze recovery mechanics in learning apps', expectedPrimary: 'situational', notes: 'Gamification recovery psychology' },

  // COMPONENT (Specific UI controls, widgets, primitives)
  { query: 'numeric numpad for dollar amount input', expectedPrimary: 'component', notes: 'Keypad component' },
  { query: 'segmented control pill toggle for monthly vs annual', expectedPrimary: 'component', notes: 'Segmented control' },
  { query: 'bottom sheet payment method selector with handle', expectedPrimary: 'component', notes: 'Bottom sheet modal' },
  { query: 'toast notification confirmation pill for upload', expectedPrimary: 'component', notes: 'Toast snackbar' },
  { query: 'circular floating action button for quick add', expectedPrimary: 'component', notes: 'FAB' },
  { query: 'skeleton shimmer loading placeholder cards', expectedPrimary: 'component', notes: 'Skeleton loading' },
  { query: 'search bar with microphone voice input icon', expectedPrimary: 'component', notes: 'Search input' },
  { query: 'checkbox multi-select task resolution checklist', expectedPrimary: 'component', notes: 'Checkbox list' },
  { query: 'stacked list grouped iOS settings with chevrons', expectedPrimary: 'component', notes: 'Stacked list table' },
  { query: 'avatar stack showing active online collaborators', expectedPrimary: 'component', notes: 'Avatar stack presence' },

  // COMPARE (Contrasting two apps, side-by-side design paradigms)
  { query: 'Revolut vs Monzo biometric identity onboarding differences', expectedPrimary: 'compare', notes: 'Neobank KYC comparison' },
  { query: 'how does Cash App transfer compare with Venmo social feed', expectedPrimary: 'compare', notes: 'P2P app comparison' },
  { query: 'Linear ticket creation vs Jira issue backlog workflow', expectedPrimary: 'compare', notes: 'Issue tracker comparison' },
  { query: 'Figma canvas comments versus Loom video thread feedback', expectedPrimary: 'compare', notes: 'Feedback paradigms' },
  { query: 'Spotify audio discovery compared to Shazam quick listening', expectedPrimary: 'compare', notes: 'Music discovery comparison' },
  { query: 'Uber driver map routing compared with Lyft dispatch UI', expectedPrimary: 'compare', notes: 'Ride-share UI comparison' },
  { query: 'wealthfront automated robo rebalancing vs coinbase self-custody', expectedPrimary: 'compare', notes: 'Investing vs crypto comparison' },
  { query: 'Duolingo streak freeze versus Brilliant lesson streak mechanics', expectedPrimary: 'compare', notes: 'Edtech gamification compare' },
  { query: 'Arc Search browse for me AI compilation versus Google Search cards', expectedPrimary: 'compare', notes: 'Search AI compare' },
  { query: 'contrast Apple Pay NFC card provisioning with Google Wallet linking', expectedPrimary: 'compare', notes: 'Digital wallet comparison' },
];

function evalRouter() {
  console.log('================================================================');
  console.log(`EVALUATING INTENT ROUTER R0 ON ${DESIGNER_QUERIES.length} DESIGNER-WRITTEN QUERIES`);
  console.log('================================================================\n');

  let correctPrimary = 0;
  let correctInActive = 0;
  const resultsByIntent: Record<string, { total: number; primaryMatches: number; inActiveMatches: number }> = {
    flow: { total: 0, primaryMatches: 0, inActiveMatches: 0 },
    situational: { total: 0, primaryMatches: 0, inActiveMatches: 0 },
    component: { total: 0, primaryMatches: 0, inActiveMatches: 0 },
    compare: { total: 0, primaryMatches: 0, inActiveMatches: 0 },
  };

  const misclassifications: any[] = [];

  for (let i = 0; i < DESIGNER_QUERIES.length; i++) {
    const item = DESIGNER_QUERIES[i];
    const routing = IntentRouter.classify(item.query);

    // Determine highest scored intent
    const scores = routing.scores;
    const sortedIntents = (['flow', 'situational', 'component', 'compare'] as IntentType[]).sort(
      (a, b) => scores[b] - scores[a]
    );
    const topPredicted = sortedIntents[0];
    const isPrimaryMatch = topPredicted === item.expectedPrimary;
    const isInActive = routing.activeRoutes.includes(item.expectedPrimary);

    if (isPrimaryMatch) correctPrimary++;
    if (isInActive) correctInActive++;

    resultsByIntent[item.expectedPrimary].total++;
    if (isPrimaryMatch) resultsByIntent[item.expectedPrimary].primaryMatches++;
    if (isInActive) resultsByIntent[item.expectedPrimary].inActiveMatches++;

    if (!isPrimaryMatch) {
      misclassifications.push({
        query: item.query,
        expected: item.expectedPrimary,
        predicted: topPredicted,
        scores: routing.scores,
        activeRoutes: routing.activeRoutes,
        notes: item.notes,
      });
    }

    console.log(`[${i + 1}/${DESIGNER_QUERIES.length}] "${item.query.slice(0, 45)}..." -> Expected: ${item.expectedPrimary} | Top: ${topPredicted} ${isPrimaryMatch ? 'âœ…' : 'âŒ'} (Active: ${routing.activeRoutes.join(',')})`);
  }

  const primaryAccuracy = (correctPrimary / DESIGNER_QUERIES.length) * 100;
  const activeCoverage = (correctInActive / DESIGNER_QUERIES.length) * 100;

  console.log('\n================================================================');
  console.log(`OVERALL TOP-1 ACCURACY: ${primaryAccuracy.toFixed(1)}% (${correctPrimary}/${DESIGNER_QUERIES.length})`);
  console.log(`ACTIVE ROUTE COVERAGE:  ${activeCoverage.toFixed(1)}% (${correctInActive}/${DESIGNER_QUERIES.length})`);
  console.log('================================================================\n');

  console.log('ACCURACY BY INTENT:');
  console.table(
    Object.keys(resultsByIntent).map((intent) => {
      const stats = resultsByIntent[intent];
      return {
        Intent: intent,
        Queries: stats.total,
        'Top-1 Accuracy': `${((stats.primaryMatches / stats.total) * 100).toFixed(1)}%`,
        'Active Route Recall': `${((stats.inActiveMatches / stats.total) * 100).toFixed(1)}%`,
      };
    })
  );

  if (misclassifications.length > 0) {
    console.log(`\nMISCLASSIFICATIONS (${misclassifications.length}):`);
    for (const m of misclassifications) {
      console.log(` - Query: "${m.query}"`);
      console.log(`   Expected: ${m.expected} | Got Top: ${m.predicted}`);
      console.log(`   Scores: ${JSON.stringify(m.scores)} | Active: [${m.activeRoutes.join(', ')}]`);
    }
  }
}

evalRouter();
