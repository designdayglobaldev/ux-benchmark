import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowRight, Layers, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { ZiboAiIcon } from "./ZiboAiIcon";
import { DynamicGenUIRenderer } from "./genui/GenUIRenderer";
import type { GenUISection } from "./genui/GenUIRenderer";
import revolutScreen from "../assets/Revolut.png";
import revolutLogo from "../assets/Revolut_logo.png";

export interface AIResearchApp {
  id: string;
  name: string;
  slug?: string;
  category: string;
  reason?: string;
  appLogo?: string | null;
  appThumbnail?: string | null;
}

export interface FlowStep {
  stepNumber: number;
  title: string;
  description: string;
  uxTactic?: string;
  screenImageUrl?: string | null;
  screenName?: string | null;
  screenId?: string | null;
}

export interface ComparisonFlow {
  appName: string;
  badge?: string;
  slug?: string;
  appLogo?: string | null;
  appThumbnail?: string | null;
  steps: FlowStep[];
  totalScreens?: number;
}

interface AIResearchResultsProps {
  submittedQuery: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  onResultsLoaded?: (data: { introText: string; suggestedFollowUps: string[] }) => void;
  onSelectFollowUp?: (question: string) => void;
}

export function AIResearchResults({
  submittedQuery,
  conversationHistory = [],
  onResultsLoaded,
  onSelectFollowUp
}: AIResearchResultsProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("Analyzing benchmark evidence with Claude...");
  const [sections, setSections] = useState<GenUISection[]>([]);
  const [apps, setApps] = useState<AIResearchApp[]>([]);
  const [comparisonFlows, setComparisonFlows] = useState<ComparisonFlow[]>([]);
  const [uxInsights, setUxInsights] = useState<string>("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; appName: string } | null>(null);

  // Rotating Thinking Status Messages (Claude / GPT style)
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingSteps = [
    "Searching design database & screen repositories...",
    "Retrieving verified onboarding flows & screenshots...",
    "Extracting step-by-step UX patterns & friction points...",
    "Synthesizing benchmark comparison & interactive flows..."
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setThinkingIndex(prev => (prev + 1) % thinkingSteps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  // Typewriter streaming effect for introText
  const [streamedText, setStreamedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    if (loading || !introText) {
      setStreamedText("");
      setIsTypingComplete(false);
      return;
    }

    let currentIndex = 0;
    const words = introText.split(" ");
    setStreamedText(words[0] || "");

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < words.length) {
        setStreamedText(prev => prev + " " + words[currentIndex]);
      } else {
        clearInterval(interval);
        setIsTypingComplete(true);
      }
    }, 28); // ~35 words per second (comfortable AI streaming pace)

    return () => clearInterval(interval);
  }, [loading, introText]);

  useEffect(() => {
    let isMounted = true;
    const fetchAIResults = async () => {
      setLoading(true);
      try {
        const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
        const baseApi = rawApiUrl.replace(/\/$/, "");
        const targetUrl = baseApi.endsWith("/api/v1")
          ? `${baseApi.replace(/\/api\/v1$/, "")}/api/v1/ai/workspace-chat`
          : `${baseApi}/api/v1/ai/workspace-chat`;

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: submittedQuery,
            conversationHistory: conversationHistory,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const json = await response.json();
        if (isMounted && json.data) {
          const intro = json.data.introText || `Here are the top banking apps matching your query.`;
          setIntroText(intro);
          setUxInsights(json.data.uxInsights || "");

          if (Array.isArray(json.data.sections)) {
            setSections(json.data.sections);
          } else {
            setSections([]);
          }

          if (Array.isArray(json.data.comparisonFlows)) {
            setComparisonFlows(json.data.comparisonFlows);
          } else {
            setComparisonFlows([]);
          }

          const loadedFollowUps = Array.isArray(json.data.suggestedFollowUps) ? json.data.suggestedFollowUps : [];
          setFollowUps(loadedFollowUps);

          if (Array.isArray(json.data.apps)) {
            setApps(json.data.apps);
          } else {
            setApps([]);
          }

          if (onResultsLoaded) {
            onResultsLoaded({
              introText: intro,
              suggestedFollowUps: loadedFollowUps,
            });
          }
        }
      } catch (err) {
        console.warn("Claude workspace-chat endpoint error, using local fallback:", err);
        if (isMounted) {
          const fallbackIntro = "I'm here to help with UX benchmarking, patterns, and design breakdown questions.";
          setIntroText(fallbackIntro);
          setSections([]);
          setApps([]);
          setFollowUps([
            "What apps have the best onboarding UX?",
            "Show banking dashboard designs"
          ]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAIResults();
    return () => {
      isMounted = false;
    };
  }, [submittedQuery]);

  return (
    <div className="w-full max-w-full flex-1 flex flex-col justify-start z-10 px-2 sm:px-4 pt-4 min-w-0">
      {/* 1. Top Right User Question Bubble (Exact Figma Frame 2147230909) */}
      <div className="w-full flex justify-end mb-6">
        <div
          className="flex items-center justify-center px-[18px] py-[12px]"
          style={{
            minHeight: "40px",
            maxWidth: "460px",
            background: "#272727",
            borderRadius: "14px 14px 0px 14px"
          }}
        >
          <span
            style={{
              fontFamily: "'Geist', 'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "16px",
              letterSpacing: "-0.24px",
              color: "#FFFFFF"
            }}
          >
            {submittedQuery}
          </span>
        </div>
      </div>

      {/* 2. AI Intro Message with Zibo Icon */}
      <div className="flex items-start gap-3 mb-6 w-full min-w-0">
        <div className="shrink-0 flex items-center justify-center pt-0.5">
          <ZiboAiIcon size={22} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2.5 py-1"
            >
              {/* Shimmering pulse pill with rotating step labels */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] shadow-lg w-fit">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A873E8] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F98537]"></span>
                </span>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={thinkingIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="text-[13px] text-[#D0D0D0] font-medium tracking-tight"
                  >
                    {thinkingSteps[thinkingIndex]}
                  </motion.span>
                </AnimatePresence>

                <div className="flex items-center gap-1 pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A873E8] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF924A] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F612A6] animate-bounce"></span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {/* Dynamic GenUI Component Sections */}
              {sections && sections.length > 0 ? (
                <div className="flex flex-col gap-3 w-full">
                  {introText && (
                    <div
                      className="text-[#E0E0E0] text-[14px] sm:text-[15px] leading-[25px] font-normal prose prose-invert max-w-none prose-p:my-2 prose-strong:text-white"
                      style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamedText}
                      </ReactMarkdown>
                      {!isTypingComplete && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-[#0099FF] animate-pulse align-middle rounded-sm shadow-[0_0_8px_#0099FF]" />
                      )}
                    </div>
                  )}
                  <DynamicGenUIRenderer sections={sections} />
                </div>
              ) : (
                <div
                  className="text-[#E0E0E0] text-[14px] sm:text-[15px] leading-[24px] font-normal prose prose-invert max-w-none prose-p:my-2.5 prose-strong:text-white prose-strong:font-semibold prose-ol:my-2 prose-ul:my-2 prose-li:my-1 prose-headings:text-white prose-headings:font-medium prose-headings:my-3"
                  style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamedText}
                  </ReactMarkdown>
                  {!isTypingComplete && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-[#0099FF] animate-pulse align-middle rounded-sm shadow-[0_0_8px_#0099FF]" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Key UX Takeaway / Insights if provided (fallback if not in sections) */}
          {!loading && uxInsights && (!sections || sections.every(s => s.type !== "insight_card")) && (
            <div className="mt-2 p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[13px] text-[#D4D4D4] leading-relaxed">
              <span className="font-medium text-white block mb-1">Key UX Insights</span>
              <div className="prose prose-invert max-w-none text-[13px] prose-p:my-1 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {uxInsights}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Synchronized Flow Comparison Inspector (Canvas/Mobbin Style) */}
      {!loading && comparisonFlows.length > 0 && (() => {
        const maxSteps = Math.max(...comparisonFlows.map(f => f.steps.length), 1);
        const clampedIndex = Math.min(activeStepIndex, maxSteps - 1);

        return (
          <div className="flex flex-col gap-4 my-4 w-full rounded-2xl bg-[#121212] border border-[#252525] p-5 shadow-2xl overflow-hidden">

            {/* Top Toolbar: Heading + Step Scrubber Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1F1F1F] border border-[#2F2F2F] flex items-center justify-center text-[#A873E8]">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-white tracking-tight m-0">
                    Interactive Flow Comparison
                  </h3>
                  <p className="text-[12px] text-[#8E8E8E] m-0">
                    Synchronized step-by-step UX inspection
                  </p>
                </div>
              </div>

              {/* Step Scrubber Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A]">
                {Array.from({ length: maxSteps }).map((_, stepIdx) => {
                  const isActive = clampedIndex === stepIdx;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => setActiveStepIndex(stepIdx)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${isActive
                          ? "bg-[#292929] text-white shadow-sm border border-[#3E3E3E]"
                          : "text-[#888888] hover:text-[#D4D4D4] hover:bg-[#202020]"
                        }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? "bg-[#A873E8] text-white" : "bg-[#2D2D2D] text-[#888888]"
                        }`}>
                        {stepIdx + 1}
                      </span>
                      <span>Step {stepIdx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side-by-Side Large High-Res Comparison Stage */}
            <div className={`grid gap-6 w-full pt-2 ${comparisonFlows.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
              }`}>
              {comparisonFlows.map((flow, flowIdx) => {
                const currentStep = flow.steps[clampedIndex] || flow.steps[flow.steps.length - 1];

                return (
                  <div
                    key={flowIdx}
                    className="flex flex-col gap-4 rounded-xl bg-[#171717] border border-[#262626] p-4 transition-all hover:border-[#383838]"
                  >
                    {/* App Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-[15px] text-white">
                          {flow.appName}
                        </span>
                        {flow.badge && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#242424] text-[#A0A0A0] border border-[#2E2E2E]">
                            {flow.badge}
                          </span>
                        )}
                      </div>

                      {flow.slug && (
                        <button
                          onClick={() => navigate(`/app/${flow.slug}`)}
                          className="text-[11px] text-[#A873E8] hover:text-[#C59BFA] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          All Screens <ArrowRight size={11} />
                        </button>
                      )}
                    </div>

                    {/* Step Title & UX Tactic Banner */}
                    <div className="flex items-start justify-between gap-2 min-h-[38px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#252525] text-white shrink-0">
                          #{clampedIndex + 1}
                        </span>
                        <span className="text-[13px] font-medium text-white leading-tight">
                          {currentStep?.title || "Overview"}
                        </span>
                      </div>

                      {currentStep?.uxTactic && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#222222] text-[#B0B0B0] border border-[#303030] shrink-0 text-right">
                          {currentStep.uxTactic}
                        </span>
                      )}
                    </div>

                    {/* Prominent High-Fidelity Phone Screen */}
                    <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#242424] relative shadow-2xl group/screen flex items-center justify-center">
                      <img
                        src={currentStep?.screenImageUrl || flow.appThumbnail || revolutScreen}
                        alt={`${flow.appName} Step ${clampedIndex + 1}`}
                        className="w-full h-full object-contain object-top block"
                      />

                      {/* Click to Zoom Overlay Button */}
                      <button
                        onClick={() => setZoomImage({
                          url: currentStep?.screenImageUrl || flow.appThumbnail || revolutScreen,
                          title: currentStep?.title || `Step ${clampedIndex + 1}`,
                          appName: flow.appName
                        })}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#141414]/90 hover:bg-[#1C1C1C] text-white text-[11px] font-medium border border-[#333333] opacity-0 group-hover/screen:opacity-100 transition-all flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer"
                      >
                        <Maximize2 size={12} /> Inspect
                      </button>
                    </div>

                    {/* Step UX Rationale Description */}
                    <div className="p-3 rounded-lg bg-[#141414] border border-[#222222] flex flex-col gap-1">
                      <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider">
                        Design Rationale
                      </span>
                      <p className="text-[12px] text-[#A8A8A8] leading-relaxed m-0">
                        {currentStep?.description || "No specific step breakdown provided."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Scrubber Navigation Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-[#222222]">
              <button
                disabled={clampedIndex === 0}
                onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#1C1C1C] hover:bg-[#252525] disabled:opacity-40 disabled:pointer-events-none text-white border border-[#2E2E2E] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ChevronLeft size={14} /> Previous Step
              </button>

              <span className="text-[12px] text-[#7E7E7E]">
                Comparing Step <strong className="text-white">{clampedIndex + 1}</strong> of <strong className="text-white">{maxSteps}</strong>
              </span>

              <button
                disabled={clampedIndex >= maxSteps - 1}
                onClick={() => setActiveStepIndex(prev => Math.min(maxSteps - 1, prev + 1))}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#1C1C1C] hover:bg-[#252525] disabled:opacity-40 disabled:pointer-events-none text-white border border-[#2E2E2E] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                Next Step <ChevronRight size={14} />
              </button>
            </div>

          </div>
        );
      })()}

      {/* Screen Lightbox Zoom Modal */}
      {zoomImage && (
        <Dialog open={!!zoomImage} onOpenChange={(open) => !open && setZoomImage(null)}>
          <DialogContent className="max-w-[85vw] max-h-[92vh] w-auto h-auto bg-[#141414] border-[#2E2E2E] p-6 rounded-2xl flex flex-col gap-3 items-center overflow-hidden">
            <div className="flex items-center justify-between w-full pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-white">{zoomImage.appName}</span>
                <span className="text-[13px] text-[#8E8E8E]">· {zoomImage.title}</span>
              </div>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1 rounded-lg hover:bg-[#252525] text-[#AAAAAA] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto flex items-center justify-center p-2">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[72vh] w-auto rounded-lg object-contain shadow-2xl border border-[#2A2A2A]"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. App Showcase Cards Container - ONLY rendered when app screens are actually recommended */}
      {!loading && apps.length > 0 && (
        <div
          className={`flex items-center gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 w-full scroll-smooth ${apps.length <= 3 ? "justify-center" : "justify-start"
            }`}
        >
          {apps.map((app) => (
            <div
              key={app.id}
              className="flex flex-col gap-4 shrink-0 cursor-pointer w-[280px] sm:w-[300px]"
              onClick={() => navigate(app.slug ? `/app/${app.slug}` : "/")}
            >
              {/* Card Container copied from Dashboard.tsx */}
              <div className="bg-[#161616] hover:bg-[#0E0E0E] transition-colors duration-300 rounded-[20px] border border-[#222222] aspect-[4/4.7] w-full relative overflow-hidden group">
                {/* Hover Arrow Button */}
                <div className="absolute top-[16px] right-[16px] w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <ArrowUpRight className="w-4 h-4 text-[#A1A1A1]" />
                </div>

                {/* Phone Preview inside card with fade */}
                <div className="absolute bottom-0 left-[48px] right-[48px] top-[40px] group-hover:left-[42px] group-hover:right-[42px] group-hover:top-[35px] transition-all duration-300 rounded-t-[16px] overflow-hidden bg-white shadow-xl">
                  <img
                    src={app.appThumbnail || revolutScreen}
                    alt={app.name}
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Inside Black Fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#161616] to-transparent z-10 pointer-events-none" />
                  {/* Framer Blur Gradient Component */}
                  <div className="absolute bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] z-20 pointer-events-none" />
                </div>
              </div>

              {/* App Details Below Box copied from Dashboard.tsx */}
              <div className="flex items-center gap-3 px-1">
                <img
                  src={app.appLogo || revolutLogo}
                  alt={`${app.name} Logo`}
                  className="w-10 h-10 rounded-lg object-contain bg-white shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[#EAEAEA] text-[15px] font-medium leading-[20px]">
                    {app.name}
                  </span>
                  <span className="text-[#888888] text-[13px] leading-[16px]">
                    {app.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Subtext Callout below cards - ONLY shown when benchmark evidence / cards are present */}
      {!loading && apps.length > 0 && (
        <div className="mt-2 flex items-center justify-start gap-1.5 w-full">
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "17px",
              color: "#FFFFFF"
            }}
          >
            Convince your stakeholders with a benchmarking report?
          </span>
          <Link
            to="/benchmark"
            className="transition-opacity hover:opacity-90"
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "17px",
              letterSpacing: "-0.24px",
              textDecorationLine: "underline",
              background: "linear-gradient(92.38deg, #FFC7A2 1.05%, #A873E8 98.95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textDecorationColor: "#A873E8"
            }}
          >
            Try Benchmark Mode
          </Link>
        </div>
      )}

      {/* 5. Suggested Follow-up Prompts Pills - ONLY shown when results have finished generating */}
      {!loading && followUps.length > 0 && (
        <div className="mt-4 flex items-center justify-start gap-2.5 w-full overflow-x-auto no-scrollbar py-1">
          {followUps.map((question, qIdx) => (
            <button
              key={qIdx}
              onClick={() => onSelectFollowUp && onSelectFollowUp(question)}
              className="px-3.5 py-1.5 rounded-full text-[12px] bg-[#222222] hover:bg-[#2C2C2C] text-[#C2C2C2] hover:text-white transition-all cursor-pointer border border-[#333333] shrink-0 whitespace-nowrap flex items-center"
            >
              <span>{question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default AIResearchResults;
