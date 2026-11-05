import { Link } from 'react-router-dom';
import RevolutScreenshot from "@/assets/Revolut.png";
import type { ScreenType } from "@/hooks/useAppDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionSelector, type Region } from "@/components/RegionSelector";
import { ScreenActionOverlay } from "@/components/ScreenActionOverlay";

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
          className={`w-[243.71px] h-[544px] rounded-[16px] object-cover mx-auto block transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Top Right Hover Actions: Bookmark (Collections) & Copy */}
        {activeScreen && (
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

