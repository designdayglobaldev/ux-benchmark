/**
 * UX-Bench v2: 150-Query Ground-Truth Evaluation Dataset
 * Conforming strictly to docs/COGNITIVE_UX_RETRIEVAL_SPEC_V2.md (Section 8.1 & Section 9, Gate 0)
 *
 * Volume: 150 ground-truth queries:
 * - Flow: 35 queries
 * - Situational: 35 queries
 * - Component: 30 queries
 * - Compare: 28 queries
 * - Out-of-Domain: 22 queries (14.7%)
 *
 * Splits:
 * - 60% Dev (90 queries)
 * - 40% Test (60 queries, locked until release candidates)
 *
 * Graded Relevance Scale:
 * - 0 = Irrelevant / Wrong
 * - 1 = Useful / Contextually Related
 * - 2 = Ideal / Exact Match Target
 */

export interface RelevanceTarget {
  appSlug: string;
  flowSlug: string;
  grade: 0 | 1 | 2;
  notes?: string;
}

export type IntentCategory = 'flow' | 'situational' | 'component' | 'compare' | 'out_of_domain';
export type DatasetSplit = 'dev' | 'test';

export interface UxBenchQuery {
  id: string; // e.g. "UXB-001"
  query: string;
  intent: IntentCategory;
  split: DatasetSplit;
  description: string;
  expectedPrimaryRoutes: ('flow' | 'situational' | 'component' | 'compare')[];
  targets: RelevanceTarget[];
  annotatorNotes?: string;
  secondAnnotatorLabel?: IntentCategory; // For Cohen's Kappa IAA evaluation (Section 8.1)
}

export const UX_BENCH_V2_DATASET: UxBenchQuery[] = [
  // ==========================================
  // BUCKET 1: FLOW QUERIES (35 queries)
  // Target: Journey-level multi-step completions
  // ==========================================
  {
    id: 'UXB-001',
    query: 'Fintech KYC identity verification selfie passport upload',
    intent: 'flow',
    split: 'dev',
    description: 'Biometric verification & identity document upload in banking onboarding',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2, notes: 'Passport verification & selfie capture flow' },
      { appSlug: 'coinbase-wallet', flowSlug: 'post-onboarding', grade: 1, notes: 'ID document verification' },
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-002',
    query: 'Corporate employee expense reimbursement receipt submission',
    intent: 'flow',
    split: 'dev',
    description: 'B2B expense submission flow with itemized receipt capture',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 2, notes: 'Full reimbursement request sequence' },
      { appSlug: 'brex', flowSlug: 'adding-a-receipt', grade: 1, notes: 'Leaf receipt capture' }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-003',
    query: 'Crypto non-custodial wallet 12-word seed backup security',
    intent: 'flow',
    split: 'dev',
    description: 'Web3 non-custodial recovery phrase backup & confirmation sequence',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'coinbase-wallet', flowSlug: 'setting-up', grade: 2, notes: 'Recovery phrase setup & confirmation' },
      { appSlug: 'coinbase-wallet', flowSlug: 'post-onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-004',
    query: 'Peer to peer money transfer payment send instant cash',
    intent: 'flow',
    split: 'dev',
    description: 'Direct P2P funds transfer flow',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'paypal', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-005',
    query: 'Credit card bill payment rewards cashback settlement',
    intent: 'flow',
    split: 'dev',
    description: 'Credit card statement payment with cashback rewards claim',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cred', flowSlug: 'redeeming', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-006',
    query: 'Interactive math lesson learning problem step solving',
    intent: 'flow',
    split: 'dev',
    description: 'Interactive STEM problem quiz flow with immediate feedback',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'completing-a-lesson-math', grade: 2 },
      { appSlug: 'brilliant', flowSlug: 'completing-the-first-lesson', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-007',
    query: 'Project issue creation task backlog tracking kanban',
    intent: 'flow',
    split: 'dev',
    description: 'New ticket/issue creation modal with fields and assignment',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'linear', flowSlug: 'moving-an-issue-to-a-project', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-008',
    query: 'Audio fingerprinting music track identification listening',
    intent: 'flow',
    split: 'dev',
    description: 'One-tap ambient audio recognition to track detail result',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'listening-to-audio', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-009',
    query: 'Fashion ecommerce shopping product bag checkout order',
    intent: 'flow',
    split: 'dev',
    description: 'Retail apparel product selection to cart checkout',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'adding-to-cart-bag', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'product-detail', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-010',
    query: 'Destructive account deletion permanently remove profile',
    intent: 'flow',
    split: 'dev',
    description: 'Account closure flow with security confirmation and data deletion warning',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'deleting-account', grade: 2 },
      { appSlug: 'dave', flowSlug: 'deleting-removing', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'deleting-deactivating-account', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-011',
    query: 'First-time user onboarding welcome walk-through tour',
    intent: 'flow',
    split: 'dev',
    description: 'Welcome carousel introducing core product benefits',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'cred', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'revolut', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-012',
    query: 'Creating a social media visual lifestyle photo post',
    intent: 'flow',
    split: 'dev',
    description: 'Media upload, captioning and tag placement for content posting',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'lemon8', flowSlug: 'creating-a-post', grade: 2 },
      { appSlug: 'lemon8', flowSlug: 'commenting-on-a-post', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-013',
    query: 'Connecting external bank account via Plaid aggregation',
    intent: 'flow',
    split: 'dev',
    description: 'Open banking credential linkage and verification',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brex', flowSlug: 'connecting-a-bank-account', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'connecting-linking', grade: 1 },
      { appSlug: 'paypal', flowSlug: 'connecting-linking', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-014',
    query: 'Automated robo-advisor recurring investment deposit schedule',
    intent: 'flow',
    split: 'dev',
    description: 'Setting up recurring automated portfolio deposits',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'wealthfront', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'wealthfront', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-015',
    query: 'Video screen recording annotation and review comments',
    intent: 'flow',
    split: 'dev',
    description: 'Async video message review, timestamped commenting and replies',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'loom', flowSlug: 'commenting-on-the-video', grade: 2 },
      { appSlug: 'loom', flowSlug: 'replying-to-thread', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-016',
    query: 'Collaborative canvas whiteboard sticky notes ideation',
    intent: 'flow',
    split: 'dev',
    description: 'Adding content, shapes and stamps to collaborative canvas',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 2 },
      { appSlug: 'figma', flowSlug: 'browse-figjam-resources', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-017',
    query: 'Cinema movie ticket seat selection and theater booking',
    intent: 'flow',
    split: 'dev',
    description: 'Indie cinema screening lookup, venue selection and pass redemption',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'mubi-go', flowSlug: 'home', grade: 2 },
      { appSlug: 'mubi-go', flowSlug: 'participating-theaters', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-018',
    query: 'Relational database table column schema field configuration',
    intent: 'flow',
    split: 'dev',
    description: 'Adding typed fields, formula, and options to relational grid',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'airtable', flowSlug: 'fields-tutorial', grade: 2 },
      { appSlug: 'airtable', flowSlug: 'creating-a-new-record', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-019',
    query: 'AI conversational assistant chat financial advice checkup',
    intent: 'flow',
    split: 'dev',
    description: 'Chat-based AI assistant advising on budgeting and saving',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'cleo', flowSlug: 'chatting-sending-messages', grade: 2 },
      { appSlug: 'cleo', flowSlug: 'logging-tracking', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-020',
    query: 'Flight tracking live itinerary delay notifications setup',
    intent: 'flow',
    split: 'dev',
    description: 'Searching flight number, tracking itinerary and departure gate',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'flighty', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'flighty', flowSlug: 'editing-profile', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-021',
    query: 'Card contactless payment NFC Apple Pay provisioning',
    intent: 'flow',
    split: 'dev',
    description: 'Adding debit or credit card to digital wallet NFC passes',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'apple-wallet', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'apple-wallet', flowSlug: 'logging-tracking', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  // Flow queries (Test split)
  {
    id: 'UXB-022',
    query: 'Corporate card spend limit increase request workflow',
    intent: 'flow',
    split: 'test',
    description: 'Employee policy limit increase submission with justification',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brex', flowSlug: 'requesting-new-spend-limit', grade: 2 },
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-023',
    query: 'Music streaming playlist curation annual listening review wrapped',
    intent: 'flow',
    split: 'test',
    description: 'Year in review listening habits recap carousel',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'spotify', flowSlug: 'wrapped', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-024',
    query: 'Document rich text formatting typographic styles heading layout',
    intent: 'flow',
    split: 'test',
    description: 'Document editor typographic styling and text hierarchy',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'craft', flowSlug: 'editing-text-formatting-styles', grade: 2 },
      { appSlug: 'linear', flowSlug: 'editing-text-formatting', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-025',
    query: 'Design review canvas pin comment thread feedback',
    intent: 'flow',
    split: 'test',
    description: 'Placing canvas-specific design review comments and replies',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'figma', flowSlug: 'adding-a-comment', grade: 2 },
      { appSlug: 'figma', flowSlug: 'reacting-to-a-comment', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-026',
    query: 'Emergency paycheck cash advance overdraft protection loan flow',
    intent: 'flow',
    split: 'test',
    description: 'Requesting small cash advance against upcoming direct deposit',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'dave', flowSlug: 'adding-creating', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-027',
    query: 'Web browser mobile AI browse summarizing search query flow',
    intent: 'flow',
    split: 'test',
    description: 'AI-assisted web browsing search and synthesis flow',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'arc-search', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'arc-search', flowSlug: 'enabling-disabling', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-028',
    query: 'STEM data science course module interactive quiz progression',
    intent: 'flow',
    split: 'test',
    description: 'Progressing through interactive computer science lesson',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'completing-a-lesson-data', grade: 2 },
      { appSlug: 'brilliant', flowSlug: 'completing-a-lesson-math', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-029',
    query: 'Online clothing store size guide measurement selector',
    intent: 'flow',
    split: 'test',
    description: 'Checking body measurements against apparel fit chart',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'size-guide', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'product-detail', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-030',
    query: 'Crypto token swap decentralized exchange conversion flow',
    intent: 'flow',
    split: 'test',
    description: 'Exchanging crypto assets with slippage and network fee approval',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'coinbase-wallet', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'purchasing-ordering', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-031',
    query: 'Project ticket triage backlog filtering by status and assignee',
    intent: 'flow',
    split: 'test',
    description: 'Issue tracker inbox filter and prioritization workflow',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'linear', flowSlug: 'filtering-inbox', grade: 2 },
      { appSlug: 'linear', flowSlug: 'inbox', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-032',
    query: 'Peer payment split restaurant bill request money friends',
    intent: 'flow',
    split: 'test',
    description: 'Splitting group tab and requesting shared charges',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'paypal', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-033',
    query: 'Team member workspace collaborator invite permissions workflow',
    intent: 'flow',
    split: 'test',
    description: 'Inviting colleagues via email and configuring editor roles',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'airtable', flowSlug: 'managing-collaborators', grade: 2 },
      { appSlug: 'craft', flowSlug: 'share-export', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-034',
    query: 'Loyalty reward scratch card coins redemption voucher flow',
    intent: 'flow',
    split: 'test',
    description: 'Unlocking gamified shopping reward perks and cashback',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'cred', flowSlug: 'redeeming', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'redeeming', grade: 2 }
    ],
    secondAnnotatorLabel: 'flow'
  },
  {
    id: 'UXB-035',
    query: 'Family group shared budget debit allowance card setup',
    intent: 'flow',
    split: 'test',
    description: 'Setting up family banking account with parental controls',
    expectedPrimaryRoutes: ['flow'],
    targets: [
      { appSlug: 'family', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'cash-app', flowSlug: 'managing-accounts', grade: 1 }
    ],
    secondAnnotatorLabel: 'flow'
  },

  // ==========================================
  // BUCKET 2: SITUATIONAL QUERIES (35 queries)
  // Target: Contextual edge cases, error states, whereToUse / whereNotToUse
  // ==========================================
  {
    id: 'UXB-036',
    query: 'When to avoid conversational chatbot UI for high-stakes banking transactions',
    intent: 'situational',
    split: 'dev',
    description: 'Anti-pattern guidelines on avoiding chatbot interfaces for complex wire transfers',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cleo', flowSlug: 'chatting-sending-messages', grade: 2, notes: 'Direct whereNotToUse advice on conversational UI vs structured forms' },
      { appSlug: 'dave', flowSlug: 'chatting-sending-messages', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-037',
    query: 'How to handle high cognitive load in multi-account balance overviews',
    intent: 'situational',
    split: 'dev',
    description: 'Information architecture rationale for consolidating fragmented account balances',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2, notes: 'Multi-account financial dashboard UX rationale' },
      { appSlug: 'wealthfront', flowSlug: 'logging-tracking', grade: 2 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-038',
    query: 'Irreversible backend transaction confirmation blocking modal pattern',
    intent: 'situational',
    split: 'dev',
    description: 'Full-screen non-dismissible state for backend processing',
    expectedPrimaryRoutes: ['situational', 'component'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2, notes: 'Explicitly labeled for irreversible backend commits' },
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-039',
    query: 'Where to avoid using swipe-to-confirm in non-destructive flows',
    intent: 'situational',
    split: 'dev',
    description: 'Guidance on when swipe-to-confirm adds unnecessary friction',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-040',
    query: 'When to display full-page interstitial versus inline permission priming',
    intent: 'situational',
    split: 'dev',
    description: 'Design trade-offs between modal push permission vs contextual inline trigger',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 1 },
      { appSlug: 'arc-search', flowSlug: 'enabling-disabling', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-041',
    query: 'Recovering user trust after failed identity document camera scan',
    intent: 'situational',
    split: 'dev',
    description: 'Graceful degradation fallback when camera OCR fails glare detection',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'post-onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-042',
    query: 'Avoiding banner blindness in transactional receipt screens',
    intent: 'situational',
    split: 'dev',
    description: 'Positioning post-transaction upsells without masking payment receipt details',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-043',
    query: 'When to require two-step confirmation for destructive workspace entity deletion',
    intent: 'situational',
    split: 'dev',
    description: 'Safeguards against accidental ticket or record destruction in productivity apps',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'airtable', flowSlug: 'fields-tutorial', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-044',
    query: 'Managing user anxiety during multi-minute asynchronous banking verification',
    intent: 'situational',
    split: 'dev',
    description: 'Progress state UX during backend compliance latency',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'brex', flowSlug: 'connecting-a-bank-account', grade: 1 },
      { appSlug: 'oportun', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-045',
    query: 'Where not to use gamified scratch cards in financial apps',
    intent: 'situational',
    split: 'dev',
    description: 'Compliance and brand risk guidelines for gamified cashbacks',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cred', flowSlug: 'redeeming', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'redeeming', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-046',
    query: 'Designing for low-bandwidth offline connectivity during audio identification',
    intent: 'situational',
    split: 'dev',
    description: 'Caching audio query and syncing offline recognitions',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-047',
    query: 'When to enforce biometric re-authentication for sensitive wallet actions',
    intent: 'situational',
    split: 'dev',
    description: 'Security friction timing: viewing private seed vs signing routine transaction',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'coinbase-wallet', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'apple-wallet', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-048',
    query: 'Avoiding choice paralysis in multi-tiered subscription pricing tables',
    intent: 'situational',
    split: 'dev',
    description: 'Highlighting recommended tier without obfuscating monthly vs annual costs',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'subscribing-to-brilliant', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'manage-subscription', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-049',
    query: 'When to use grouped stacked-lists instead of grid tiles for mobile settings',
    intent: 'situational',
    split: 'dev',
    description: 'Information hierarchy guidance for high-density mobile preferences',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'venmo', flowSlug: 'editing-profile', grade: 2 },
      { appSlug: 'cred', flowSlug: 'editing-profile', grade: 2 },
      { appSlug: 'dave', flowSlug: 'editing-profile', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-050',
    query: 'Preventing user drop-off in multi-step loan underwriting questionnaire',
    intent: 'situational',
    split: 'dev',
    description: 'Chunking long regulatory questionnaires with micro-progress indicators',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'brex', flowSlug: 'requesting-new-spend-limit', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-051',
    query: 'How to design soft paywalls that preserve content exploration before login',
    intent: 'situational',
    split: 'dev',
    description: 'Allowing users to preview curated cinema or education catalog before registering',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'mubi-go', flowSlug: 'home', grade: 2 },
      { appSlug: 'brilliant', flowSlug: 'onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-052',
    query: 'Where to avoid using modal bottom sheets for complex multi-input forms',
    intent: 'situational',
    split: 'dev',
    description: 'Keyboard dismissal and viewport cramping anti-patterns on mobile sheets',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-053',
    query: 'Preserving user input context during unexpected session expiration',
    intent: 'situational',
    split: 'dev',
    description: 'Draft preservation and re-authentication overlay without wiping form state',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'craft', flowSlug: 'editing-text-formatting-styles', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-054',
    query: 'Handling out-of-stock variations gracefully in retail product detail pages',
    intent: 'situational',
    split: 'dev',
    description: 'Disabling unavailable size swatches while offering back-in-stock notifications',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'product-detail', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'size-guide', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-055',
    query: 'When to prompt users for app store rating without disrupting critical tasks',
    intent: 'situational',
    split: 'dev',
    description: 'Triggering rating dialogues only following celebratory positive milestone',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'dave', flowSlug: 'giving-feedbacks', grade: 2 },
      { appSlug: 'brilliant', flowSlug: 'giving-feedbacks', grade: 1 },
      { appSlug: 'cleo', flowSlug: 'reviewing-rating', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  // Situational queries
  {
    id: 'UXB-056',
    query: 'Where not to use push notification priming during cold app launch',
    intent: 'situational',
    split: 'dev',
    description: 'Cold launch system modal spam vs value-triggered priming',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cred', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-057',
    query: 'When to display QR code camera viewfinder directly on home tab',
    intent: 'situational',
    split: 'test',
    description: 'Camera as primary affordance in offline-to-online peer retail payments',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-058',
    query: 'How to communicate slippage risk during volatile decentralized crypto swaps',
    intent: 'situational',
    split: 'test',
    description: 'Visual warnings for price impact exceeding normal thresholds',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'coinbase-wallet', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'purchasing-ordering', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-059',
    query: 'Avoiding accidental financial transfers with distinct confirmation friction',
    intent: 'situational',
    split: 'test',
    description: 'Review step differentiating instant debit versus standard ACH transfer',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'paypal', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-060',
    query: 'When to use optimistic UI updates in collaborative document editing',
    intent: 'situational',
    split: 'test',
    description: 'Instant local text render vs server acknowledgement in canvas comments',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'craft', flowSlug: 'editing-text-formatting-styles', grade: 2 },
      { appSlug: 'figma', flowSlug: 'adding-a-comment', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-061',
    query: 'Where not to use full-screen takeover modals in search discovery',
    intent: 'situational',
    split: 'test',
    description: 'Preserving search query context and instant filter refinement',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'arc-search', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-062',
    query: 'Minimizing churn during mandatory biometric KYC re-verification requests',
    intent: 'situational',
    split: 'test',
    description: 'Explaining regulatory compliance rationale to prevent user panic',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-063',
    query: 'How to handle empty search states with proactive recommendation chips',
    intent: 'situational',
    split: 'test',
    description: 'Guiding zero-result states with trending searches and category chips',
    expectedPrimaryRoutes: ['situational', 'component'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'searching-h-m-text-input', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-064',
    query: 'When to separate billing address from shipping address in checkout',
    intent: 'situational',
    split: 'test',
    description: 'Defaulting to same address checkbox to minimize cart drop-off',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'adding-to-cart-bag', grade: 2 },
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-065',
    query: 'Tone and copy guidelines for debt collection payment reminders',
    intent: 'situational',
    split: 'test',
    description: 'Empathetic and constructive tonality to encourage user engagement without shame',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cleo', flowSlug: 'chatting-sending-messages', grade: 2 },
      { appSlug: 'dave', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-066',
    query: 'When to enforce password complexity rules inline versus on submit',
    intent: 'situational',
    split: 'test',
    description: 'Real-time password requirement checklist validation',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'creating-account', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'creating-an-account-h-and-m', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-067',
    query: 'Where not to use infinite scroll in data-dense table exploration',
    intent: 'situational',
    split: 'test',
    description: 'Pagination and fixed footer accessibility vs infinite scrolling',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'airtable', flowSlug: 'fields-tutorial', grade: 2 },
      { appSlug: 'linear', flowSlug: 'filtering-inbox', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-068',
    query: 'Handling camera permission rejection gracefully during barcode scanning',
    intent: 'situational',
    split: 'test',
    description: 'Displaying manual entry fallback when camera permission is denied',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-069',
    query: 'When to use swipe gestures for triage vs explicit icon buttons',
    intent: 'situational',
    split: 'test',
    description: 'Swipe discoverability vs explicit action buttons on desktop and mobile',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'linear', flowSlug: 'inbox', grade: 2 },
      { appSlug: 'loom', flowSlug: 'replying-to-thread', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },
  {
    id: 'UXB-070',
    query: 'Designing streak protection freeze UX to prevent user demoralization',
    intent: 'situational',
    split: 'test',
    description: 'Offering streak freeze repair mechanics following missed learning session',
    expectedPrimaryRoutes: ['situational'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'setting-a-streak-goal', grade: 2 },
      { appSlug: 'brilliant', flowSlug: 'completing-the-first-lesson', grade: 1 }
    ],
    secondAnnotatorLabel: 'situational'
  },

  // ==========================================
  // BUCKET 3: COMPONENT QUERIES (30 queries)
  // Target: Specific UI widgets, canonical components
  // ==========================================
  {
    id: 'UXB-071',
    query: 'Segmented Control toggle for monthly versus annual billing',
    intent: 'component',
    split: 'dev',
    description: 'Two-state or three-state Segmented Control component in pricing UI',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'subscribing-to-brilliant', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'manage-subscription', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-072',
    query: 'Bottom Sheet modal for bank account selection list',
    intent: 'component',
    split: 'dev',
    description: 'Draggable half-sheet modal presenting selectable payment sources',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'google-pay', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-073',
    query: 'OTP 6-digit verification Text field with automatic SMS autofill',
    intent: 'component',
    split: 'dev',
    description: 'Segmented individual digit input boxes for one-time passcode',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'cred', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-074',
    query: 'Progress Indicator multi-step stepper header for identity verification',
    intent: 'component',
    split: 'dev',
    description: 'Segmented top progress bar showing current stage in KYC',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 2 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-075',
    query: 'Interactive Slider for loan repayment term duration calculation',
    intent: 'component',
    split: 'dev',
    description: 'Draggable slider component dynamically recalculating monthly installments',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'dave', flowSlug: 'adding-creating', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-076',
    query: 'Filter Chip bar for apparel catalog category refinement',
    intent: 'component',
    split: 'dev',
    description: 'Horizontally scrollable chips for multi-select product filtering',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'product-filter', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'view-products-in-h-m', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-077',
    query: 'Floating Action Button FAB for quick issue logging',
    intent: 'component',
    split: 'dev',
    description: 'Persistent circular trigger button initiating creation modal',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-a-card', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-078',
    query: 'Custom numeric Keypad keypad for entering dollar transfer amounts',
    intent: 'component',
    split: 'dev',
    description: 'Large in-app numpad with currency decimal and clear keys',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-079',
    query: 'Toast notification snackbar for successful file upload confirmation',
    intent: 'component',
    split: 'dev',
    description: 'Transient non-blocking status pill confirming background action',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 2 },
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-080',
    query: 'Stacked List grouped settings navigation with chevrons',
    intent: 'component',
    split: 'dev',
    description: 'iOS-style grouped table view with trailingDisclosure chevrons',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'venmo', flowSlug: 'editing-profile', grade: 2 },
      { appSlug: 'cred', flowSlug: 'editing-profile', grade: 2 },
      { appSlug: 'loom', flowSlug: 'help-support', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-081',
    query: 'Avatar stack group presence indicator in collaborative canvas',
    intent: 'component',
    split: 'dev',
    description: 'Overlapping circular user profile pictures showing live active editors',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'figma', flowSlug: 'adding-a-comment', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-082',
    query: 'Accordion expandable disclosure panel for legal terms FAQ',
    intent: 'component',
    split: 'dev',
    description: 'Vertically collapsible section headers revealing explanatory copy',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'loom', flowSlug: 'terms-conditions', grade: 2 },
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-083',
    query: 'Carousel full-width hero banner with pagination dots',
    intent: 'component',
    split: 'dev',
    description: 'Swipeable horizontal card carousel with bottom page indicators',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'cred', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-084',
    query: 'Date Picker calendar modal for receipt expense date selection',
    intent: 'component',
    split: 'dev',
    description: 'Interactive calendar grid selecting day, month and fiscal year',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 2 },
      { appSlug: 'linear', flowSlug: 'adding-a-due-date', grade: 2 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-085',
    query: 'Switch toggle control for biometric Face ID authentication enablement',
    intent: 'component',
    split: 'dev',
    description: 'Binary toggle switch in account security settings',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'coinbase-wallet', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'arc-search', flowSlug: 'enabling-disabling', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-086',
    query: 'Empty State illustration with call to action button for empty inbox',
    intent: 'component',
    split: 'dev',
    description: 'Zero-data screen state with inviting artwork and primary action trigger',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'inbox', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-a-card', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-087',
    query: 'Color Picker palette swatch selector for canvas drawing',
    intent: 'component',
    split: 'dev',
    description: 'Circular color preset swatches for pen or highlighter tool',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'craft', flowSlug: 'editing-a-document-color', grade: 2 },
      { appSlug: 'figma', flowSlug: 'browse-figjam-resources', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-088',
    query: 'Camera viewfinder overlay frame for document and selfie scanning',
    intent: 'component',
    split: 'dev',
    description: 'Live camera stream frame with oval face or rectangular card guide',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'post-onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  // Component queries (Test split)
  {
    id: 'UXB-089',
    query: 'Command Palette quick switcher keyboard shortcut dialog',
    intent: 'component',
    split: 'test',
    description: 'Centrally anchored Cmd+K modal for rapid project search and commands',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-a-smart-link', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-090',
    query: 'Top Navigation Bar with back button and contextual overflow menu',
    intent: 'component',
    split: 'test',
    description: 'Standard mobile top app bar with navigation icon and title',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-091',
    query: 'Checkbox list for multi-select task resolution checklist',
    intent: 'component',
    split: 'test',
    description: 'Square interactive checkboxes in issue description or task list',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'adding-a-list-checkbox', grade: 2 },
      { appSlug: 'craft', flowSlug: 'editing-text-formatting-styles', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-092',
    query: 'Badge count notification pill on bottom tab bar icon',
    intent: 'component',
    split: 'test',
    description: 'Red or colored numerical count pill indicating unread activity',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'inbox', grade: 2 },
      { appSlug: 'lemon8', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-093',
    query: 'Search Bar with clear text button and voice search microphone icon',
    intent: 'component',
    split: 'test',
    description: 'Rounded search input field with leading search icon and trailing cancel',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'searching-h-m-text-input', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-094',
    query: 'Bottom Navigation Tab Bar with active state tinted icons',
    intent: 'component',
    split: 'test',
    description: 'Five-tab persistent bottom navigation bar on mobile',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'dashboard', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'dashboard', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-095',
    query: 'Swipe-to-Action table row reveal delete and archive buttons',
    intent: 'component',
    split: 'test',
    description: 'Horizontal cell drag revealing contextual actions underneath',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'inbox', grade: 2 },
      { appSlug: 'flighty', flowSlug: 'searching-finding', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-096',
    query: 'Rating Control star rating dialogue with optional comment field',
    intent: 'component',
    split: 'test',
    description: 'Five-star interactive rating widget for feedback submission',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'dave', flowSlug: 'giving-feedbacks', grade: 2 },
      { appSlug: 'cleo', flowSlug: 'reviewing-rating', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-097',
    query: 'Context Menu popup on long press for ticket item',
    intent: 'component',
    split: 'test',
    description: 'Contextual floating action menu anchored to targeted item',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'linear', flowSlug: 'inbox', grade: 2 },
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-098',
    query: 'Skeleton Screen shimmer loading placeholder cards',
    intent: 'component',
    split: 'test',
    description: 'Animated gray wireframe placeholders simulating card shapes during fetch',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-099',
    query: 'Audio waveform scrubbing visualizer bar for track playback',
    intent: 'component',
    split: 'test',
    description: 'Interactive amplitude waveform representing sound track preview',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'shazam', flowSlug: 'listening-to-audio', grade: 2 },
      { appSlug: 'loom', flowSlug: 'commenting-on-the-video', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },
  {
    id: 'UXB-100',
    query: 'Video Player floating picture-in-picture PiP thumbnail',
    intent: 'component',
    split: 'test',
    description: 'Minimized video playback container overlaying active UI',
    expectedPrimaryRoutes: ['component'],
    targets: [
      { appSlug: 'loom', flowSlug: 'commenting-on-the-video', grade: 2 },
      { appSlug: 'mubi-go', flowSlug: 'home', grade: 1 }
    ],
    secondAnnotatorLabel: 'component'
  },

  // ==========================================
  // BUCKET 4: COMPARE QUERIES (28 queries)
  // Target: Explicit competitor rival comparison, cross-app patterns
  // ==========================================
  {
    id: 'UXB-101',
    query: 'Compare money transfer flow between Cash App and Venmo',
    intent: 'compare',
    split: 'dev',
    description: 'Comparing P2P transfer steps between Cash App and Venmo',
    expectedPrimaryRoutes: ['compare', 'flow'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'paypal', flowSlug: 'transferring-money', grade: 1 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-102',
    query: 'Difference in KYC identity verification in Revolut versus Coinbase Wallet',
    intent: 'compare',
    split: 'dev',
    description: 'Contrasting biometric identity onboarding in neobanking vs crypto wallet',
    expectedPrimaryRoutes: ['compare', 'flow'],
    targets: [
      { appSlug: 'revolut', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'post-onboarding', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 1 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-103',
    query: 'How does Linear issue creation compare to Airtable record creation',
    intent: 'compare',
    split: 'dev',
    description: 'Fast shortcut developer ticket creation vs flexible relational field input',
    expectedPrimaryRoutes: ['compare', 'flow'],
    targets: [
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 },
      { appSlug: 'airtable', flowSlug: 'creating-a-new-record', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-104',
    query: 'Compare canvas commenting in Figma versus Loom video thread comments',
    intent: 'compare',
    split: 'dev',
    description: 'Spatial 2D coordinate pinned comments vs timestamped asynchronous video comments',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'figma', flowSlug: 'adding-a-comment', grade: 2 },
      { appSlug: 'loom', flowSlug: 'commenting-on-the-video', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-105',
    query: 'Cleo versus Dave overdraft protection and financial coaching chat',
    intent: 'compare',
    split: 'dev',
    description: 'Sassy AI agent chatbot interface vs structured micro-loan advances',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'cleo', flowSlug: 'chatting-sending-messages', grade: 2 },
      { appSlug: 'dave', flowSlug: 'adding-creating', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-106',
    query: 'Compare reward redemption mechanics in CRED versus Google Pay',
    intent: 'compare',
    split: 'dev',
    description: 'Gamified coins spin wheel vs direct payment cashback scratch cards',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'cred', flowSlug: 'redeeming', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'redeeming', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-107',
    query: 'Craft whiteboard tools versus Figma FigJam canvas stickies',
    intent: 'compare',
    split: 'dev',
    description: 'Structured document embedded whiteboard vs standalone vector collaboration canvas',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 2 },
      { appSlug: 'figma', flowSlug: 'browse-figjam-resources', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-108',
    query: 'Compare search discovery experience in Shazam versus Spotify',
    intent: 'compare',
    split: 'dev',
    description: 'Single-button ambient audio query vs faceted artist and playlist catalog search',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'home', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-109',
    query: 'PayPal vs Google Pay bank account and debit card linking flow',
    intent: 'compare',
    split: 'dev',
    description: 'Legacy web redirect card provisioning vs native OS wallet NFC linking',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'paypal', flowSlug: 'connecting-linking', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'connecting-linking', grade: 2 },
      { appSlug: 'apple-wallet', flowSlug: 'setting-up', grade: 1 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-110',
    query: 'Compare corporate reimbursement submission in Brex versus personal expense tracking in Cleo',
    intent: 'compare',
    split: 'dev',
    description: 'Receipt OCR and audit policy approval vs conversational expense aggregation',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'brex', flowSlug: 'request-reimbursement', grade: 2 },
      { appSlug: 'cleo', flowSlug: 'logging-tracking', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-111',
    query: 'Brilliant interactive quizzes versus Spotify onboarding preference selection',
    intent: 'compare',
    split: 'dev',
    description: 'Active problem solving evaluation vs passive taste profiling chips',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'completing-the-first-lesson', grade: 2 },
      { appSlug: 'spotify', flowSlug: 'onboarding', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-112',
    query: 'Compare account deletion friction between Brilliant and Dave',
    intent: 'compare',
    split: 'dev',
    description: 'Self-serve subscription pause retention offer vs regulatory banking account closure',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'deleting-account', grade: 2 },
      { appSlug: 'dave', flowSlug: 'deleting-removing', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-113',
    query: 'Arc Search browse for me AI synthesis versus Shazam quick search',
    intent: 'compare',
    split: 'dev',
    description: 'Generative multi-source web page compilation vs direct single-entity lookup',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'arc-search', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'searching-finding', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-114',
    query: 'Wealthfront automated portfolio investing versus Coinbase crypto self-custody',
    intent: 'compare',
    split: 'dev',
    description: 'Hands-off diversified index rebalancing vs active self-custody key management',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'wealthfront', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'coinbase-wallet', flowSlug: 'setting-up', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  // Compare queries (Test split)
  {
    id: 'UXB-115',
    query: 'Compare peer to peer payment request flow across Cash App, Venmo and PayPal',
    intent: 'compare',
    split: 'dev',
    description: 'Comparing cash request notification and claim friction across three major P2P apps',
    expectedPrimaryRoutes: ['compare', 'flow'],
    targets: [
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'paypal', flowSlug: 'transferring-money', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-116',
    query: 'Differences in biometric login between Apple Wallet and Google Pay',
    intent: 'compare',
    split: 'dev',
    description: 'Native FaceID device authorization vs cross-platform biometric unlock',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'apple-wallet', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'transferring-money', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-117',
    query: 'Contrast Lemon8 lifestyle feed creation with Figma canvas asset sharing',
    intent: 'compare',
    split: 'dev',
    description: 'Mobile social consumer photo formatting vs pro-tier design system sharing',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'lemon8', flowSlug: 'creating-a-post', grade: 2 },
      { appSlug: 'figma', flowSlug: 'browse-figjam-resources', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-118',
    query: 'Compare document hierarchy navigation in Craft versus Linear project views',
    intent: 'compare',
    split: 'test',
    description: 'Nested document pages and folders vs issue cycles, projects and teams',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'craft', flowSlug: 'adding-content-in-a-whiteboard', grade: 2 },
      { appSlug: 'linear', flowSlug: 'moving-an-issue-to-a-project', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-119',
    query: 'Dave salary advance qualification versus Oportun personal loan onboarding',
    intent: 'compare',
    split: 'test',
    description: 'Direct deposit checking account link vs formal credit installment application',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'dave', flowSlug: 'setting-up', grade: 2 },
      { appSlug: 'oportun', flowSlug: 'onboarding', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-120',
    query: 'Compare flight status card details in Flighty versus Apple Wallet travel passes',
    intent: 'compare',
    split: 'test',
    description: 'Live aircraft radar telemetry timeline vs boarding pass QR bar code presentation',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'flighty', flowSlug: 'searching-finding', grade: 2 },
      { appSlug: 'apple-wallet', flowSlug: 'logging-tracking', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-121',
    query: 'Retail apparel product filter UX: H&M versus general ecommerce bag checkout',
    intent: 'compare',
    split: 'test',
    description: 'Faceted size and color grid filtering vs immediate one-click checkout',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'h-and-m', flowSlug: 'product-filter', grade: 2 },
      { appSlug: 'h-and-m', flowSlug: 'adding-to-cart-bag', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-122',
    query: 'MUBI GO cinema pass booking versus typical retail event ticket reserving',
    intent: 'compare',
    split: 'test',
    description: 'Weekly curated cinema ticket voucher vs standard seat map reservation',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'mubi-go', flowSlug: 'home', grade: 2 },
      { appSlug: 'google-pay', flowSlug: 'booking-reserving', grade: 1 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-123',
    query: 'Compare asynchronous video review in Loom versus text issue comments in Linear',
    intent: 'compare',
    split: 'test',
    description: 'Rich audiovisual context with face bubble vs markdown text with code snippets',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'loom', flowSlug: 'commenting-on-the-video', grade: 2 },
      { appSlug: 'linear', flowSlug: 'creating-an-issue', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-124',
    query: 'Airtable formula and relational links versus Linear custom label workflows',
    intent: 'compare',
    split: 'test',
    description: 'Full spreadsheet relational lookup computation vs lightweight workflow tagging',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'airtable', flowSlug: 'fields-tutorial', grade: 2 },
      { appSlug: 'linear', flowSlug: 'adding-labels', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-125',
    query: 'Compare onboarding questionnaire friction: Brilliant vs Revolut',
    intent: 'compare',
    split: 'test',
    description: 'Diagnostic skill assessment questions vs legal KYC tax residency compliance',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'brilliant', flowSlug: 'onboarding', grade: 2 },
      { appSlug: 'revolut', flowSlug: 'onboarding', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-126',
    query: 'Compare Venmo social payment feed privacy controls versus Cash App anonymous cashtags',
    intent: 'compare',
    split: 'test',
    description: 'Public transaction feed with emoji comments vs private transaction cashtag lookups',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'venmo', flowSlug: 'transferring-money', grade: 2 },
      { appSlug: 'cash-app', flowSlug: 'transferring-money', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-127',
    query: 'Spotify music audio playback player versus Shazam track preview player',
    intent: 'compare',
    split: 'test',
    description: 'Full playback queue with lyrics and crossfade vs 30-second snippet preview',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'spotify', flowSlug: 'home', grade: 2 },
      { appSlug: 'shazam', flowSlug: 'listening-to-audio', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },
  {
    id: 'UXB-128',
    query: 'Compare card spend policies in Brex versus credit card statements in CRED',
    intent: 'compare',
    split: 'test',
    description: 'Pre-spend limits and manager approval vs post-statement bill rewards settlement',
    expectedPrimaryRoutes: ['compare'],
    targets: [
      { appSlug: 'brex', flowSlug: 'requesting-new-spend-limit', grade: 2 },
      { appSlug: 'cred', flowSlug: 'transferring-money', grade: 2 }
    ],
    secondAnnotatorLabel: 'compare'
  },

  // ==========================================
  // BUCKET 5: OUT-OF-DOMAIN QUERIES (22 queries, ~14.7%)
  // Target: Testing Calibrated Abstention (Section 6.8 & Gate 2)
  // Clean abstention required: "No verified pattern in library matching criteria."
  // ==========================================
  {
    id: 'UXB-129',
    query: 'How to calculate gross domestic product in macroeconomics',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'General academic macroeconomic economics theory',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-130',
    query: 'Best recipe for homemade Italian sourdough pizza dough',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Culinary recipe and food preparation query',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-131',
    query: 'Python script to train convolutional neural network on MNIST',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Machine learning backend code without UI context',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-132',
    query: 'What is the speed of light in vacuum in meters per second',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Physics factual constant inquiry',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-133',
    query: 'Troubleshooting BMW 3 Series engine oil pressure sensor failure',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Automotive mechanical repair instructions',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-134',
    query: 'History of the Peloponnesian War between Athens and Sparta',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Ancient Greek history question',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-135',
    query: 'Kubernetes ingress controller configuration YAML for AWS EKS',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'DevOps cloud infrastructure orchestration config',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-136',
    query: 'Symptoms and clinical diagnosis of acute appendicitis',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Medical health diagnosis advice',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-137',
    query: 'Stock market price analysis for Tesla TSLA earnings call',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Financial equity speculation and stock market news',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-138',
    query: 'How to install water heater plumbing copper pipe fittings',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Home improvement plumbing guide',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-139',
    query: 'Rules of competitive curling winter olympics broom sweeping',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Sports rules inquiry',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-140',
    query: 'C++ memory leak detection using Valgrind on Linux',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Systems programming debugging query',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-141',
    query: 'Weather forecast for Tokyo Japan next weekend',
    intent: 'out_of_domain',
    split: 'dev',
    description: 'Meteorological live weather query',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  // Out-of-Domain queries (Test split)
  {
    id: 'UXB-142',
    query: 'How to grow organic tomatoes in backyard raised garden bed',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Gardening horticulture agriculture advice',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-143',
    query: 'Chemical synthesis route for ibuprofen from isobutylbenzene',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Organic chemistry synthesis mechanism',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-144',
    query: 'Guitar chord progression for jazz blues in B flat',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Music theory and instrumental chord chart',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-145',
    query: 'How to replace brake pads on a mountain bike hydraulic disc',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Bicycle mechanical maintenance guide',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-146',
    query: 'Translate hello good morning to Japanese kanji and hiragana',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Linguistic language translation inquiry',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-147',
    query: 'Quantum entanglement Einstein Podolsky Rosen paradox Bell inequality',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Theoretical quantum mechanics physics research',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-148',
    query: 'How to clean hardwood flooring without damaging polyurethane finish',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Household cleaning and maintenance advice',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-149',
    query: 'Rules and board layout for traditional Chinese chess Xiangqi',
    intent: 'out_of_domain',
    split: 'test',
    description: 'Board game rules and strategy',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  },
  {
    id: 'UXB-150',
    query: 'Tax deductible expenses for freelance contractors in Germany',
    intent: 'out_of_domain',
    split: 'test',
    description: 'International taxation and legal accounting advice',
    expectedPrimaryRoutes: ['flow'],
    targets: [],
    secondAnnotatorLabel: 'out_of_domain'
  }
];
