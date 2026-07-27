import { prisma } from './src/db/prisma';

const patterns = [
  // ONBOARDING & ACTIVATION
  "Splash / Launch", "Value-Prop Carousel", "Progressive Onboarding", "Guided Tour / Coach Marks", "Setup Wizard", "Personalization Quiz", "Sample / Demo Content", "Onboarding Checklist", "Deferred Sign-Up / Guest Mode",
  
  // NAVIGATION & WAYFINDING
  "Hub & Spoke", "Flat Tab Navigation", "Drill-Down / Nested", "Master-Detail", "Dashboard / Bento", "Drawer / Off-Canvas Menu", "Search-First Navigation", "Faceted / Filtered Browse", "Breadcrumb Trail", "Sticky Navigation", "Deep Linking / Shareable State",
  
  // BROWSING & CONTENT DISCOVERY
  "Chronological Feed", "Algorithmic Feed (FYP)", "Card Grid / Gallery", "Horizontal Carousel", "Infinite Scroll", "Pagination", "Load-More Button", "Filter & Sort", "Autocomplete / Typeahead", "Search Suggestions / Recents", "Recommendations", "Featured / Hero Merchandising", "Category / Taxonomy Browse", "Recently Viewed / History", "Compare View",
  
  // INPUT & DATA ENTRY
  "Single-Screen Form", "Multi-Step Form", "Inline Editing", "Autosave / Draft", "Inline Validation", "Smart Defaults / Prefill", "Input Masking & Formatting", "Multi-Select", "Drag & Drop", "Reorder / Sortable List", "Bulk / Batch Actions", "Undo / Redo",
  
  // FEEDBACK & SYSTEM STATUS
  "Skeleton / Placeholder Loading", "Determinate Progress", "Indeterminate Loading", "Optimistic UI", "Toast / Snackbar", "Inline Success State", "Error State & Recovery", "Empty State", "Pull to Refresh", "Live / Real-Time Updates", "Offline / Connectivity Indicator",
  
  // ACTIONS & TASK COMPLETION
  "Primary / Floating Action (FAB)", "Contextual / Swipe Actions", "Long-Press / Context Menu", "Confirmation Dialog", "Undo-Instead-of-Confirm", "Quick Actions / Shortcuts", "Bottom Sheet Actions",
  
  // ENGAGEMENT & RETENTION
  "Streaks", "Badges / Achievements", "Completion Meter", "Points / Levels / XP", "Daily Drop / Daily Reward", "Milestone Celebration", "Social Proof", "Scarcity / Urgency", "Reminders / Nudges", "Notification Inbox", "Leaderboard",
  
  // CONVERSION & MONETIZATION
  "Freemium Gating / Locked Content", "Soft / Metered Paywall", "Hard Paywall", "Free Trial", "Upsell / Cross-Sell", "In-Context Upgrade Prompt", "Pricing Table", "Cart & Checkout",
  
  // PERSONALIZATION & CONTROL
  "Preference Center / Settings", "Theme / Dark Mode Toggle", "Customization & Layout Control", "Favorites / Saved / Collections", "Notification Preferences", "Saved Filters / Views",
  
  // TRUST, SAFETY & PERMISSIONS
  "Permission Priming", "Consent / Cookie Notice", "Destructive-Action Confirmation", "Verification (2FA / Email / Phone)", "Report / Block / Mute", "Privacy / Visibility Controls", "Account Recovery",
  
  // SOCIAL & COLLABORATION
  "Presence / Avatars", "Reactions", "Comments & Threads", "Share Sheet", "Invite / Referral Loop",
  
  // HELP & GUIDANCE
  "Contextual Tooltip / Hint", "Inline Help / FAQ", "Feature Spotlight", "Contextual Empty-State Guidance"
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  // Deduplicate array (there was a duplicate Invite / Referral Loop in image)
  const uniquePatterns = Array.from(new Set(patterns));

  for (const title of uniquePatterns) {
    const slug = slugify(title);
    await prisma.pattern.upsert({
      where: { slug },
      update: { title, status: 'LIVE' },
      create: { title, slug, status: 'LIVE' }
    });
  }
  console.log('Successfully seeded ' + uniquePatterns.length + ' UX patterns!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
