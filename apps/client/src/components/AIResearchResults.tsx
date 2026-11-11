import { useState, useEffect, useRef } from "react";
import { ZiboAiIcon } from "./ZiboAiIcon";
import { UserTurnBubble } from "./chat/UserTurnBubble";
import { AssistantTurnArtifact } from "./chat/AssistantTurnArtifact";
import { StickyChatInput } from "./chat/StickyChatInput";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIChatStore } from "../stores/useAIChatStore";
import { useAuth } from "../contexts/AuthContext";
import type { AssistantTurnPayload } from "../types/ai-chat.types";

// Standard curated benchmark baseline for the default demo query
export const defaultDemoData: AssistantTurnPayload = {
  introText:
    "Traditional banks suffer up to a **68% drop-off rate during KYC identity verification** due to upfront document friction, ambiguous verification statuses, and compliance-heavy forms. In contrast, **Revolut** and **Cash App** achieve conversion rates over **3x higher** by engineering perceived momentum, progressive micro-steps, and real-time biometric feedback.",
  uxInsights: "",
  sections: [
    {
      type: "text",
      content:
        "### Why Modern Fintech Outperforms Legacy Banking KYC\n\nTraditional banks front-load identity verification before displaying any product value, turning onboarding into a stressful interrogation. Revolut and Cash App invert this dynamic through 4 core UX principles:\n\n1. **Deferred Friction (Value Before Verification):** Users customize profile tags, choose card designs, or explore account balances before being asked for government ID.\n2. **Micro-Stepped Single-Focus Architecture:** Breaking 15-field compliance requirements into isolated, single-action screens reduces cognitive intimidation.\n3. **Automated Viewfinder Guidance:** Sub-300ms optical edge detection replaces frustrating document photo uploads.\n4. **Optimistic Wait-States:** Animated milestone meters replace vague *'Pending Review'* black boxes.",
    },
    {
      type: "interactive_flow",
      appName: "Revolut",
      appSlug: "revolut",
      flowName: "Identity Verification & Onboarding",
      description:
        "Step-by-step KYC onboarding flow with high-contrast document viewfinder and biometric verification",
      screens: [
        {
          id: "rev-screen-1",
          name: "1. Phone Number Entry",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/k54z3yc3gxp_1788929598617.webp",
          uxAnalysis: "Frictionless mobile number authentication with country code selector.",
        },
        {
          id: "rev-screen-2",
          name: "2. Welcome & Onboarding Intro",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/b3h4s63s606_1784870797386.webp",
          uxAnalysis: "Clear value proposition highlighting speed and security before document gate.",
        },
        {
          id: "rev-screen-3",
          name: "3. Address Verification",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/hmk8b3suwo4_1789110842300.webp",
          uxAnalysis: "Predictive address autocomplete minimizing keyboard strokes.",
        },
        {
          id: "rev-screen-4",
          name: "4. Identity Verification",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/m9swhhl7mmm_1789110887011.webp",
          uxAnalysis:
            "Automated document edge-detection with real-time feedback guidance to eliminate user error.",
        },
        {
          id: "rev-screen-5",
          name: "5. Security Setup",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/yw3h6dikg3_1789451368601.webp",
          uxAnalysis:
            "Animated progress ring reassurance that reduces anxiety during background verification checks.",
        },
      ],
    },
    {
      type: "interactive_flow",
      appName: "Cash App",
      appSlug: "cash-app",
      flowName: "Minimalist Pre-Onboarding",
      description:
        "Sub-minute onboarding flow prioritizing brand engagement and quick account creation",
      screens: [
        {
          id: "cash-screen-1",
          name: "1. Phone or Email Gate",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/fkfxpur7rwa_1788243351409.webp",
          uxAnalysis: "Minimalist single-field entry with zero distractive copy or legal jargon.",
        },
        {
          id: "cash-screen-2",
          name: "2. Confirmation Code",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/mki122wa1gs_1788243197819.webp",
          uxAnalysis: "Auto-reading SMS code input with instant progression.",
        },
        {
          id: "cash-screen-3",
          name: "3. Cashtag Claim",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/k0llxq79gq_1788243509466.webp",
          uxAnalysis: "Identity claim acting as psychological endowment effect.",
        },
        {
          id: "cash-screen-4",
          name: "4. Account Setup",
          imageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/5vn34ovr5kr_1788243700109.webp",
          uxAnalysis: "Deferred friction: SSN and banking disclosures are delayed until account is established.",
        },
      ],
    },
  ],
  apps: [
    {
      id: "revolut-app-id",
      name: "Revolut",
      slug: "revolut",
      category: "Banking (Digital)",
      appLogo:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/pyqa9pu2u_1784804766435.png",
      appThumbnail:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/thumbnails/6gy47c85rz3_1784804767543.png",
    },
    {
      id: "cash-app-id",
      name: "Cash App",
      slug: "cash-app",
      category: "Banking (Digital)",
      appLogo:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/vfndfu484p_1788242865874.png",
      appThumbnail:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/thumbnails/hacly7hs0mo_1788242867231.png",
    },
    {
      id: "paypal-app-id",
      name: "PayPal",
      slug: "paypal",
      category: "Payments & Banking",
      appLogo:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/uvahlzu9d8_1787635182927.png",
      appThumbnail:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/thumbnails/6zy25tbcom7_1787635184359.png",
    },
  ],
  comparisonFlows: [
    {
      appName: "Revolut",
      badge: "Verified KYC",
      appLogo:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/pyqa9pu2u_1784804766435.png",
      steps: [
        {
          stepNumber: 1,
          title: "Phone Number Entry",
          description: "Frictionless mobile number authentication with country code selector.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/k54z3yc3gxp_1788929598617.webp",
        },
        {
          stepNumber: 2,
          title: "Welcome & Onboarding Intro",
          description: "High-contrast brand moment with clear value proposition prior to identity verification.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/b3h4s63s606_1784870797386.webp",
        },
        {
          stepNumber: 3,
          title: "Address Verification",
          description: "Predictive address autocomplete minimizing keyboard strokes.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/hmk8b3suwo4_1789110842300.webp",
        },
      ],
    },
    {
      appName: "Cash App",
      badge: "Minimalist Flow",
      appLogo:
        "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/logos/vfndfu484p_1788242865874.png",
      steps: [
        {
          stepNumber: 1,
          title: "Single-Field Phone Entry",
          description: "Ultra-lean single input field removing all cognitive friction.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/fkfxpur7rwa_1788243351409.webp",
        },
        {
          stepNumber: 2,
          title: "SMS Confirmation",
          description: "Auto-reading OTP code validation with instant progression.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/mki122wa1gs_1788243197819.webp",
        },
        {
          stepNumber: 3,
          title: "Cashtag Claim",
          description: "Psychological endowment effect through immediate username claim.",
          screenImageUrl:
            "https://yqsjruicqhvisnftreal.supabase.co/storage/v1/object/public/apps/screens/k0llxq79gq_1788243509466.webp",
        },
      ],
    },
  ],
  suggestedFollowUps: [
    "How should error toasts differ for reversible vs irreversible actions?",
    "What's the best way to animate a rollback without feeling jarring?",
    "How do offline-first apps queue optimistic edits?",
  ],
};

interface AIResearchResultsProps {
  sessionId?: string | null;
}

export function AIResearchResults({
  sessionId,
}: AIResearchResultsProps) {
  const { user } = useAuth();
  
  // Single Source of Truth: Zustand Store
  const turns = useAIChatStore((state) => (sessionId ? state.threads[sessionId] || [] : []));
  const isLoading = useAIChatStore((state) => state.isLoading);
  const sendFollowUp = useAIChatStore((state) => state.sendFollowUp);

  // Rotating thinking messages
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingSteps = [
    "Searching design database & screen repositories...",
    "Retrieving verified onboarding flows & screenshots...",
    "Extracting step-by-step UX patterns & friction points...",
    "Synthesizing benchmark comparison & interactive flows...",
  ];

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingSteps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto-scroll when new turn or thinking arrives
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isLoading]);

  const handleFollowUpClick = (question: string) => {
    sendFollowUp(question, user?.id);
  };

  return (
    <div className="w-full max-w-full flex-1 flex flex-col justify-between z-10 px-2 sm:px-4 pt-4 min-w-0 pb-0">
      {/* Scrollable Conversation Thread */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {turns.map((turn) => {
          if (turn.role === "user") {
            return <UserTurnBubble key={turn.id} content={turn.content} />;
          }
          return (
            <AssistantTurnArtifact
              key={turn.id}
              turn={turn}
              onSelectFollowUp={handleFollowUpClick}
            />
          );
        })}

        {/* Pending Thinking Turn State: Only show when loading and there is NO turn already rendering */}
        {isLoading && turns.length === 0 && (
          <div className="w-full flex items-start gap-3.5 sm:gap-4 mb-8 min-w-0 animate-in fade-in duration-300">
            <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg mt-1 animate-pulse">
              <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
                <ZiboAiIcon size={18} className="text-white" />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 min-w-0 bg-[#141414] border border-[#252525] rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                <span className="text-[13px] font-medium text-purple-300">
                  {thinkingSteps[thinkingIndex]}
                </span>
              </div>
              <Skeleton className="h-4 w-5/6 bg-[#222222] rounded" />
              <Skeleton className="h-4 w-4/6 bg-[#222222] rounded" />
              <Skeleton className="h-28 w-full bg-[#1C1C1C] rounded-xl" />
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Sticky Bottom Multi-Turn Chat Bar */}
      <StickyChatInput
        isLoading={isLoading}
        onSendMessage={(q) => sendFollowUp(q, user?.id)}
        placeholder="Ask a follow-up or explore other design patterns..."
      />
    </div>
  );
}

export default AIResearchResults;
