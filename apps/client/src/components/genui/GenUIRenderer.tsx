import React, { useState } from "react";
import { Maximize2, X, Sparkles, CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InteractiveFlowModal } from "@/components/InteractiveFlowModal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { motion } from "motion/react";
import type { ScreenType } from "@/hooks/useAppDetails";

// 1. Text Block Section
export function TextBlock({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="prose prose-invert max-w-none text-[#D6D6D6] text-[14px] sm:text-[15px] leading-[26px] prose-p:my-2 prose-strong:text-white prose-strong:font-semibold prose-headings:text-white prose-headings:font-medium prose-ul:my-2 prose-li:my-1">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// 2. Insight Card
export function InsightCard({
  title = "Key UX Takeaways",
  points = [],
}: {
  title?: string;
  points: string[];
}) {
  if (!points || points.length === 0) return null;
  return (
    <div className="my-2 p-4 rounded-xl bg-[#171717] border border-[#2B2B2B] shadow-sm flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-[#A873E8]" />
        <span className="text-[13px] font-semibold text-white tracking-tight">{title}</span>
      </div>
      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {points.map((pt, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#B8B8B8] leading-relaxed">
            <CheckCircle2 size={14} className="text-[#36D399] shrink-0 mt-0.5" />
            <span>{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 3. Screen Gallery (Perplexity/Mobbin style horizontal visual cards with lightbox)
export interface GalleryScreenItem {
  id?: string;
  appName: string;
  screenName: string;
  imageUrl: string;
  tactic?: string;
  description?: string;
  appSlug?: string;
}

export function ScreenGallery({
  title = "Visual Evidence & Screens",
  screens = [],
}: {
  title?: string;
  screens: GalleryScreenItem[];
}) {
  const navigate = useNavigate();
  const [zoomItem, setZoomItem] = useState<GalleryScreenItem | null>(null);

  if (!screens || screens.length === 0) return null;

  return (
    <div className="my-3 flex flex-col gap-3 w-full">
      {title && (
        <span className="text-[13px] font-medium text-[#9E9E9E] uppercase tracking-wider">
          {title}
        </span>
      )}

      {/* Horizontal smooth visual tray */}
      <div
        tabIndex={0}
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 w-full max-w-full scroll-smooth custom-flow-scrollbar focus:outline-none"
      >
        {screens.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2.5 shrink-0 w-[190px] sm:w-[210px] p-2.5 rounded-xl bg-[#161616] border border-[#262626] hover:border-[#3E3E3E] transition-all group/item shadow-sm cursor-pointer"
            onClick={() => setZoomItem(item)}
          >
            {/* Phone Screen Mockup */}
            <div className="w-full aspect-[9/16] rounded-lg overflow-hidden bg-[#0D0D0D] border border-[#222222] relative group-hover/item:border-[#383838] transition-colors">
              <img
                src={item.imageUrl}
                alt={item.screenName}
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/item:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />

              <div className="absolute bottom-2 right-2 p-1.5 rounded-md bg-[#161616]/80 text-white opacity-0 group-hover/item:opacity-100 transition-opacity">
                <Maximize2 size={12} />
              </div>
            </div>

            {/* Info Footer */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[#8E8E8E] uppercase tracking-wider truncate">
                  {item.appName}
                </span>
                {item.tactic && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#232323] text-[#B8B8B8] truncate max-w-[95px]">
                    {item.tactic}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-medium text-white truncate" title={item.screenName}>
                {item.screenName}
              </span>
              {item.description && (
                <p className="text-[11px] text-[#7A7A7A] line-clamp-2 m-0 leading-tight">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      {zoomItem && (
        <Dialog open={!!zoomItem} onOpenChange={(open) => !open && setZoomItem(null)}>
          <DialogContent className="max-w-[85vw] max-h-[92vh] w-auto h-auto bg-[#141414] border-[#2E2E2E] p-6 rounded-2xl flex flex-col gap-3 items-center overflow-hidden">
            <div className="flex items-center justify-between w-full pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-white">{zoomItem.appName}</span>
                <span className="text-[13px] text-[#8E8E8E]">· {zoomItem.screenName}</span>
                {zoomItem.tactic && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#242424] text-[#C0C0C0]">
                    {zoomItem.tactic}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {zoomItem.appSlug && (
                  <button
                    onClick={() => {
                      setZoomItem(null);
                      navigate(`/app/${zoomItem.appSlug}`);
                    }}
                    className="text-[12px] text-[#A873E8] hover:text-[#C59BFA] flex items-center gap-1 transition-colors cursor-pointer mr-2"
                  >
                    Explore App <ChevronRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setZoomItem(null)}
                  className="p-1 rounded-lg hover:bg-[#252525] text-[#AAAAAA] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-[75vh] overflow-y-auto flex items-center justify-center p-2">
              <img
                src={zoomItem.imageUrl}
                alt={zoomItem.screenName}
                className="max-h-[72vh] w-auto rounded-lg object-contain shadow-2xl border border-[#2A2A2A]"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// 4. Comparison Table Component
export function ComparisonTable({
  title = "UX Comparison Matrix",
  headers = ["Dimension", "App A", "App B"],
  rows = [],
}: {
  title?: string;
  headers: string[];
  rows: string[][];
}) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="my-3 flex flex-col gap-2.5 w-full">
      {title && (
        <span className="text-[13px] font-medium text-[#9E9E9E] uppercase tracking-wider">
          {title}
        </span>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#292929] bg-[#141414]">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-[#292929] bg-[#1A1A1A]">
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3.5 font-semibold text-white">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#181818] transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`py-2.5 px-3.5 text-[#B8B8B8] leading-relaxed ${cIdx === 0 ? "font-medium text-white" : ""
                      }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 5. User Journey / Timeline Strip (with quick interactive flow toggle)
export interface TimelineStepItem {
  number: number;
  title: string;
  badge?: string;
  description: string;
  imageUrl?: string;
}

export function TimelineFlow({
  appName,
  appSlug,
  steps = [],
}: {
  appName: string;
  appSlug?: string;
  steps: TimelineStepItem[];
}) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  const modalFlowData = {
    id: (appName || "app").toLowerCase().replace(/\s+/g, '-'),
    name: `${appName || "App"} Onboarding Flow`,
    screens: steps.map((st, i) => ({
      id: `step-${i}`,
      name: st.title,
      slug: `step-${i}`,
      imageUrl: st.imageUrl || "",
      uxAnalysis: st.description,
      screenNo: st.number || i + 1,
      patterns: st.badge ? [{ title: st.badge }] : []
    } as ScreenType))
  };

  return (
    <div className="my-3 p-4 rounded-xl bg-[#151515] border border-[#282828] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-white">{appName} Flow</span>
          <span className="text-[11px] text-[#7C7C7C] font-mono">{steps.length} Steps</span>
        </div>

        <div className="flex items-center gap-2">
          {appSlug && (
            <button
              onClick={() => navigate(`/app/${appSlug}/flows`)}
              className="text-[11px] text-[#9E9E9E] hover:text-white transition-colors cursor-pointer flex items-center gap-0.5"
            >
              All Flows <ChevronRight size={12} />
            </button>
          )}
          <button
            onClick={() => {
              if (appSlug) {
                navigate(`/app/${appSlug}/flows`);
              } else {
                setIsModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 bg-[#232323] hover:bg-[#303030] text-white text-[11px] font-medium px-3 py-1 rounded-full border border-[#353535] transition-all cursor-pointer hover:border-[#0099FF]"
          >
            <ExternalLink size={11} className="text-[#0099FF]" />
            interactive flow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {steps.map((st, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#1B1B1B] border border-[#252525] flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="w-5 h-5 rounded-full bg-[#272727] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {st.number || i + 1}
              </span>
              {st.badge && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#252525] text-[#A873E8] truncate">
                  {st.badge}
                </span>
              )}
            </div>
            <span className="text-[12px] font-medium text-white leading-tight">{st.title}</span>
            <p className="text-[11px] text-[#8E8E8E] leading-snug m-0">{st.description}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <InteractiveFlowModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          flow={modalFlowData}
        />
      )}
    </div>
  );
}

// 6. Interactive Flow Section (1:1 with AppFlows.tsx and InteractiveFlowModal)
export interface FlowScreenItem {
  id: string;
  name: string;
  imageUrl: string;
  slug?: string;
  screenNo?: number;
  uxAnalysis?: string;
  patterns?: { title: string }[];
  uiElements?: { title: string }[];
}

export function InteractiveFlowSection({
  flowName,
  appName,
  appSlug,
  description,
  screens = [],
}: {
  flowName: string;
  appName?: string;
  appSlug?: string;
  description?: string;
  screens: FlowScreenItem[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!screens || screens.length === 0) return null;

  const modalFlowData = {
    id: (flowName || "flow").toLowerCase().replace(/\s+/g, '-'),
    name: `${appName ? appName + ' · ' : ''}${flowName || "User Flow"}`,
    screens: screens.map((s, idx) => ({
      id: s.id || `flow-screen-${idx}`,
      name: s.name || `Screen ${idx + 1}`,
      slug: s.slug || `screen-${idx + 1}`,
      imageUrl: s.imageUrl,
      uxAnalysis: s.uxAnalysis,
      patterns: s.patterns || [],
      uiElements: s.uiElements || [],
      screenNo: s.screenNo ?? idx + 1
    } as ScreenType))
  };

  return (
    <div className="my-4 p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col gap-4 shadow-xl w-full min-w-0 max-w-full overflow-hidden">
      {/* Flow Header with Interactive Flow Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#242424] gap-4 w-full min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0099FF] animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-[16px] text-white tracking-tight m-0 truncate">
                {flowName}
              </h3>
              {appName && (
                <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#222222] text-[#A6A6A6] border border-[#303030] shrink-0">
                  {appName}
                </span>
              )}
            </div>
            {description && (
              <p className="text-[12px] text-[#858585] m-0 mt-0.5 leading-snug truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action: Open Fullscreen Interactive Flow Modal */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {appSlug && (
            <button
              onClick={() => navigate(`/app/${appSlug}/flows`)}
              className="text-[12px] text-[#A0A0A0] hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-[#202020] flex items-center gap-1 shrink-0"
            >
              All Flows <ChevronRight size={13} />
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#252525] hover:bg-[#323232] text-white text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-[#3A3A3A] transition-all cursor-pointer shadow-sm hover:border-[#0099FF] shrink-0"
          >
            <ExternalLink size={12} className="text-[#0099FF]" />
            interactive flow
          </button>
        </div>
      </div>

      {/* Screen Thumbnails Embla Carousel with Wheel Gestures */}
      <div className="relative w-full max-w-full min-w-0 px-1 group/carousel">
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            dragFree: true,
          }}
          plugins={[WheelGesturesPlugin()]}
          className="w-full max-w-full cursor-grab active:cursor-grabbing"
        >
          <CarouselContent className="-ml-4 sm:-ml-5 py-2">
            {screens.map((screen, idx) => (
              <CarouselItem
                key={screen.id || idx}
                className="pl-4 sm:pl-5 basis-[220px] sm:basis-[240px] shrink-0 grow-0"
              >
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-col gap-2.5 p-2.5 rounded-2xl bg-[#161616] border border-[#242424] hover:border-[#0099FF]/70 transition-all cursor-pointer group shadow-xl w-full select-none"
                >
                  {/* Same aspect ratio aspect-[230/500] and rounded-[20px] as AppFlows & InteractiveFlowModal */}
                  <div className="w-full aspect-[230/500] rounded-[20px] overflow-hidden bg-[#121212] border border-[#222222] relative group-hover:border-[#383838] transition-colors">
                    <img
                      src={screen.imageUrl}
                      alt={screen.name}
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/85 border border-white/10 backdrop-blur-md text-[10px] font-mono font-medium text-white shadow-md z-10">
                      #{idx + 1}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[11px] text-white font-medium flex items-center gap-1.5">
                        <Maximize2 size={11} /> Inspect flow
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 px-1 pb-0.5">
                    <span className="text-[12px] font-medium text-white truncate" title={screen.name}>
                      {screen.name}
                    </span>
                    {screen.uxAnalysis && (
                      <p className="text-[11px] text-[#8E8E8E] line-clamp-2 m-0 leading-snug" title={screen.uxAnalysis.replace(/<[^>]+>/g, '')}>
                        {screen.uxAnalysis.replace(/<[^>]+>/g, '')}
                      </p>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Fullscreen Interactive Flow Modal */}
      <InteractiveFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        flow={modalFlowData}
        appSlug={appSlug}
      />
    </div>
  );
}

// 6. Single Screen Focus Card
export function SingleScreenCard({
  appName,
  appSlug,
  screenName,
  imageUrl,
  uxAnalysis,
  keyHighlights,
  flowName,
}: {
  appName?: string;
  appSlug?: string;
  screenName?: string;
  imageUrl?: string;
  uxAnalysis?: string;
  keyHighlights?: string;
  flowName?: string;
}) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const navigate = useNavigate();

  if (!imageUrl) return null;

  return (
    <div className="my-3 rounded-2xl bg-[#141414] border border-[#262626] p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start">
      {/* Screen Preview Container */}
      <div 
        className="relative group shrink-0 w-full sm:w-[220px] rounded-xl overflow-hidden bg-black/60 border border-[#2D2D2D] cursor-pointer"
        onClick={() => setZoomOpen(true)}
      >
        <img
          src={imageUrl}
          alt={screenName || "Screen focus"}
          className="w-full h-auto max-h-[360px] object-contain transition-transform duration-300 group-hover:scale-102"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[12px] flex items-center gap-1.5">
            <Maximize2 size={13} />
            <span>Enlarge</span>
          </div>
        </div>
      </div>

      {/* Screen UX Context */}
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[11px] font-medium border border-[#333]">
            {appName || "App Screen"}
          </span>
          {flowName && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E1B2E] text-[#B89AFF] text-[11px] font-medium border border-[#3E3466]">
              {flowName}
            </span>
          )}
          <span className="text-[11px] text-[#666]">Focus Screen</span>
        </div>

        <h4 className="text-[16px] font-semibold text-white tracking-tight m-0">
          {screenName || "Screen Breakdown"}
        </h4>

        {uxAnalysis && (
          <div className="text-[13px] text-[#C4C4C4] leading-relaxed prose prose-invert prose-p:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{uxAnalysis}</ReactMarkdown>
          </div>
        )}

        {keyHighlights && (
          <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2B2B2B] text-[12px] text-[#A5A5A5] leading-normal flex items-start gap-2">
            <Sparkles size={14} className="text-[#A873E8] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-white mr-1.5">Key Principle:</span>
              <span className="text-[#C4C4C4]">{keyHighlights.replace(/<[^>]*>?/gm, '')}</span>
            </div>
          </div>
        )}

        {appSlug && (
          <button
            onClick={() => navigate(`/apps/${appSlug}`)}
            className="self-start mt-1 text-[12px] text-[#8E8E8E] hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Explore all flows for {appName || "this app"}</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Zoom Dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-[650px] p-2 bg-[#121212] border-[#2A2A2A] text-white">
          <div className="flex flex-col items-center">
            <img
              src={imageUrl}
              alt={screenName || "Zoomed screen"}
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
            <p className="text-[13px] text-[#A0A0A0] mt-2 mb-1">{screenName}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// DYNAMIC COMPONENT MAP & RENDERER
// ==========================================
export interface GenUISection {
  type: "text" | "screen_gallery" | "comparison_table" | "insight_card" | "timeline" | "interactive_flow" | "single_screen";
  content?: string;
  title?: string;
  points?: string[];
  screens?: any[];
  headers?: string[];
  rows?: string[][];
  appName?: string;
  appSlug?: string;
  flowName?: string;
  screenName?: string;
  imageUrl?: string;
  uxAnalysis?: string;
  keyHighlights?: string;
  description?: string;
  steps?: TimelineStepItem[];
}

const componentRegistry: Record<string, React.ComponentType<any>> = {
  text: TextBlock,
  comparison_table: ComparisonTable,
  insight_card: InsightCard,
  timeline: TimelineFlow,
  interactive_flow: InteractiveFlowSection,
  single_screen: SingleScreenCard,
};

export function DynamicGenUIRenderer({ sections }: { sections: GenUISection[] }) {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 max-w-full">
      {sections.map((section, idx) => {
        const Component = componentRegistry[section.type];
        if (!Component) return null;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: idx * 0.12,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="w-full min-w-0 max-w-full"
          >
            <Component {...section} />
          </motion.div>
        );
      })}
    </div>
  );
}

