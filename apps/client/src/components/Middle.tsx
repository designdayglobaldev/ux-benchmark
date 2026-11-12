import { useState, useRef, useEffect, useMemo } from 'react';
import type { ScreenType } from "@/hooks/useAppDetails";
import { useInspectMode } from "@/contexts/InspectContext";
import type { Region } from "./RegionSelector";
import { HotspotMode } from './HotspotMode';
import { CompareMode } from './CompareMode';
import { useScreenInspect } from '@/hooks/queries/useScreenInspect';
import { useScreenInsights } from '@/hooks/queries/useScreenInsights';
import { ScreenCanvasViewport } from './viewer/ScreenCanvasViewport';
import { ScreenInspectModal } from './viewer/ScreenInspectModal';
import { ScreenChatbarInline } from './viewer/ScreenChatbarInline';

interface MiddleProps {
  activeScreen?: ScreenType;
  appName?: string;
  appSlug?: string;
  nextUrl?: string;
  prevUrl?: string;
}

export function Middle({ activeScreen, appName, appSlug, nextUrl, prevUrl }: MiddleProps) {
  const { isInspectMode, setIsInspectMode } = useInspectMode();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isHotspotMode, setIsHotspotMode] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  // Hook for Vision Inspection Mutation
  const {
    aiResponse,
    lastSubmittedPrompt,
    lastSubmittedRegion,
    isAiLoading,
    inspect,
    clearInspection
  } = useScreenInspect();

  // Prevent body scrolling when Hotspot Mode is active
  useEffect(() => {
    if (isHotspotMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isHotspotMode]);

  const loadingMessages = [
    "Analyzing UI elements...",
    "Identifying UX patterns...",
    "Applying design heuristics...",
    "Formulating insights...",
    "Almost done..."
  ];

  useEffect(() => {
    setIsImageLoaded(false);
    setSelectedRegion(null);
    setImageBase64(null);

    const checkImage = () => {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsImageLoaded(true);
        captureImageBase64();
      }
    };
    
    checkImage();
    const timeout = setTimeout(checkImage, 50);
    const timeout2 = setTimeout(checkImage, 200);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [activeScreen?.imageUrl]);

  const urlToBase64 = async (url: string): Promise<string> => {
    if (url.startsWith('data:image')) return url;
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const captureImageBase64 = async () => {
    if (imgRef.current && imgRef.current.naturalWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = imgRef.current.naturalWidth;
        canvas.height = imgRef.current.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgRef.current, 0, 0);
          const b64 = canvas.toDataURL('image/jpeg', 0.8);
          setImageBase64(b64);
          return;
        }
      } catch (e) {
        console.warn('Canvas export failed, falling back to fetch blob:', e);
      }
    }

    // Fallback: fetch directly from activeScreen.imageUrl
    if (activeScreen?.imageUrl) {
      try {
        const b64 = await urlToBase64(activeScreen.imageUrl);
        setImageBase64(b64);
      } catch (err) {
        console.warn('Failed to convert imageUrl to base64:', err);
      }
    }
  };

  // TanStack Query for caching Screen Insights
  const { data: insightsData = [], isLoading: isInsightsLoading } = useScreenInsights(
    activeScreen?.id,
    appName,
    imageBase64,
    isHotspotMode
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAiLoading || isInsightsLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAiLoading, isInsightsLoading]);

  const { balancedData } = useMemo(() => {
    if (!insightsData.length) return { balancedData: [] };
    const imgWidth = imgRef.current?.naturalWidth || 400;
    const imgHeight = imgRef.current?.naturalHeight || 850;
    const normalizedData = insightsData.map(insight => {
      let nx = insight.x > 100 ? (insight.x / imgWidth) * 100 : insight.x;
      let ny = insight.y > 100 ? (insight.y / imgHeight) * 100 : insight.y;
      return { ...insight, x: Math.max(3, Math.min(97, nx)), y: Math.max(5, Math.min(95, ny)) };
    });
    const sortedByX = [...normalizedData].sort((a, b) => a.x - b.x);
    const leftHalf = sortedByX.slice(0, Math.ceil(sortedByX.length / 2)).sort((a, b) => a.y - b.y);
    const rightHalf = sortedByX.slice(Math.ceil(sortedByX.length / 2)).sort((a, b) => a.y - b.y);
    return { balancedData: [...leftHalf, ...rightHalf] };
  }, [insightsData]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !imgRef.current) return;

    let base64 = imageBase64;
    if (!base64) {
      const canvas = document.createElement('canvas');
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgRef.current, 0, 0);
        base64 = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    if (!base64) return;

    let scaledRegion = null;
    if (selectedRegion && imgRef.current) {
      const scaleX = imgRef.current.naturalWidth / imgRef.current.clientWidth;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.clientHeight;
      scaledRegion = {
        x: selectedRegion.x * scaleX,
        y: selectedRegion.y * scaleY,
        width: selectedRegion.width * scaleX,
        height: selectedRegion.height * scaleY
      };
    }

    const currentPrompt = prompt;
    setPrompt('');
    setIsInspectMode(false);

    await inspect({
      prompt: currentPrompt,
      region: scaledRegion,
      imageBase64: base64
    });
  };

  return (
    <div className="w-full flex justify-center xl:sticky xl:top-[30px] mt-8 xl:mt-[30px] z-10">
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col items-center gap-6">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-center gap-[7px] font-['Inter'] text-[13px] font-medium leading-[16px] w-full mb-4 whitespace-nowrap">
            {appSlug ? (
              <a href={`/app/${appSlug}`} className="text-[#878787] hover:text-white transition-colors cursor-pointer decoration-transparent">
                {appName || 'App Name'}
              </a>
            ) : (
              <span className="text-[#878787]">{appName || 'App Name'}</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {appSlug ? (
              <a href={`/app/${appSlug}/flows`} className="text-[#878787] hover:text-white transition-colors cursor-pointer decoration-transparent">
                Flows
              </a>
            ) : (
              <span className="text-[#878787]">{activeScreen?.flow?.name || 'Flows'}</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-white">{activeScreen?.name || 'Screen'}</span>
          </div>

          {/* Screen Canvas Viewport */}
          <ScreenCanvasViewport 
            activeScreen={activeScreen}
            appName={appName}
            imgRef={imgRef}
            isImageLoaded={isImageLoaded}
            onImageLoad={() => {
              setIsImageLoaded(true);
              captureImageBase64();
            }}
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            isInspectMode={isInspectMode}
            onCloseInspect={() => setIsInspectMode(false)}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
          />

          {/* Global Dim Overlay for Inspect Mode */}
          {isInspectMode && (
            <div className="fixed inset-0 bg-black/80 z-40 pointer-events-none transition-opacity duration-300" />
          )}

          {/* Action Buttons */}
          {!isInspectMode && (
            <div className="flex items-center gap-[10px] mt-[15px]">
              <button 
                onClick={() => setIsHotspotMode(true)}
                className="flex items-center justify-center gap-[4px] w-[170px] h-[40px] px-4 rounded-[20px] border border-[#323232] bg-transparent text-white hover:bg-white/5 transition-colors font-['Inter'] text-[14px] font-medium whitespace-nowrap"
              >
                <img src="/hotspot.svg" alt="Hotspots" className="w-4 h-4" />
                UI Hotspots
              </button>
              <button 
                onClick={() => setIsCompareMode(true)}
                className="flex items-center justify-center gap-[4px] w-[170px] h-[40px] px-4 rounded-[20px] border border-[#323232] bg-transparent text-white hover:bg-white/5 transition-colors font-['Inter'] text-[14px] font-medium whitespace-nowrap"
              >
                <img src="/compare.svg" alt="Compare" className="w-4 h-4" />
                Compare screens
              </button>
            </div>
          )}

          {/* AI Chatbar (Inline) */}
          {!(isAiLoading || aiResponse) && (
            <ScreenChatbarInline 
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handleAiSubmit}
              isInspectMode={isInspectMode}
              onToggleInspect={() => setIsInspectMode(!isInspectMode)}
              selectedRegion={selectedRegion}
              onClearRegion={() => setSelectedRegion(null)}
              isAiLoading={isAiLoading}
              activeScreenImageUrl={activeScreen?.imageUrl}
            />
          )}
        </div>
      </div>

      {/* Chat Modal (Bottom Sheet) */}
      <ScreenInspectModal 
        isOpen={Boolean(isAiLoading || aiResponse)}
        onClose={clearInspection}
        isAiLoading={isAiLoading}
        aiResponse={aiResponse}
        lastSubmittedPrompt={lastSubmittedPrompt}
        lastSubmittedRegion={lastSubmittedRegion}
        activeScreenImageUrl={activeScreen?.imageUrl}
        loadingMessage={loadingMessages[loadingMessageIndex]}
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleAiSubmit}
        selectedRegion={selectedRegion}
        onClearRegion={() => setSelectedRegion(null)}
      />

      {/* Hotspot Mode Overlay */}
      <HotspotMode 
        isOpen={isHotspotMode} 
        onClose={() => setIsHotspotMode(false)} 
        activeScreen={activeScreen} 
        insights={balancedData} 
        isInsightsLoading={isInsightsLoading}
        loadingMessage={loadingMessages[loadingMessageIndex]}
        onOpenCompare={() => {
          setIsHotspotMode(false);
          setIsCompareMode(true);
        }}
      />

      {/* Compare Mode Overlay */}
      <CompareMode 
        isOpen={isCompareMode}
        onClose={() => setIsCompareMode(false)}
        activeScreen={activeScreen}
        appName={appName}
      />
    </div>
  );
}
