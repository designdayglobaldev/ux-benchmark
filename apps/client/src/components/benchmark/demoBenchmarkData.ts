export const DEMO_BENCHMARK_REPORT = {
  industry: "Finance & Banking",
  flow: "Transferring Money",
  screenType: "Amount Entry & Account Selection",
  summary: "Comprehensive UX benchmarking for single-view transfer and amount entry against industry leaders (Google Pay, Venmo, Revolut). The design exhibits high clarity with a bold keypad and prominent amount display, while opportunity exists in progressive fee/limit transparency and secondary account switching velocity.",
  overallAlignment: "Strong Alignment with Modern Peer-to-Peer & Neo-banking Standards",
  score: 88,
  marketAlignmentScore: 91,
  patternMaturityScore: 85,
  snapshot: {
    strongConventions: [
      "Custom in-app numerical pad optimized for rapid single-handed thumb tapping without OS keyboard bounce",
      "Real-time available balance reflection ($5000) directly under source account card to reduce overdraft failure anxiety",
      "Persistent primary CTA ('Proceed to Pay') fixed above the viewport baseline to guarantee clear affordance"
    ],
    notableDifferences: [
      "Account selector dropdown is embedded directly above keypad rather than sheet-based drawer used in Cash App & Revolut",
      "Inline 'Add note' input is styled as a secondary pill rather than an auto-expanding memo bar below recipient details",
      "Keypad bottom row layout places '0' between '+*#' and backspace instead of modern centered zero with dot/decimal"
    ],
    keyOpportunities: [
      "Introduce immediate currency formatting micro-animations as digits are typed to validate input scale",
      "Add quick-amount suggestion pills ($25, $50, $100, Max) to accelerate repeat peer payments by up to 40%",
      "Display real-time transfer arrival time estimate (e.g. 'Instant' or 'Arrives by 5:00 PM') directly above the CTA"
    ]
  },
  commonPatterns: [
    {
      title: "Prominent Hero Amount Entry",
      evidence: "94% of top tier fintech apps (Revolut, Cash App, Venmo, Google Pay) prioritize a central 40px+ typography size for input amount to prevent typographical error.",
      confidence: "High (Validated by 14 top finance apps)",
      whyItMatters: "Financial transactions carry severe user error anxiety; oversized real-time amount feedback reassures users of the exact quantity before confirmation.",
      exceptions: "Enterprise wire transfer forms with multi-currency conversion tables typically defer hero styling for detailed rate breakdown rows.",
      benchmarkExamples: ["Google Pay", "Venmo", "Cash App"]
    },
    {
      title: "Source Account & Liquidity Awareness",
      evidence: "Leading banking apps present available balance alongside the chosen funding account prior to action commitment.",
      confidence: "High",
      whyItMatters: "Prevents failed transaction drop-off rates and insufficient fund rejection loops.",
      benchmarkExamples: ["Google Pay", "Revolut", "Venmo"]
    },
    {
      title: "Contextual Sticky Action Bar",
      evidence: "Payment confirmation actions are always docked immediately above the custom keypad or pinned to bottom viewport.",
      confidence: "High",
      whyItMatters: "Maintains uninterrupted thumb-zone accessibility during high-intent conversion flows.",
      benchmarkExamples: ["Venmo", "Monzo"]
    }
  ],
  designDifferences: [
    {
      title: "Keypad Character Configuration",
      yourDesign: "Bottom row includes '+ * #' symbols on the bottom-left slot.",
      benchmark: "Leading apps replace telephony characters with a decimal dot (.) or biometric quick-auth trigger.",
      difference: "Telephony keys create minor cognitive friction in purely financial transaction screens.",
      potentialImpact: "Eliminating telephone symbols streamlines the keypad purely for currency input."
    },
    {
      title: "Quick Denomination Affordance",
      yourDesign: "Requires manual entry for all transaction amounts without presets.",
      benchmark: "Venmo and Revolut offer dynamic shortcut chips based on user transaction history.",
      difference: "Shortcut chips reduce average interaction time by 2.4 seconds per transfer.",
      potentialImpact: "Higher repeat payment velocity and perceived responsiveness."
    }
  ],
  opportunities: [
    {
      title: "Dynamic Smart Denomination Chips",
      observation: "The empty space between hero amount and source card could accommodate dynamic shortcut chips.",
      recommendation: "Provide 3-4 contextual amount pills ($20, $50, $100, Max) dynamically populated from recurring transfers.",
      evidence: "Fintech benchmarks demonstrate an 18% lift in payment completion velocity with 1-tap denomination pills.",
      confidence: "High",
      benchmarkExamples: ["Google Pay", "Venmo"]
    },
    {
      title: "Transfer Speed & Fee Transparency",
      observation: "Fee status and settlement speed are unstated on the primary entry screen.",
      recommendation: "Include a subtle status label: 'Free • Instant Transfer' next to the source balance.",
      evidence: "Transparent fee disclosures directly under payment amount reduce pre-confirmation drop-offs by 12%.",
      confidence: "High",
      benchmarkExamples: ["Wise", "Revolut"]
    }
  ]
};

export const DEMO_BENCHMARK_SCREENS = [
  {
    name: "Google Pay • Amount Entry",
    imageUrl: "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/4wjk2c5idr6_1787734227799.png"
  },
  {
    name: "Venmo • Peer Payment Entry",
    imageUrl: "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/bn7y74q988s_1788177478747.png"
  },
  {
    name: "Coinbase Wallet • Numeric Keypad",
    imageUrl: "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/e3aw7qc336j_1788155734870.png"
  },
  {
    name: "PayPal • Fund Transfer",
    imageUrl: "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/9pd0ozc93up_1787830116944.png"
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
