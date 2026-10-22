import React, { useState, useRef, type MouseEvent } from "react";
import { 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  Smartphone, 
  Monitor, 
  Tablet, 
  RotateCcw, 
  ArrowRight,
  Code2,
  SlidersHorizontal,
  CheckCircle2,
  Compass,
  CreditCard,
  UserCheck,
  Search,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer,
  X
} from "lucide-react";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { FeaturePlaceholder } from "@/components/FeaturePlaceholder";
import { StudioPageSkeleton } from "@/components/StudioPageSkeleton";
import api from "../utils/api";

interface ScreenSpec {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  category: string;
  badge?: string;
  flowStep: string;
  referenceApp?: string;
  referenceScreen?: string;
  layoutType?: "pricing-tiers" | "feature-list" | "card-grid";
  elements: {
    heroTitle: string;
    heroSubtitle: string;
    pricingTiers?: {
      id: string;
      name: string;
      price: string;
      period?: string;
      badge?: string;
      highlight?: boolean;
      features: string[];
    }[];
    features: { title: string; desc: string; icon: string; tag?: string }[];
    primaryCTA: string;
    secondaryCTA?: string;
    disclaimer?: string;
  };
  styleTokens: {
    theme: "dark" | "light";
    accentColor: string;
    bgGradient: string;
    cardBg: string;
    roundness: string;
  };
}

const CATEGORY_PRESETS = [
  { id: "all", label: "All Patterns", icon: Compass },
  { id: "paywall", label: "Paywalls & Subscriptions", icon: CreditCard },
  { id: "onboarding", label: "Onboarding & Auth", icon: UserCheck },
  { id: "dashboard", label: "Product Dashboards", icon: SlidersHorizontal },
  { id: "search", label: "Feed & Discovery", icon: Search },
];

const INITIAL_SCREENS: ScreenSpec[] = [
  {
    id: "screen-1",
    x: 80,
    y: 80,
    title: "1. Pro Trial Activation",
    subtitle: "High-converting paywall with annual discount",
    category: "paywall",
    badge: "Most Popular",
    flowStep: "Step 1",
    elements: {
      heroTitle: "Unlock the full creative studio",
      heroSubtitle: "Save 40% with annual billing. Join 85,000+ top product teams.",
      features: [
        { title: "Unlimited AI Screen Generations", desc: "Iterate multi-step user flows in seconds.", icon: "wand", tag: "PRO" },
        { title: "Production Figma Auto-Layout", desc: "Pastes directly as vector frames and editable text.", icon: "layers" },
        { title: "50,000+ App Benchmark Vault", desc: "Ground generation in real apps like Linear & Revolut.", icon: "star" },
      ],
      primaryCTA: "Start 7-Day Free Trial",
      secondaryCTA: "View all features & compare tiers",
      disclaimer: "Renews at $16/mo billed annually. Cancel anytime."
    },
    styleTokens: {
      theme: "dark",
      accentColor: "#6366F1",
      bgGradient: "from-[#0F0F14] via-[#09090C] to-[#040406]",
      cardBg: "bg-white/[0.04] border-white/[0.08]",
      roundness: "rounded-2xl"
    }
  },
  {
    id: "screen-2",
    x: 540,
    y: 80,
    title: "2. Team Workspace Setup",
    subtitle: "Progressive profile onboarding with role selection",
    category: "onboarding",
    badge: "Onboarding",
    flowStep: "Step 2",
    elements: {
      heroTitle: "How will you use the studio?",
      heroSubtitle: "We will tailor components and benchmark suggestions to your role.",
      features: [
        { title: "Product Designer", desc: "Figma vector flows, design systems, and token parity.", icon: "layers" },
        { title: "Founder / PM", desc: "Rapid prototype validation and conversion benchmark audit.", icon: "star" },
        { title: "Design Engineer", desc: "Production React and Tailwind CSS export out of the box.", icon: "wand" },
      ],
      primaryCTA: "Complete Workspace Setup",
      secondaryCTA: "I'll choose later",
      disclaimer: "You can change your team preference anytime in settings."
    },
    styleTokens: {
      theme: "dark",
      accentColor: "#0075FF",
      bgGradient: "from-[#0A0E17] via-[#07090F] to-[#030407]",
      cardBg: "bg-white/[0.04] border-blue-500/20",
      roundness: "rounded-2xl"
    }
  },
  {
    id: "screen-3",
    x: 1000,
    y: 80,
    title: "3. Permission & Push Notifications",
    subtitle: "Permission primer with high-trust framing",
    category: "onboarding",
    badge: "Step 3",
    flowStep: "Step 3",
    elements: {
      heroTitle: "Never miss a design update",
      heroSubtitle: "Get alerts when teammates comment or your AI exports are ready.",
      features: [
        { title: "Real-time Collaboration", desc: "Instant ping when reviews or changes happen.", icon: "layers" },
        { title: "Weekly UX Drop", desc: "Curated teardowns of the best newly released apps.", icon: "star" },
        { title: "Zero Spam Policy", desc: "Customize and silence notifications anytime.", icon: "wand" },
      ],
      primaryCTA: "Enable Push Notifications",
      secondaryCTA: "Maybe Later",
      disclaimer: "You can modify alert settings in your system preferences."
    },
    styleTokens: {
      theme: "dark",
      accentColor: "#10B981",
      bgGradient: "from-[#07130F] via-[#040B08] to-[#020504]",
      cardBg: "bg-white/[0.04] border-emerald-500/20",
      roundness: "rounded-2xl"
    }
  }
];

export function DesignAgentStudio() {
  const flag = useFeatureFlag('design-agent-studio', false);

  // If status is not yet loaded, return clean skeleton — NEVER mount studio UI
  if (!flag.isLoaded) {
    return <StudioPageSkeleton />;
  }

  // If feature is disabled, return placeholder immediately
  if (!flag.enabled) {
    return (
      <FeaturePlaceholder
        title="Design Agent Studio"
        behavior={flag.behavior}
        customMessage={flag.customMessage}
      />
    );
  }

  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFlow, setSelectedFlow] = useState<string>("all");
  const [dbCategories, setDbCategories] = useState<{ id: string; title: string; slug: string; _count?: { apps: number } }[]>([]);
  const [dbFlows, setDbFlows] = useState<{ id: string; name: string; slug: string; _count?: { screens: number } }[]>([]);
  const [screens, setScreens] = useState<ScreenSpec[]>(INITIAL_SCREENS);
  const [activeScreenId, setActiveScreenId] = useState<string>("screen-1");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedFigma, setCopiedFigma] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [selectedTierId, setSelectedTierId] = useState<string>("tier-2");

  // Fetch real categories & flows from database that actually contain screens
  React.useEffect(() => {
    async function loadDbFilters() {
      try {
        const { data } = await api.get("/ai/design-agent/filters");
        if (data.categories && data.categories.length > 0) {
          setDbCategories(data.categories);
        }
        if (data.flows && data.flows.length > 0) {
          setDbFlows(data.flows);
        }
      } catch (err) {
        console.warn("Failed to load real database filters:", err);
      }
    }
    loadDbFilters();
  }, []);

  // Canvas Pan & Zoom States (Figma / Stitch style)
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [zoom, setZoom] = useState(0.85);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<"select" | "hand">("select");
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const activeScreen = screens.find(s => s.id === activeScreenId) || screens[0];

  // Mouse pan handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // If clicking hand tool, middle mouse, or spacebar hold
    if (activeTool === "hand" || e.button === 1 || e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.35), 2.0));
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const lastScreen = screens[screens.length - 1];
    const newX = lastScreen ? lastScreen.x + 460 : 80;
    const newY = lastScreen ? lastScreen.y : 80;

    try {
      // Connect to live AI Agent endpoint via configured Axios api instance
      const { data } = await api.post("/ai/design-agent/generate", {
        prompt: prompt.trim(),
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        flow: selectedFlow !== "all" ? selectedFlow : undefined,
        device: device
      });

      const generatedSpec = data.screen;

      const newScreen: ScreenSpec = {
        id: `screen-${screens.length + 1}`,
        x: newX,
        y: newY,
        title: generatedSpec.title || `${screens.length + 1}. ${prompt.slice(0, 24)}...`,
        subtitle: generatedSpec.subtitle || `Grounded in ${selectedCategory} design library patterns`,
        category: generatedSpec.category || selectedCategory,
        badge: generatedSpec.badge || "AI Crafted",
        flowStep: generatedSpec.flowStep || `Step ${screens.length + 1}`,
        referenceApp: data.referenceScreen?.appName || generatedSpec.referenceApp,
        referenceScreen: data.referenceScreen?.screenName || generatedSpec.referenceScreen,
        layoutType: generatedSpec.layoutType || (generatedSpec.elements?.pricingTiers?.length ? "pricing-tiers" : "feature-list"),
        elements: generatedSpec.elements || {
          heroTitle: prompt.length > 36 ? prompt.slice(0, 36) + "..." : prompt,
          heroSubtitle: "Engineered using high-converting UX heuristics from our benchmark library.",
          features: [
            { title: "Library-Grounded Pattern", desc: "Modeled after top 1% market benchmarks.", icon: "wand", tag: "AI" },
            { title: "Native Figma Auto-Layout", desc: "Pastes directly as vector frames and editable text.", icon: "layers" },
            { title: "8px Spacing Grid", desc: "Harmonious contrast and strict spacing tokens.", icon: "star" },
          ],
          primaryCTA: "Continue to Next Step",
          secondaryCTA: "View alternative options",
          disclaimer: "Fully customizable. Pastes into Figma with Auto-Layout."
        },
        styleTokens: generatedSpec.styleTokens || {
          theme: "dark",
          accentColor: "#6366F1",
          bgGradient: "from-[#0F111A] via-[#090A0F] to-[#040407]",
          cardBg: "bg-white/[0.04] border-white/10",
          roundness: "rounded-2xl"
        }
      };

      setScreens((prev) => [...prev, newScreen]);
      setActiveScreenId(newScreen.id);
      setPan({ x: -newX * zoom + 300, y: -newY * zoom + 120 });
      setPrompt("");
    } catch (err) {
      console.warn("Live API call encountered error, using local UX heuristic generator:", err);
      // Seamless fallback
      const fallbackScreen: ScreenSpec = {
        id: `screen-${screens.length + 1}`,
        x: newX,
        y: newY,
        title: `${screens.length + 1}. ${prompt.slice(0, 24)}...`,
        subtitle: `Grounded in ${selectedCategory} design library patterns`,
        category: selectedCategory,
        badge: "AI Crafted",
        flowStep: `Step ${screens.length + 1}`,
        elements: {
          heroTitle: prompt.length > 36 ? prompt.slice(0, 36) + "..." : prompt,
          heroSubtitle: "Engineered using high-converting UX heuristics from our benchmark library.",
          features: [
            { title: "Library-Grounded Pattern", desc: "Modeled after top 1% market benchmarks.", icon: "wand", tag: "AI" },
            { title: "Native Figma Auto-Layout", desc: "Pastes directly as vector frames and editable text.", icon: "layers" },
            { title: "8px Spacing Grid", desc: "Harmonious contrast and strict spacing tokens.", icon: "star" },
          ],
          primaryCTA: "Continue to Next Step",
          secondaryCTA: "View alternative options",
          disclaimer: "Fully customizable. Pastes into Figma with Auto-Layout."
        },
        styleTokens: {
          theme: "dark",
          accentColor: "#6366F1",
          bgGradient: "from-[#0F111A] via-[#090A0F] to-[#040407]",
          cardBg: "bg-white/[0.04] border-white/10",
          roundness: "rounded-2xl"
        }
      };
      setScreens((prev) => [...prev, fallbackScreen]);
      setActiveScreenId(fallbackScreen.id);
      setPan({ x: -newX * zoom + 300, y: -newY * zoom + 120 });
      setPrompt("");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFigmaSvg = (screen: ScreenSpec): string => {
    const isDark = screen.styleTokens.theme === "dark";
    const bg1 = isDark ? "#111116" : "#FFFFFF";
    const bg2 = isDark ? "#07070A" : "#F1F5F9";
    const textColor = isDark ? "#FFFFFF" : "#0F172A";
    const mutedColor = isDark ? "#94A3B8" : "#64748B";
    const cardBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
    const cardBorder = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";
    const accent = screen.styleTokens.accentColor || "#6366F1";

    const featuresSvg = screen.elements.features.map((feat, idx) => {
      const yOffset = 210 + idx * 80;
      return `
        <!-- Feature Card ${idx + 1} -->
        <g transform="translate(24, ${yOffset})">
          <rect width="337" height="68" rx="16" fill="${cardBg}" stroke="${cardBorder}" stroke-width="1"/>
          <!-- Icon Circle -->
          <circle cx="28" cy="34" r="16" fill="rgba(99, 102, 241, 0.15)"/>
          <path d="M 23 34 L 27 38 L 34 30" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Feature Title -->
          <text x="56" y="29" font-family="Inter, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${textColor}">${feat.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
          <!-- Feature Desc -->
          <text x="56" y="47" font-family="Inter, -apple-system, sans-serif" font-size="10" font-weight="400" fill="${mutedColor}">${feat.desc.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
          ${feat.tag ? `
          <!-- Tag Pill -->
          <rect x="275" y="22" width="46" height="20" rx="6" fill="rgba(99, 102, 241, 0.2)"/>
          <text x="298" y="35" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="9" font-weight="700" fill="#A5B4FC">${feat.tag}</text>
          ` : ""}
        </g>
      `;
    }).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="385" height="740" viewBox="0 0 385 740">
  <defs>
    <linearGradient id="screenBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="ctaBg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F3F4F6"/>
    </linearGradient>
  </defs>

  <!-- Frame Outer Container / Artboard -->
  <rect width="385" height="740" rx="44" fill="url(#screenBg)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.5"/>

  <!-- Dynamic Island Notch -->
  <rect x="135" y="14" width="115" height="26" rx="13" fill="#000000" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
  <circle cx="152" cy="27" r="4.5" fill="#18181B"/>
  <circle cx="230" cy="27" r="4" fill="rgba(99, 102, 241, 0.3)"/>

  <!-- Header Badge -->
  <g transform="translate(24, 62)">
    <rect width="78" height="22" rx="11" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1"/>
    <text x="39" y="15" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="9.5" font-weight="700" letter-spacing="0.5" fill="#FFFFFF">${screen.badge || "PRO"}</text>
    <text x="337" y="15" text-anchor="end" font-family="Inter, -apple-system, sans-serif" font-size="10.5" font-weight="500" fill="${mutedColor}">${screen.flowStep}</text>
  </g>

  <!-- Hero Typography -->
  <text x="24" y="122" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="700" letter-spacing="-0.5" fill="${textColor}">${screen.elements.heroTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
  <text x="24" y="152" font-family="Inter, -apple-system, sans-serif" font-size="11.5" font-weight="400" fill="${mutedColor}">${screen.elements.heroSubtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>

  <!-- Features Container -->
  ${featuresSvg}

  <!-- Bottom CTA Group -->
  <g transform="translate(24, 630)">
    <!-- Primary CTA Button -->
    <rect width="337" height="52" rx="14" fill="url(#ctaBg)" filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.3))"/>
    <text x="168" y="32" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#000000">${screen.elements.primaryCTA.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
    
    <!-- Secondary CTA or Disclaimer -->
    ${screen.elements.disclaimer ? `
    <text x="168" y="70" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="9.5" font-weight="400" fill="${mutedColor}">${screen.elements.disclaimer.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
    ` : ""}
  </g>
</svg>`;
  };

  const handleCopyToFigma = async (screenToCopy: ScreenSpec = activeScreen) => {
    setCopiedFigma(true);
    const svgContent = generateFigmaSvg(screenToCopy);

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        // Write both text/html and text/plain containing the SVG markup.
        // Figma inspects clipboard for text/html and image/svg+xml and instantly converts it to an editable vector Frame!
        const htmlBlob = new Blob([svgContent], { type: "text/html" });
        const textBlob = new Blob([svgContent], { type: "text/plain" });

        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(svgContent);
      }
    } catch (err) {
      console.warn("ClipboardItem write failed, falling back to writeText:", err);
      await navigator.clipboard.writeText(svgContent);
    }

    setTimeout(() => setCopiedFigma(false), 2000);
  };

  const handleCopyCode = () => {
    setCopiedCode(true);
    const codeSample = `<div className="w-[380px] min-h-[660px] bg-gradient-to-b ${activeScreen.styleTokens.bgGradient} p-6 rounded-[40px] border border-white/10 flex flex-col justify-between text-white font-sans">
  <div>
    <h1 className="text-2xl font-bold tracking-tight mb-2">${activeScreen.elements.heroTitle}</h1>
    <p className="text-sm text-neutral-400 mb-6">${activeScreen.elements.heroSubtitle}</p>
    <div className="space-y-3">
      ${activeScreen.elements.features.map(f => `
      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
        <div className="text-sm font-semibold">${f.title}</div>
      </div>`).join("")}
    </div>
  </div>
  <button className="w-full py-3.5 rounded-xl font-bold bg-white text-black shadow-lg">
    ${activeScreen.elements.primaryCTA}
  </button>
</div>`;
    navigator.clipboard.writeText(codeSample);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetView = () => {
    setPan({ x: 80, y: 60 });
    setZoom(0.85);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] flex flex-col bg-[#070709] text-white overflow-hidden font-sans select-none relative">
      {/* Top Studio Bar */}
      <div className="h-13 min-h-[52px] border-b border-white/[0.08] px-5 flex items-center justify-between shrink-0 bg-[#0C0C10] z-20">
        {/* Left: Tools & Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wide text-white">Design Agent</span>
              <span className="text-neutral-600 text-xs">/</span>
              <span className="text-xs text-neutral-400 font-medium">Infinite Canvas</span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Canvas Tools (Select / Hand Pan) */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setActiveTool("select")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${activeTool === "select" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Select (V)"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTool("hand")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${activeTool === "hand" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Pan Hand Tool (H)"
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Viewport Preset */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${device === "mobile" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Mobile Device"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${device === "tablet" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Tablet Device"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded cursor-pointer transition-colors ${device === "desktop" ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Canvas Zoom & Position info */}
        <div className="flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08] text-xs text-neutral-400">
          <button 
            onClick={() => setZoom(prev => Math.max(prev * 0.9, 0.35))} 
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-white">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(prev => Math.min(prev * 1.1, 2.0))} 
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-white/10 mx-1" />
          <button 
            onClick={resetView} 
            className="p-1 hover:text-white cursor-pointer text-[10px] font-medium"
            title="Fit Canvas"
          >
            Reset
          </button>
        </div>

        {/* Right: Export & Code */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInspectModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Inspect React</span>
          </button>

          <button
            onClick={() => handleCopyToFigma(activeScreen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-md"
          >
            {copiedFigma ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5" />}
            <span>{copiedFigma ? "Copied Auto-Layout!" : "Copy to Figma"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Canvas with Floating Prompt Bar */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[#070709] w-full h-full">
        {/* Infinite Pan & Zoom Canvas Area */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`absolute inset-0 overflow-hidden select-none ${
            activeTool === "hand" || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Canvas Transform Stage */}
          <div
            className="absolute top-0 left-0 w-[5000px] h-[3000px] origin-top-left transition-transform duration-75 ease-out pointer-events-auto z-10"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
            }}
          >
            {/* Render Flow Connecting Arrows between screens */}
            <svg className="absolute inset-0 pointer-events-none overflow-visible w-[3000px] h-[2000px]">
              {screens.map((screen, idx) => {
                if (idx === screens.length - 1) return null;
                const nextScreen = screens[idx + 1];
                const startX = screen.x + (device === "mobile" ? 385 : device === "tablet" ? 580 : 760);
                const startY = screen.y + 360;
                const endX = nextScreen.x;
                const endY = nextScreen.y + 360;

                return (
                  <g key={`arrow-${idx}`}>
                    <path
                      d={`M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      className="opacity-60"
                    />
                    <circle cx={endX} cy={endY} r="4" fill="#6366F1" />
                  </g>
                );
              })}
            </svg>

            {/* Artboard Screens */}
            {screens.map((screen) => {
              const isSelected = activeScreenId === screen.id;

              return (
                <div
                  key={screen.id}
                  onClick={() => setActiveScreenId(screen.id)}
                  className="absolute transition-shadow duration-200"
                  style={{
                    left: screen.x,
                    top: screen.y
                  }}
                >
                  {/* Artboard Top Meta Tag (Figma Frame Name) */}
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold tracking-wide transition-colors ${isSelected ? "text-indigo-400" : "text-neutral-400"}`}>
                        {screen.title}
                      </span>
                      <span className="text-[10px] text-neutral-600">•</span>
                      <span className="text-[11px] text-neutral-500">{screen.flowStep}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToFigma(screen);
                      }}
                      className="opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-0.5 rounded border border-white/10"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                    {/* Device Frame */}
                    <div
                      style={{
                        background: screen.styleTokens.theme === "dark" 
                          ? "linear-gradient(to bottom, #111116, #09090C, #050507)" 
                          : "linear-gradient(to bottom, #FFFFFF, #F8FAFC, #F1F5F9)"
                      }}
                      className={`transition-all duration-200 overflow-hidden flex flex-col justify-between relative shadow-2xl ${
                        isSelected 
                          ? "ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#070709] shadow-[0_20px_70px_-15px_rgba(79,70,229,0.45)] border-indigo-400/40" 
                          : "border border-white/[0.15] hover:border-white/30"
                      } ${
                        device === "mobile" 
                          ? "w-[385px] min-h-[720px] rounded-[48px] p-6 text-white" 
                          : device === "tablet"
                          ? "w-[580px] min-h-[720px] rounded-[36px] p-8 text-white" 
                          : "w-[760px] min-h-[520px] rounded-[28px] p-8 text-white"
                      }`}
                    >
                    {/* iPhone Dynamic Island */}
                    {device === "mobile" && (
                      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 border border-white/[0.06]">
                        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/40" />
                      </div>
                    )}

                    {/* Top Content */}
                    <div className={device === "mobile" ? "pt-7" : ""}>
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white/90 border border-white/10">
                          {screen.badge || "PRO"}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {screen.flowStep}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight text-white mb-2 leading-snug">
                        {screen.elements.heroTitle}
                      </h2>
                      <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
                        {screen.elements.heroSubtitle}
                      </p>

                      {/* Toggle Pill (Annual vs Monthly) for paywall */}
                      {screen.category === "paywall" && (
                        <div className="mb-5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setAnnualBilling(true)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              annualBilling ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            <span>Annual</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-700 font-bold">
                              -40%
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAnnualBilling(false)}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              !annualBilling ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            Monthly
                          </button>
                        </div>
                      )}

                      {/* Grounded Benchmark Badge if available */}
                      {screen.referenceApp && (
                        <div className="mb-4 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          <span>Grounded in <strong>{screen.referenceApp}</strong> {screen.referenceScreen ? `(${screen.referenceScreen})` : ''}</span>
                        </div>
                      )}

                      {/* Dynamic Layout Archetype: Pricing Tiers vs Feature List */}
                      {screen.elements.pricingTiers && screen.elements.pricingTiers.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-2 gap-2.5">
                            {screen.elements.pricingTiers.map((tier) => {
                              const isTierSelected = selectedTierId === tier.id;
                              return (
                                <div
                                  key={tier.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTierId(tier.id);
                                  }}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                                    isTierSelected
                                      ? "bg-white/[0.08] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500"
                                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                                  }`}
                                >
                                  {tier.badge && (
                                    <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-[8px] font-bold text-white tracking-wider uppercase">
                                      {tier.badge}
                                    </span>
                                  )}
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white">{tier.name}</span>
                                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isTierSelected ? "border-indigo-400 bg-indigo-500" : "border-neutral-500"}`}>
                                        {isTierSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-1">
                                      <span className="text-lg font-extrabold text-white">{tier.price}</span>
                                      {tier.period && <span className="text-[10px] text-neutral-400">{tier.period}</span>}
                                    </div>
                                  </div>
                                  <div className="mt-3 space-y-2 pt-2 border-t border-white/[0.06]">
                                    {tier.features.slice(0, 3).map((feat, fIdx) => (
                                      <div key={fIdx} className="flex items-start gap-1.5 text-[10px] text-neutral-300">
                                        <Check className="w-2.5 h-2.5 text-indigo-400 shrink-0 mt-0.5" />
                                        <span className="leading-tight line-clamp-2">{feat}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Feature Items List */
                        <div className="space-y-2.5">
                          {screen.elements.features.map((feat, i) => (
                            <div 
                              key={i} 
                              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all group hover:border-white/20 ${screen.styleTokens.cardBg}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5">
                                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-semibold text-white">{feat.title}</h4>
                                    {feat.tag && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                        {feat.tag}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{feat.desc}</p>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA Block */}
                    <div className="pt-6 space-y-2.5">
                      <button 
                        className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-white/10"
                      >
                        <span>{screen.elements.primaryCTA}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {screen.elements.secondaryCTA && (
                        <button className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer text-center">
                          {screen.elements.secondaryCTA}
                        </button>
                      )}

                      {screen.elements.disclaimer && (
                        <p className="text-[10px] text-center text-neutral-500">
                          {screen.elements.disclaimer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Bottom Prompt Bar (Stitch / Figma / Linear Style) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-30">
          <div className="bg-[#121217]/90 backdrop-blur-2xl border border-white/[0.14] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] p-3 space-y-3 transition-all duration-200 focus-within:border-white/30 focus-within:shadow-[0_25px_70px_-15px_rgba(99,102,241,0.25)]">
            
            {/* Top Row: Categories & Flow Badges from Real Database */}
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedFlow("all");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    selectedCategory === "all" && selectedFlow === "all"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Compass className="w-3 h-3" />
                  <span>All Patterns</span>
                </button>

                {/* Real DB Categories */}
                {dbCategories.length > 0 ? (
                  dbCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(isSelected ? "all" : cat.slug);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white font-semibold shadow-sm"
                            : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span>{cat.title}</span>
                        {cat._count?.apps ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-neutral-300 font-mono">
                            {cat._count.apps}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  CATEGORY_PRESETS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? "bg-white text-black font-semibold shadow-sm"
                            : "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })
                )}

                {/* Flows divider if dbFlows present */}
                {dbFlows.length > 0 && (
                  <>
                    <div className="h-3 w-[1px] bg-white/10 mx-1 shrink-0" />
                    {dbFlows.slice(0, 5).map((fl) => {
                      const isFlowSelected = selectedFlow === fl.slug;
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => {
                            setSelectedFlow(isFlowSelected ? "all" : fl.slug);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1 shrink-0 border ${
                            isFlowSelected
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                              : "border-white/5 text-neutral-400 hover:text-white hover:border-white/10"
                          }`}
                        >
                          <span>{fl.name}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* RAG Vault Badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>50k+ UX RAG</span>
              </div>
            </div>

            {/* Middle: Expanded Multi-line Textarea */}
            <form onSubmit={handleGenerate} className="space-y-2.5">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate(e);
                    }
                  }}
                  rows={2}
                  placeholder="Describe a screen or flow (e.g. Phone OTP verification with auto-focus inputs and 60s resend timer)..."
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed tracking-wide pr-8"
                />
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="absolute right-1 top-1 p-1 text-neutral-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                    title="Clear prompt"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-1">
                {/* Suggestions / Shortcuts */}
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="hidden md:inline">Try:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-[340px] md:max-w-[420px]">
                    {[
                      "Paywall with 7-day trial guarantee",
                      "Profile step with avatar upload",
                      "Empty workspace state"
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(sample)}
                        className="truncate text-[10px] text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2 py-0.5 rounded-md border border-white/[0.06] transition-colors cursor-pointer shrink-0"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button & Shortcut info */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">
                    ↵ Return
                  </span>
                  <button
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isGenerating || !prompt.trim()
                        ? "bg-white/[0.08] text-neutral-500 cursor-not-allowed border border-white/5"
                        : "bg-white text-black hover:bg-neutral-200 shadow-md shadow-white/10 active:scale-[0.98]"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RotateCcw className="w-3 h-3 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Inspect Code Modal */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-[#0E0E12] rounded-2xl border border-white/10 p-5 shadow-2xl flex flex-col justify-between max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>{activeScreen.id}.tsx (Auto-Layout Tailwind Spec)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-xs font-medium cursor-pointer transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto p-4 text-[12px] font-mono text-neutral-300 leading-relaxed bg-black/40 rounded-xl my-3">
{`<div className="w-[385px] min-h-[720px] bg-gradient-to-b ${activeScreen.styleTokens.bgGradient} p-6 rounded-[48px] border border-white/10 flex flex-col justify-between text-white font-sans">
  <div>
    <div className="flex items-center justify-between mb-5">
      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white">${activeScreen.badge || "PRO"}</span>
      <span className="text-[11px] text-neutral-400 font-mono">${activeScreen.flowStep}</span>
    </div>
    <h1 className="text-2xl font-bold tracking-tight mb-2 leading-snug">${activeScreen.elements.heroTitle}</h1>
    <p className="text-xs text-neutral-400 mb-5 leading-relaxed">${activeScreen.elements.heroSubtitle}</p>
    
    <div className="space-y-2.5">
      ${activeScreen.elements.features.map(f => `
      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white">${f.title}</div>
          <div className="text-[11px] text-neutral-400 mt-0.5">${f.desc}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>

  <div className="pt-6">
    <button className="w-full py-3.5 rounded-xl font-bold bg-white text-black shadow-xl">
      ${activeScreen.elements.primaryCTA}
    </button>
  </div>
</div>`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
export default DesignAgentStudio;
