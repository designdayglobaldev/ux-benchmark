import { useState } from "react";
import { ArrowUpRight, Layers, Maximize2, ThumbsUp, ThumbsDown, Check, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { MESSAGE_ANIMATIONS } from "@/lib/message-animations";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZiboAiIcon } from "../ZiboAiIcon";
import { FeedbackModal } from "../FeedbackModal";
import { DynamicGenUIRenderer } from "../genui/GenUIRenderer";
import { ChainOfThought } from "./ChainOfThought";
import { Suggestion } from "./Suggestion";
import revolutScreen from "../../assets/Revolut.png";
import revolutLogo from "../../assets/Revolut_logo.png";
import { useAuth } from "../../contexts/AuthContext";
import type { ChatTurn, ComparisonFlow, AIResearchApp } from "../../types/ai-chat.types";

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

  const introText = data?.introText || "";
  const sections = data?.sections || [];
  const comparisonFlows = data?.comparisonFlows || [];
  const suggestedFollowUps = data?.suggestedFollowUps || [];
  const isStreaming = turn.isStreaming;
  const hasBodyContent = Boolean(introText || sections.length > 0 || (data?.apps && data.apps.length > 0) || comparisonFlows.length > 0);

  // If streaming and no body content has arrived yet, show live Chain of Thought Trace
  if (isStreaming && !hasBodyContent) {
    return (
      <div className="w-full flex items-start gap-3 sm:gap-3.5 mb-8">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg mt-0.5">
          <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
            <ZiboAiIcon size={18} className="text-white" />
          </div>
        </div>
        <div className="flex-1 max-w-2xl">
          <ChainOfThought
            steps={data?.thoughtSteps}
            defaultOpen={true}
            streaming={true}
            answering={false}
          />
        </div>
      </div>
    );
  }

  // If not streaming and still no data, show completed trace placeholder
  if (!data) {
    return (
      <div className="w-full flex items-start gap-3 sm:gap-3.5 mb-8">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg mt-0.5">
          <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
            <ZiboAiIcon size={18} className="text-white" />
          </div>
        </div>
        <div className="flex-1 max-w-2xl">
          <ChainOfThought
            defaultOpen={false}
            streaming={false}
            answering={true}
          />
        </div>
      </div>
    );
  }

  const handleRating = async (val: number) => {
    setRating(val);
    if (turn.messageId && user?.id) {
      const rawApiUrl = import.meta.env.PROD ? "/api/v1" : (import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1");
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

  return (
    <Message className="w-full mb-10 min-w-0">
      {/* 1. Left AI Avatar Icon */}
      <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-[1.5px] shrink-0 shadow-lg select-none">
        <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
          <ZiboAiIcon size={18} className="text-white" />
        </div>
      </div>

      {/* 2. Main Response Body */}
      <MessageContent className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Chain of Thought built on official shadcn Trace + Badge */}
        {hasBodyContent && (
          <ChainOfThought
            steps={data.thoughtSteps}
            durationSeconds={data.thoughtDurationSeconds}
            defaultOpen={false}
            streaming={false}
            answering={true}
          />
        )}

        {/* Intro Markdown Text (Claude style: clean streaming without trailing cursor line) */}
        {introText && (
          <div className="prose prose-invert max-w-none text-[#E0E0E0] text-[14px] sm:text-[15px] leading-[26px] font-normal tracking-[-0.01em] prose-headings:font-medium prose-headings:text-white prose-p:my-2.5 prose-strong:text-white prose-strong:font-semibold prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{introText}</ReactMarkdown>
          </div>
        )}

        {/* Dynamic GenUI Sections (Interactive Flow Carousels, Insight Cards, Text Blocks) - Animated Entrance */}
        <AnimatePresence mode="popLayout">
          {!isStreaming && sections.length > 0 && (() => {
            const filteredSections = sections.filter((sec) => {
              if (sec.type === "text" && sec.content) {
                const trimmedContent = sec.content.trim().toLowerCase();
                const trimmedIntro = introText.trim().toLowerCase();
                return trimmedContent !== trimmedIntro && !trimmedIntro.startsWith(trimmedContent.slice(0, 50));
              }
              return true;
            });

            if (filteredSections.length === 0) return null;

            return (
              <motion.div
                key="genui-sections"
                initial={MESSAGE_ANIMATIONS["slide-up"].variants.initial}
                animate={MESSAGE_ANIMATIONS["slide-up"].variants.animate}
                className="flex flex-col gap-5 w-full"
              >
                <DynamicGenUIRenderer sections={filteredSections} />
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Interactive Comparison Flows (Dual-App Step Comparison View) - Animated Entrance */}
        <AnimatePresence mode="popLayout">
          {!isStreaming && comparisonFlows.length > 0 && (() => {
            const maxSteps = Math.max(...comparisonFlows.map((f: ComparisonFlow) => f.steps.length), 1);
            const clampedIndex = Math.min(activeStepIndex, maxSteps - 1);

            return (
              <motion.div
                key="comparison-flows"
                initial={MESSAGE_ANIMATIONS["slide-up"].variants.initial}
                animate={MESSAGE_ANIMATIONS["slide-up"].variants.animate}
                className="flex flex-col gap-4 my-2 w-full rounded-2xl bg-[#121212] border border-[#252525] p-5 shadow-2xl overflow-hidden"
              >
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
                            : "text-[#8E8E8E] hover:text-[#C2C2C2] hover:bg-[#222222]"
                        }`}
                      >
                        <span>Step {stepIdx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual-App Comparison Grid (Synchronized Side-by-Side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonFlows.map((flow: ComparisonFlow, flowIdx: number) => {
                  const step = flow.steps[clampedIndex] || flow.steps[flow.steps.length - 1];
                  const hasImage = Boolean(step?.screenImageUrl);
                  const isRevolutFallback = flow.appName.toLowerCase().includes("revolut");
                  const displayImage = hasImage ? step.screenImageUrl! : isRevolutFallback ? revolutScreen : null;

                  return (
                    <div
                      key={flow.appName || flowIdx}
                      className="flex flex-col rounded-xl bg-[#171717] border border-[#262626] overflow-hidden group hover:border-[#383838] transition-all"
                    >
                      {/* App Header & Step Indicator */}
                      <div className="flex items-center justify-between p-3.5 bg-[#1C1C1C] border-b border-[#262626]">
                        <div className="flex items-center gap-2.5">
                          {flow.appLogo ? (
                            <img
                              src={flow.appLogo}
                              alt={flow.appName}
                              className="w-6 h-6 rounded-md object-contain bg-[#222]"
                            />
                          ) : isRevolutFallback ? (
                            <img
                              src={revolutLogo}
                              alt={flow.appName}
                              className="w-6 h-6 rounded-md object-contain"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-[#252525] flex items-center justify-center text-[11px] font-bold text-white">
                              {flow.appName.charAt(0)}
                            </div>
                          )}
                          <span className="text-[13px] font-semibold text-white">
                            {flow.appName}
                          </span>
                        </div>

                        {flow.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#252525] text-[#A873E8] border border-[#353535]">
                            {flow.badge}
                          </span>
                        )}
                      </div>

                      {/* Screen Image Preview with Click-to-Zoom */}
                      <div
                        onClick={() => {
                          if (displayImage) {
                            setZoomImage({
                              url: displayImage,
                              title: step?.title || `Step ${clampedIndex + 1}`,
                              appName: flow.appName,
                            });
                          }
                        }}
                        className="relative w-full h-[320px] bg-[#0D0D0D] flex items-center justify-center p-3 cursor-pointer overflow-hidden group/img"
                      >
                        {displayImage ? (
                          <>
                            <img
                              src={displayImage}
                              alt={step?.title || flow.appName}
                              className="max-h-full max-w-full object-contain rounded-lg shadow-md transition-transform duration-300 group-hover/img:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-white text-xs font-medium backdrop-blur flex items-center gap-1.5">
                                <Maximize2 size={13} /> Inspect Screen
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-[#666666] text-xs">
                            <p className="font-medium text-[#888888] mb-1">Interactive Screen Visual</p>
                            <p>No preview capture available for this step</p>
                          </div>
                        )}
                      </div>

                      {/* UX Tactical Rationale Footer */}
                      <div className="p-3.5 bg-[#171717] border-t border-[#242424] flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-[#A873E8] uppercase tracking-wider">
                          Step {clampedIndex + 1}: {step?.title || "Verification Step"}
                        </span>
                        <p className="text-[12px] text-[#A8A8A8] m-0 leading-relaxed">
                          {step?.uxTactic || step?.description || "Optimized frictionless micro-step interaction."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
        </AnimatePresence>

        {/* Modal: Fullscreen Zoom Inspector for Screen Capture */}
        <Dialog open={Boolean(zoomImage)} onOpenChange={(open) => !open && setZoomImage(null)}>
          <DialogContent className="max-w-4xl bg-[#141414] border border-[#262626] p-4 text-white overflow-hidden flex flex-col items-center">
            {zoomImage && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center justify-between w-full pb-2 border-b border-[#242424]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{zoomImage.appName}</h4>
                    <p className="text-xs text-[#888888]">{zoomImage.title}</p>
                  </div>
                </div>
                <div className="max-h-[75vh] overflow-auto flex items-center justify-center p-2 bg-[#0A0A0A] rounded-xl w-full">
                  <img
                    src={zoomImage.url}
                    alt={zoomImage.title}
                    className="max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* App Showcase Cards Container - High-fidelity visual cards for benchmarked apps */}
        {!isStreaming && data.apps && data.apps.length > 0 && (
          <div className="flex flex-col gap-3 pt-2 animate-in fade-in duration-500">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-3 pt-1 w-full scroll-smooth justify-start">
              {data.apps.map((app: AIResearchApp) => (
                <div
                  key={app.id || app.name}
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
          <MessageFooter className="gap-3 text-[12px] text-[#8E8E8E] pt-3 pb-1 border-t border-[#222222]/80 mt-2 select-none">
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
                  setFeedbackOpen(true);
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
          </MessageFooter>
        )}

        {/* Feedback / Correction Modal (Tailored for UX AI Recommendation Correction) */}
        <FeedbackModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          messageId={turn.messageId}
          userId={user?.id}
          initialRating={3}
          title="Improve this recommendation"
          subtitle="Your correction directly trains and refines our UX benchmark synthesis model."
          ratingQuestion="How accurately did this recommendation answer your prompt?"
          feedbackLabel="How should the AI have answered, or what was inaccurate?"
          feedbackPlaceholder="e.g. For fintech onboarding, KYC identity verification should happen progressively after phone OTP, not upfront..."
          submitButtonText="Submit Correction"
          onSubmitSuccess={() => {
            setRating(-1);
            setFeedbackOpen(false);
          }}
        />

        {/* 5. Suggested Follow-up Prompts (shadcn Suggestion Element Pattern) */}
        {!isStreaming && suggestedFollowUps.length > 0 && (
          <Suggestion
            suggestions={suggestedFollowUps}
            onSelect={(q) => onSelectFollowUp && onSelectFollowUp(q)}
          />
        )}

      </MessageContent>
    </Message>
  );
}

export default AssistantTurnArtifact;
