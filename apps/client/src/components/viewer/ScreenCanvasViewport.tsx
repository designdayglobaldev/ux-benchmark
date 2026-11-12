import { Link } from 'react-router-dom';
import RevolutScreenshot from "@/assets/Revolut.png";
import type { ScreenType } from "@/hooks/useAppDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionSelector, type Region } from "@/components/RegionSelector";
import { ScreenActionOverlay } from "@/components/ScreenActionOverlay";
import { useUpgradeModal } from "@/contexts/UpgradeContext";
import { Lock } from "lucide-react";

interface ScreenCanvasViewportProps {
  activeScreen?: ScreenType;
  appName?: string;
  imgRef: React.RefObject<HTMLImageElement | null>;
  isImageLoaded: boolean;
  onImageLoad: () => void;
  prevUrl?: string;
  nextUrl?: string;
  isInspectMode: boolean;
  onCloseInspect: () => void;
  selectedRegion: Region | null;
  onSelectRegion: (region: Region | null) => void;
  isSummaryVisible?: boolean;
}

export function ScreenCanvasViewport({
  activeScreen,
  appName,
  imgRef,
  isImageLoaded,
  onImageLoad,
  prevUrl,
  nextUrl,
  isInspectMode,
  onCloseInspect,
  selectedRegion,
  onSelectRegion,
  isSummaryVisible = false
}: ScreenCanvasViewportProps) {
  const { openUpgradeModal } = useUpgradeModal();
  const isLocked = Boolean(activeScreen?.isLocked);
  return (
    <div className="relative">
      {/* Left Navigation Button */}
      {prevUrl ? (
        <Link 
          to={prevUrl}
          replace={true}
          className="absolute top-1/2 -translate-y-1/2 right-full mr-4 xl:mr-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:bg-[#3f3f46]"
        >
          <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      ) : (
        <button 
          disabled
          className="absolute top-1/2 -translate-y-1/2 right-full mr-4 xl:mr-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg opacity-50 cursor-not-allowed"
        >
          <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Screen Frame */}
      <div className={`relative w-[243.71px] mx-auto group ${isInspectMode ? 'z-50' : ''}`}>
        {!isImageLoaded && (
          <Skeleton className="absolute inset-0 w-[243.71px] h-[544px] rounded-[16px] z-10" />
        )}
        <img
          key={activeScreen?.id || activeScreen?.imageUrl || 'default'}
          ref={imgRef}
          crossOrigin="anonymous"
          src={activeScreen?.imageUrl || RevolutScreenshot}
          alt="App Screenshot"
          onLoad={onImageLoad}
          className={`w-[243.71px] h-[544px] rounded-[16px] object-cover mx-auto block transition-all duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          } ${isLocked ? 'filter blur-[14px] opacity-75 scale-105' : ''}`}
        />

        {/* Locked Padlock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 rounded-[16px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openUpgradeModal();
              }}
              className="group/lockBtn relative z-40 flex items-center justify-center rounded-full bg-[#181818]/95 hover:bg-[#222222] border border-white/20 hover:border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 h-11 w-11 hover:w-auto px-0 hover:px-4 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-white shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/lockBtn:max-w-[120px] group-hover/lockBtn:opacity-100 group-hover/lockBtn:ml-2 transition-all duration-300 text-[13px] font-medium text-white">
                Unlock screen
              </span>
            </button>
          </div>
        )}

        {/* Top Right Hover Actions: Bookmark (Collections) & Copy (only if unlocked) */}
        {activeScreen && !isLocked && (
          <ScreenActionOverlay 
            screenId={activeScreen.id}
            imageUrl={activeScreen.imageUrl}
            screenName={activeScreen.name}
            appName={appName}
          />
        )}

        {isInspectMode && (
          <RegionSelector 
            onClose={onCloseInspect}
            onSelectRegion={onSelectRegion}
            selectedRegion={selectedRegion}
            hideInstructions={isSummaryVisible}
          />
        )}
      </div>

      {/* Right Navigation Button */}
      {nextUrl ? (
        <Link 
          to={nextUrl}
          replace={true}
          className="absolute top-1/2 -translate-y-1/2 left-full ml-4 xl:ml-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:bg-[#3f3f46]"
        >
          <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      ) : (
        <button 
          disabled
          className="absolute top-1/2 -translate-y-1/2 left-full ml-4 xl:ml-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg opacity-50 cursor-not-allowed"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

