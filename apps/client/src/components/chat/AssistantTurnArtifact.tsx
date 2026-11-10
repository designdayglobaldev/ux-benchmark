import { useState } from "react";
import { ArrowUpRight, Layers, ChevronLeft, ChevronRight, Maximize2, X, ThumbsUp, ThumbsDown, Check, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZiboAiIcon } from "../ZiboAiIcon";
import { DynamicGenUIRenderer } from "../genui/GenUIRenderer";
import revolutScreen from "../../assets/Revolut.png";
import revolutLogo from "../../assets/Revolut_logo.png";
import { useAuth } from "../../contexts/AuthContext";
import type { ChatTurn, ComparisonFlow, FlowStep, AIResearchApp } from "../../types/ai-chat.types";

interface AssistantTurnArtifactProps {
  turn: ChatTurn;
  onSelectFollowUp?: (question: string) => void;
}

export function AssistantTurnArtifact({
  turn,
  onSelectFollowUp,
}: AssistantTurnArtifactProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = turn.data;

  // Local state for this specific turn artifact
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; appName: string } | null>(null);
  const [rating, setRating] = useState<number | null>(turn.rating ?? null);
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [correctionInput, setCorrectionInput] = useState("");

  if (!data) {
    return (
      <div className="w-full flex items-start gap-4 mb-8">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg mt-1">
          <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
            <ZiboAiIcon size={18} className="text-white" />
          </div>
        </div>
        <div className="flex-1 bg-[#181818] border border-[#2A2A2A] rounded-2xl p-4 text-[14px] text-[#A8A8A8]">
          {turn.content || "Generating benchmark synthesis..."}
        </div>
      </div>
    );
  }

  const { introText, sections = [], apps = [], comparisonFlows = [], suggestedFollowUps = [] } = data;
  const isStreaming = turn.isStreaming;
  const hasBodyContent = !!introText || sections.length > 0 || apps.length > 0 || comparisonFlows.length > 0;

  const handleRating = async (val: number) => {
    setRating(val);
    if (turn.messageId && user?.id) {
      const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const baseApi = rawApiUrl.replace(/\/$/, "");
      const prefix = baseApi.includes("/api/v1") ? baseApi : `${baseApi}/api/v1`;
      try {
        await fetch(`${prefix}/ai/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: turn.messageId, userId: user.id, rating: val }),
        });
      } catch (err) {
        console.warn("Feedback submit failed:", err);
      }
    }
  };

  const handleCorrectionSubmit = async () => {
    if (turn.messageId && user?.id) {
      const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
      const baseApi = rawApiUrl.replace(/\/$/, "");
      const prefix = baseApi.includes("/api/v1") ? baseApi : `${baseApi}/api/v1`;
      try {
        await fetch(`${prefix}/ai/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: turn.messageId,
            userId: user.id,
            rating: -1,
            correctionText: correctionInput,
          }),
        });
      } catch (err) {
        console.warn("Correction submit failed:", err);
      }
    }
    setFeedbackOpen(false);
  };

  return (
    <div className="w-full flex items-start gap-3.5 sm:gap-4 mb-10 min-w-0">
      {/* 1. Left AI Avatar Icon */}
      <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg mt-1">
        <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
          <ZiboAiIcon size={18} className="text-white" />
        </div>
      </div>

      {/* 2. Main Response Body */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        
        {/* If streaming and no text/content has arrived yet, show subtle thinking animation inline */}
        {isStreaming && !hasBodyContent && (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span className="text-[13px] font-medium text-purple-300">
              Analyzing design patterns & generating benchmarks...
            </span>
          </div>
        )}

        {/* Intro Markdown Text */}
        {introText && (
          <div className="prose prose-invert max-w-none text-[#E0E0E0] text-[14px] sm:text-[15px] leading-[26px] font-normal tracking-[-0.01em] prose-headings:font-medium prose-headings:text-white prose-p:my-2.5 prose-strong:text-white prose-strong:font-semibold prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{introText}</ReactMarkdown>
          </div>
        )}

        {/* Dynamic GenUI Sections (Interactive Flow Carousels, Insight Cards, Text Blocks) */}
        {sections.length > 0 && (
          <div className="flex flex-col gap-5 w-full">
            <DynamicGenUIRenderer sections={sections} />
          </div>
        )}

        {/* Interactive Comparison Flows (Dual-App Step Comparison View) */}
        {comparisonFlows.length > 0 && (() => {
          const maxSteps = Math.max(...comparisonFlows.map((f: ComparisonFlow) => f.steps.length), 1);
          const clampedIndex = Math.min(activeStepIndex, maxSteps - 1);

          return (
            <div className="flex flex-col gap-4 my-2 w-full rounded-2xl bg-[#121212] border border-[#252525] p-5 shadow-2xl overflow-hidden">
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
                    const isSelected = stepIdx === clampedIndex;
                    return (
                      <button
                        key={stepIdx}
                        onClick={() => setActiveStepIndex(stepIdx)}
                        className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#2E2E2E] text-white shadow-sm"
                            : "text-[#888888] hover:text-white hover:bg-[#222222]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "#A873E8" : "#555555" }} />
                        Step {stepIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Synchronized App Screen Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {comparisonFlows.map((flow: ComparisonFlow, fIdx: number) => {
                  const currentStep: FlowStep | undefined = flow.steps[clampedIndex] || flow.steps[flow.steps.length - 1];
                  return (
                    <div
                      key={fIdx}
                      className="flex flex-col gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626] relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {flow.appLogo ? (
                            <img src={flow.appLogo} alt={flow.appName} className="w-7 h-7 rounded-lg object-contain bg-white shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {flow.appName.charAt(0)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-[14px] text-white leading-tight">
                              {flow.appName}
                            </span>
                            <span className="text-[11px] text-[#7C7C7C]">
                              Step {clampedIndex + 1}: {currentStep?.title || "Screen"}
                            </span>
                          </div>
                        </div>

                        {flow.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#242424] text-[#A873E8] border border-[#333333]">
                            {flow.badge}
                          </span>
                        )}
                      </div>

                      {/* Screen Preview Frame */}
                      <div className="relative aspect-[9/16] max-h-[380px] w-full bg-[#0A0A0A] rounded-xl overflow-hidden border border-[#2A2A2A] flex items-center justify-center group/screen">
                        {currentStep?.screenImageUrl ? (
                          <img
                            src={currentStep.screenImageUrl}
                            alt={currentStep.title}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/screen:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[#555555] gap-2 p-4 text-center">
                            <span className="text-xs">No direct screen capture available</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            if (currentStep?.screenImageUrl) {
                              setZoomImage({
                                url: currentStep.screenImageUrl,
                                title: currentStep.title,
                                appName: flow.appName,
                              });
                            }
                          }}
                          className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] font-medium backdrop-blur-md border border-white/20 flex items-center gap-1.5 opacity-0 group-hover/screen:opacity-100 transition-opacity cursor-pointer shadow-lg"
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

        {/* App Showcase Cards Container */}
        {apps.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <div
              className={`flex items-center gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 w-full scroll-smooth ${
                apps.length <= 3 ? "justify-start" : "justify-start"
              }`}
            >
              {apps.map((app: AIResearchApp) => (
                <div
                  key={app.id}
                  className="flex flex-col gap-4 shrink-0 cursor-pointer w-[280px] sm:w-[300px]"
                  onClick={() => navigate(app.slug ? `/app/${app.slug}` : "/")}
                >
                  <div className="bg-[#161616] hover:bg-[#0E0E0E] transition-colors duration-300 rounded-[20px] border border-[#222222] aspect-[4/4.7] w-full relative overflow-hidden group">
                    <div className="absolute top-[16px] right-[16px] w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <ArrowUpRight className="w-4 h-4 text-[#A1A1A1]" />
                    </div>

                    <div className="absolute bottom-0 left-[48px] right-[48px] top-[40px] group-hover:left-[42px] group-hover:right-[42px] group-hover:top-[35px] transition-all duration-300 rounded-t-[16px] overflow-hidden bg-white shadow-xl">
                      <img
                        src={app.appThumbnail || revolutScreen}
                        alt={app.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#161616] to-transparent z-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] z-20 pointer-events-none" />
                    </div>
                  </div>

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

            {/* Subtext Callout below cards */}
            <div className="flex items-center justify-start gap-1.5 w-full pt-1">
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "17px",
                  color: "#FFFFFF",
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
                  textDecorationColor: "#A873E8",
                }}
              >
                Try Benchmark Mode
              </Link>
            </div>
          </div>
        )}

        {/* 4. Action Toolbar: Like, Dislike (Correction), Copy - Only shown after generation is done */}
        {!isStreaming && hasBodyContent && (
          <div className="flex items-center gap-3 text-[12px] text-[#8E8E8E] pt-3 pb-1 border-t border-[#222222]/80 mt-2">
            <div className="flex items-center gap-1 bg-[#181818] border border-[#2A2A2A] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => handleRating(1)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  rating === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "hover:bg-[#222222] hover:text-white"
                }`}
                title="Accurate UX recommendation (Upvote for model training)"
              >
                <ThumbsUp size={13} />
                <span>Helpful</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRating(-1);
                  setFeedbackOpen(!feedbackOpen);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  rating === -1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "hover:bg-[#222222] hover:text-white"
                }`}
                title="Inaccurate or needs correction (Feedback for model training)"
              >
                <ThumbsDown size={13} />
                <span>Correction</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (introText) {
                  navigator.clipboard.writeText(introText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-[#222222] hover:text-white transition-all cursor-pointer bg-[#181818] border border-[#2A2A2A]"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}

        {/* Designer Correction Popover Form */}
        {feedbackOpen && (
          <div className="p-3 rounded-lg bg-[#181818] border border-[#333333] flex flex-col gap-2 max-w-xl">
            <span className="text-xs font-medium text-white">How should the AI have answered?</span>
            <textarea
              value={correctionInput}
              onChange={(e) => setCorrectionInput(e.target.value)}
              placeholder="e.g. Standard fintech flow should prioritize phone OTP before asking for Passport/ID..."
              className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded p-2 text-xs text-white focus:outline-none placeholder:text-[#666666]"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="px-2.5 py-1 text-xs rounded hover:bg-[#252525] text-[#888888]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCorrectionSubmit}
                className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-medium cursor-pointer"
              >
                Submit Correction
              </button>
            </div>
          </div>
        )}

        {/* 5. Suggested Follow-up Prompts Pills - Only shown after generation is done */}
        {!isStreaming && suggestedFollowUps.length > 0 && (
          <div className="mt-1 flex items-center justify-start gap-2.5 w-full overflow-x-auto no-scrollbar py-1">
            {suggestedFollowUps.map((question: string, qIdx: number) => (
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
    </div>
  );
}
