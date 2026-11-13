export const DEMO_BENCHMARK_REPORT = {
  "commonPatterns": [
    {
      "title": "Source Account / Funding Instrument Visibility Below Keypad",
      "evidence": "3/5 benchmark apps (60%) — Venmo, PayPal, Oportun — surface the funding source (bank/card) as a distinct tappable row with balance or account info near the amount field, while Google Pay and Cash App omit it since they're P2P transfers against a pre-linked wallet.",
      "confidence": "Medium — [60%]",
      "whyItMatters": "Showing the funding source with balance builds pre-transaction confidence and reduces failed payments due to insufficient funds — critical for bank-linked transfers rather than wallet-to-wallet P2P.",
      "exceptions": "Google Pay and Venmo skip this because the money moves from an already-funded wallet balance, not a bank account, so source selection is irrelevant to their flow.",
      "benchmarkExamples": [
        "PayPal 'From: CHIME Savings ••••'",
        "Oportun 'Bank of America $7,741.33 available'",
        "Axis Bank 'Send from account XXXX XXXX X0124 — Balance $5000'"
      ],
      "metrics": {
        "marketStandardParity": {
          "score": 7,
          "reasoning": "Axis correctly includes the source account card, matching Oportun/PayPal's pattern, but buries balance in a smaller font-weight pairing rather than making it the hero trust signal."
        },
        "provenPatternAdherence": {
          "score": 7,
          "reasoning": "The pattern of coupling account + balance in one card is proven in Oportun and PayPal; Axis replicates structure but loses the emphasis that balance should carry (used as risk mitigation cue)."
        },
        "informationDensityMatch": {
          "score": 6,
          "reasoning": "Axis's card is dense but correctly scoped — account number, bank logo, balance — comparable to Oportun's single-line reveal, avoiding PayPal's multi-tap drill-down."
        },
        "competitiveEdge": {
          "score": 6,
          "reasoning": "Keeping balance visible without a tap is a genuine edge over PayPal's chevron-gated detail, but the visual hierarchy doesn't yet let balance 'pop' as a safety signal the way Oportun's bold number does."
        }
      }
    },
    {
      "title": "Large, Centered Hero Amount Typography",
      "evidence": "5/5 benchmark apps (100%) place the amount as the single largest, most visually dominant element on screen, typically 48-96pt, centered or left-anchored with a cursor.",
      "confidence": "High — [100%]",
      "whyItMatters": "The amount is the single most consequential piece of data in a money-movement flow; oversized typography reduces misread risk and reinforces focus/intent before commitment.",
      "exceptions": "None — every benchmark, regardless of category (P2P, wallet, bank-link), treats the amount as the hero element.",
      "benchmarkExamples": [
        "Cash App: ~120pt edge-to-edge amount",
        "Google Pay: ~72pt amount with cursor",
        "Axis Bank: $100 in ~56pt centered"
      ],
      "metrics": {
        "marketStandardParity": {
          "score": 8,
          "reasoning": "Axis follows the convention well with a large centered number, though at a comparatively smaller scale than Cash App's maximal type treatment."
        },
        "provenPatternAdherence": {
          "score": 8,
          "reasoning": "Matches the universal 'amount as hero' convention seen across all 5 apps — a well-adopted pattern Axis has clearly inherited correctly."
        },
        "informationDensityMatch": {
          "score": 7,
          "reasoning": "Appropriately sparse above the fold, but Axis adds decorative dot-grid background noise that slightly dilutes the minimalism seen in Google Pay/Venmo's pure white canvas."
        },
        "competitiveEdge": {
          "score": 5,
          "reasoning": "Functionally on par but not differentiated — no live currency formatting cues (e.g., comma insertion, decimal handling) are demonstrated, an area where Cash App and Google Pay show more input sophistication."
        }
      }
    },
    {
      "title": "Primary CTA Pinned Directly Above or Integrated with Keypad",
      "evidence": "4/5 benchmark apps (80%) — Google Pay, Venmo, Cash App, Oportun — place the primary action (Pay/Next/Request/arrow) immediately above the numeric keypad for thumb-reachable, low-travel confirmation.",
      "confidence": "High — [80%]",
      "whyItMatters": "Placing the CTA adjacent to the input keypad minimizes thumb travel and preserves single-handed operability, a key mobile ergonomics principle for transactional flows.",
      "exceptions": "PayPal places CTA at the very bottom after a longer preset-amount + account-selection scroll, since its flow includes more decision steps before confirmation.",
      "benchmarkExamples": [
        "Venmo: Request/Pay buttons directly above keypad",
        "Cash App: black 'Pay' pill above nav, right under keypad",
        "Axis Bank: 'Proceed to Pay' sits above keypad, below account card"
      ],
      "metrics": {
        "marketStandardParity": {
          "score": 8,
          "reasoning": "Axis positions 'Proceed to Pay' consistent with the dominant convention of CTA-above-keypad, aligning with 4 of 5 benchmarks' ergonomic logic."
        },
        "provenPatternAdherence": {
          "score": 8,
          "reasoning": "Directly adopts the thumb-zone optimization pattern proven across Venmo, Cash App, and Oportun, reducing reach distance for one-handed use."
        },
        "informationDensityMatch": {
          "score": 7,
          "reasoning": "CTA sits in a clean dedicated zone without crowding, similar to Cash App's isolated pill, though the account-selector dropdown above it adds one more decision layer than most benchmarks allow before CTA."
        },
        "competitiveEdge": {
          "score": 6,
          "reasoning": "Solid parity, but the CTA isn't dynamically state-aware (e.g., disabled until valid amount, or showing amount inline like 'Pay $100') as seen in PayPal's 'Add $50.00 USD Now' which reinforces the exact transaction value in the button itself."
        }
      }
    }
  ],
  "designDifferences": [
    {
      "title": "No Live Amount-Editing Affordance (Cursor/Edit Icon)",
      "yourDesign": "Axis renders '$100' as static bold text with no visible cursor, caret, or edit icon — unclear if tapping the number re-opens edit mode or if only the keypad below drives changes.",
      "benchmark": "Google Pay and Venmo both show a blinking text cursor directly beside the digit; PayPal shows an explicit pencil icon beside the amount signaling 'tap to edit.'",
      "difference": "Axis lacks any micro-affordance (cursor, pencil, underline) indicating the amount field is live/editable versus decorative.",
      "potentialImpact": "Users accustomed to Google Pay/PayPal conventions may hesitate or mis-tap searching for an edit entry point, adding friction and cognitive load at the exact moment they need to correct an amount."
    },
    {
      "title": "No Preset / Quick-Amount Chips",
      "yourDesign": "Axis offers only raw keypad entry with no shortcut amount chips for common transfer values.",
      "benchmark": "PayPal shows $10/$25/$50/$100 preset chips directly under the hero amount, letting users skip manual entry entirely; Oportun and Cash App emphasize fast single-tap flows.",
      "difference": "Axis requires full manual keypad entry for every transaction, even for round, frequent amounts.",
      "potentialImpact": "Increases time-on-task and tap count for the majority of common low-friction transfers (e.g., repeat utility payments, round-number transfers), directly reducing transaction velocity compared to PayPal's one-tap preset model."
    },
    {
      "title": "Balance Displayed as Secondary Text, Not a Safety Cue",
      "yourDesign": "Axis shows '$5000' balance in a smaller, same-weight font tucked to the right of the account card — easy to visually skip.",
      "benchmark": "Oportun bolds '$7,741.33 available' directly under the amount in high-contrast, impossible-to-miss placement acting as a real-time overspend guardrail.",
      "difference": "Axis treats balance as metadata; Oportun treats it as an active risk-prevention signal co-located with the amount being typed.",
      "potentialImpact": "Without prominent balance pairing near the amount entry, users are more likely to attempt and then fail a transfer exceeding available funds, triggering late-stage error states rather than early prevention."
    },
    {
      "title": "Decorative Background Pattern Competing with Primary Content",
      "yourDesign": "Axis uses a subtle dot-grid texture across the purple header zone behind the amount and account elements.",
      "benchmark": "4/5 benchmarks (Google Pay, Venmo, Cash App solid color, PayPal) use flat, undecorated backgrounds to keep 100% visual attention on the numeral and CTA.",
      "difference": "Axis introduces non-functional visual texture in the highest-priority information zone of the screen.",
      "potentialImpact": "Marginally increases visual noise in the zone users scan first, running counter to the 'reduce everything to amount + account + CTA' minimalism that benchmark leaders enforce for transactional trust."
    }
  ],
  "opportunities": [
    {
      "title": "Introduce Quick-Amount Preset Chips Above the Keypad",
      "observation": "Axis forces 100% manual digit entry for every transaction regardless of frequency or amount regularity, unlike PayPal's preset-chip row that lets users bypass the keypad for common values.",
      "recommendation": "Add a horizontally scrollable row of 3-4 contextual preset chips (e.g., last transferred amount, $500, $1000, $5000) directly beneath the hero amount, mirroring PayPal's $10/$25/$50/$100 pattern but personalized using the user's transaction history for Axis's banking context.",
      "evidence": "1/5 benchmark apps (20%) — PayPal — currently implements this, representing a clear whitespace opportunity rather than a saturated convention.",
      "confidence": "Low — [20%]",
      "exceptions": "Pure P2P apps (Venmo, Cash App) intentionally skip presets since peer amounts are typically unique/negotiated, but for a bank-transfer use case like Axis, recurring round amounts are common (bill pay, savings sweep), making presets highly applicable.",
      "benchmarkExamples": [
        "PayPal preset chips: $10 / $25 / $50(selected) / $100"
      ]
    },
    {
      "title": "Elevate Balance Into a High-Contrast, Co-located Safety Cue",
      "observation": "Axis's '$5000' balance sits visually subordinate (smaller/lighter) next to the account row, disconnected from the amount the user is actively typing, increasing risk of attempted overdraft entry.",
      "recommendation": "Reposition available balance directly beneath or beside the hero amount in bold, higher-contrast type (similar scale-relationship to Oportun's '$7,741.33 available'), and optionally add real-time inline validation (e.g., amount turns red/shows warning if it exceeds balance) before the user reaches 'Proceed to Pay.'",
      "evidence": "1/5 benchmark apps (20%) — Oportun — implements this directly, but reflects an emerging best practice specifically relevant to bank-balance-aware transfers (not wallet apps).",
      "confidence": "Low — [20%]",
      "exceptions": "Wallet-based apps (Google Pay, Venmo, Cash App) don't need this since users aren't drawing against a disclosed bank balance in the same screen.",
      "benchmarkExamples": [
        "Oportun: bold available balance under amount with bank icon"
      ]
    },
    {
      "title": "Add Explicit Edit Affordance to the Hero Amount",
      "observation": "The static '$100' text gives no micro-signal (cursor, pencil icon, underline) that it is the live editable target, which could create first-time-user hesitation about where/how to correct the value.",
      "recommendation": "Add a blinking text cursor adjacent to the digits (Google Pay/Venmo pattern) or a pencil icon (PayPal pattern) directly next to the amount to make editability unambiguous, and ensure tap targets extend to the full numeral, not just the keypad.",
      "evidence": "4/5 benchmark apps (80%) — Google Pay, Venmo, PayPal, and implicitly Cash App via direct keypad-to-display binding — provide a clear visual signal of live-edit state.",
      "confidence": "High — [80%]",
      "exceptions": "Cash App relies on an oversized full-bleed number where the entire screen behaves as the editable canvas, so a cursor is less critical; still, intent is signaled via greyed trailing zero.",
      "benchmarkExamples": [
        "Google Pay blinking cursor beside '0'",
        "PayPal pencil icon beside '$50'",
        "Cash App greyed trailing digit indicating live input state"
      ]
    },
    {
      "title": "Dynamic, State-Aware Primary CTA Reflecting Entered Amount",
      "observation": "Axis's 'Proceed to Pay' button is static text regardless of amount entered or validity, missing a chance to reinforce transaction value and reduce last-second amount-reading errors.",
      "recommendation": "Update CTA label dynamically to reflect entered amount (e.g., 'Proceed to Pay $100') once a non-zero value is entered, and keep button disabled/greyed at $0 to prevent premature submission — directly adopting PayPal's confirmed-value CTA pattern.",
      "evidence": "1/5 benchmark apps (20%) — PayPal ('Add $50.00 USD Now') — fully implements amount-reflective CTA copy, though partial dynamic-state (disabled-at-zero) logic is inferred standard practice across fintech keypad flows.",
      "confidence": "Low — [20%]",
      "exceptions": "Venmo and Cash App keep CTA labels generic ('Pay', 'Request') since the dual-action nature (pay vs. request) makes embedding a dynamic amount into two buttons visually cluttered.",
      "benchmarkExamples": [
        "PayPal: 'Add $50.00 USD Now' button copy mirrors entered amount"
      ]
    }
  ],
  "industry": "Fintech / Digital Banking",
  "flow": "Money Transfer — Amount Entry",
  "screenType": "Amount Entry / Numeric Keypad Transaction Screen",
  "summary": "Axis Bank's Enter Amount screen demonstrates solid foundational adherence to transactional UX conventions — a hero-sized amount, source account visibility with balance, and a thumb-reachable primary CTA above the keypad. However, compared to 5 category-leading benchmarks spanning P2P wallets (Venmo, Cash App), super-app payments (Google Pay), and bank-linked transfers (PayPal, Oportun), Axis under-leverages several proven micro-patterns: it lacks live-edit affordances on the amount, offers no quick-preset amount chips to accelerate common transactions, and visually under-weights the available balance as a risk-prevention signal. The screen is structurally competent but ergonomically and cognitively 'quiet' compared to benchmarks that actively guide, accelerate, and safeguard the user's input decision.",
  "overallAlignment": "Axis Bank's design is directionally aligned with 70-80% of core structural conventions (hero amount, account + balance card, CTA-above-keypad) but trails benchmark leaders in interaction richness — missing live-edit cues, preset amount shortcuts, and prominent balance-as-guardrail treatment that differentiate top-tier transfer experiences.",
  "score": 72,
  "marketAlignmentScore": 74,
  "patternMaturityScore": 68,
  "snapshot": {
    "strongConventions": [
      "Hero-scale amount display centered as the primary visual anchor (100% of benchmarks)",
      "Source account card with balance adjacent to the amount entry (60% of benchmarks, high relevance for bank-linked transfers)",
      "Primary CTA positioned directly above the numeric keypad for thumb accessibility (80% of benchmarks)"
    ],
    "notableDifferences": [
      "No visible live-edit affordance (cursor/pencil) on the amount field, unlike 80% of benchmarks",
      "Absence of quick-preset amount chips found in PayPal's flow",
      "Balance shown as de-emphasized metadata rather than a bold safety cue as in Oportun",
      "Decorative dot-grid background texture competes with the otherwise clean benchmark convention of flat, distraction-free canvases"
    ],
    "keyOpportunities": [
      "Add contextual preset amount chips to reduce manual entry friction for recurring transfers",
      "Elevate available balance into a bold, co-located safety cue to prevent overdraft attempts before submission",
      "Introduce a clear cursor/pencil edit affordance on the hero amount to remove ambiguity about editability",
      "Make the CTA dynamically reflect the entered amount (e.g., 'Proceed to Pay $100') and disable at $0 to reinforce transaction confidence"
    ]
  }
};

export const DEMO_BENCHMARK_SCREENS = [
  {
    "name": "Google Pay • Amount Entry",
    "imageUrl": "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/4wjk2c5idr6_1787734227799.png"
  },
  {
    "name": "Venmo • Peer Payment Entry",
    "imageUrl": "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/bn7y74q988s_1788177478747.png"
  },
  {
    "name": "Cash App • Transferring Money",
    "imageUrl": "/cashapp-transfer-screen.png"
  },
  {
    "name": "PayPal • Fund Transfer",
    "imageUrl": "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/9pd0ozc93up_1787830116944.png"
  },
  {
    "name": "Oportun • Select Amount",
    "imageUrl": "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/x7pyxcvmrfn_1788417723649.webp"
  }
];

export const DEMO_IMPROVED_DESIGN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Improved Transfer Flow</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-[#0A0D14] text-white min-h-screen flex items-center justify-center p-4 antialiased">
  <!-- Mobile Container Mockup -->
  <div class="w-full max-w-[390px] h-[812px] bg-[#121624] rounded-[48px] border-[6px] border-[#22293E] shadow-2xl overflow-hidden flex flex-col justify-between relative">
    
    <!-- Status Bar -->
    <div class="pt-3 px-8 flex justify-between items-center text-[13px] font-medium text-white/80">
      <span>9:41</span>
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l.64-.64C7.93 20.26 9.88 21 12 21s4.07-.74 5.6-1.98l.65.64c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-.62-.64C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 3C6.48 3 2 7.48 2 13c0 2.39.84 4.58 2.25 6.32l1.42-1.42C4.55 16.39 4 14.77 4 13c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.77-.55 3.39-1.67 4.9l1.42 1.42C21.16 17.58 22 15.39 22 13c0-5.52-4.48-10-10-10z"/></svg>
        <div class="w-5 h-2.5 border border-white/80 rounded-sm p-[1px] flex items-center">
          <div class="h-full w-full bg-white rounded-[1px]"></div>
        </div>
      </div>
    </div>

    <!-- Header Navigation -->
    <div class="px-6 pt-3 pb-2 flex items-center justify-between">
      <button class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="text-center">
        <span class="text-xs uppercase tracking-wider text-indigo-400 font-semibold">Send Money</span>
        <h2 class="text-sm font-semibold text-white">Axis Bank Transfer</h2>
      </div>
      <button class="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
      </button>
    </div>

    <!-- Amount Hero & Quick Denomination Chips -->
    <div class="px-6 flex flex-col items-center justify-center my-auto">
      <span class="text-xs font-medium text-white/60 mb-1">Enter Amount</span>
      
      <!-- Big Amount with Currency Pulse -->
      <div class="flex items-baseline justify-center gap-1">
        <span class="text-3xl font-bold text-indigo-400">$</span>
        <span id="amount-display" class="text-6xl font-extrabold tracking-tight text-white">100</span>
      </div>

      <!-- UX IMPROVEMENT: Settlement & Fee Transparency -->
      <div class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-medium text-emerald-400">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        Zero Fees • Instant Settlement
      </div>

      <!-- UX IMPROVEMENT: Quick Amount Suggestion Pills -->
      <div class="flex items-center gap-2 mt-5">
        <button onclick="setAmount(25)" class="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 active:bg-indigo-600 rounded-full text-xs font-semibold text-white/80 transition-all border border-white/5">$25</button>
        <button onclick="setAmount(50)" class="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 active:bg-indigo-600 rounded-full text-xs font-semibold text-white/80 transition-all border border-white/5">$50</button>
        <button onclick="setAmount(100)" class="px-3.5 py-1.5 bg-indigo-600/30 border border-indigo-500/50 rounded-full text-xs font-semibold text-indigo-300 transition-all">$100</button>
        <button onclick="setAmount(5000)" class="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 active:bg-indigo-600 rounded-full text-xs font-semibold text-white/80 transition-all border border-white/5">Max</button>
      </div>
    </div>

    <!-- Bottom Sheet: Source Account & Sticky CTA -->
    <div class="bg-[#181D2E] rounded-t-[36px] border-t border-white/10 p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      <!-- Source Account Selector (Improved with Balance Bar) -->
      <div class="bg-[#21283F] border border-white/10 rounded-2xl p-3.5 mb-4 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
            AXIS
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-semibold text-white">Axis Priority Account</span>
              <span class="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-medium">Primary</span>
            </div>
            <p class="text-[11px] text-white/50">•••• 0124 • Available: <span class="text-white/80 font-medium">$5,000.00</span></p>
          </div>
        </div>
        <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
      </div>

      <!-- Action Button -->
      <button class="w-full h-12 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.35)] flex items-center justify-center gap-2 transition-all mb-3">
        <span>Proceed to Pay</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </button>

      <!-- UX IMPROVEMENT: Financial Keypad with Decimal (.) instead of phone symbols -->
      <div class="grid grid-cols-3 gap-y-2 gap-x-4 pt-1 pb-2">
        <button onclick="pressNum('1')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">1</button>
        <button onclick="pressNum('2')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">2</button>
        <button onclick="pressNum('3')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">3</button>
        <button onclick="pressNum('4')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">4</button>
        <button onclick="pressNum('5')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">5</button>
        <button onclick="pressNum('6')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">6</button>
        <button onclick="pressNum('7')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">7</button>
        <button onclick="pressNum('8')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">8</button>
        <button onclick="pressNum('9')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">9</button>
        <button onclick="pressNum('.')" class="h-11 rounded-xl text-lg font-bold text-white/50 hover:bg-white/5 active:bg-white/10 transition-colors">.</button>
        <button onclick="pressNum('0')" class="h-11 rounded-xl text-lg font-semibold hover:bg-white/5 active:bg-white/10 transition-colors">0</button>
        <button onclick="pressBackspace()" class="h-11 rounded-xl flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors text-white/70">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/></svg>
        </button>
      </div>

    </div>
  </div>

  <script>
    let curAmount = '100';
    const display = document.getElementById('amount-display');

    function update() {
      display.innerText = curAmount || '0';
    }

    function pressNum(char) {
      if (curAmount === '0' && char !== '.') curAmount = '';
      if (char === '.' && curAmount.includes('.')) return;
      if (curAmount.length < 7) {
        curAmount += char;
        update();
      }
    }

    function pressBackspace() {
      curAmount = curAmount.slice(0, -1);
      update();
    }

    function setAmount(val) {
      curAmount = val.toString();
      update();
    }
  </script>
</body>
</html>`;
