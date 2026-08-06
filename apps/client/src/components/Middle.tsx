import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import floatIcon from '@/assets/floaticon.svg';
import RevolutScreenshot from "@/assets/Revolut.png";
import type { ScreenType } from "@/hooks/useAppDetails";
import { useInspectMode } from "@/contexts/InspectContext";
import { RegionSelector, type Region } from "./RegionSelector";
import { AiResponseDialog } from "./AiResponseDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface MiddleProps {
    activeScreen?: ScreenType;
    appName?: string;
    appSlug?: string;
    activeIndex: number;
    totalScreens: number;
    nextUrl?: string;
    prevUrl?: string;
}

export function Middle({ activeScreen, appName, appSlug, activeIndex, totalScreens, nextUrl, prevUrl }: MiddleProps) {
    const { isInspectMode, setIsInspectMode } = useInspectMode();
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setIsImageLoaded(false);
    }, [activeScreen?.imageUrl]);

    const handleAiSubmit = async (region: Region, prompt: string) => {
        if (!imgRef.current) return;
        
        setIsAiLoading(true);
        setAiResponse(null);
        
        try {
            // Draw image to canvas to get base64
            const canvas = document.createElement('canvas');
            canvas.width = imgRef.current.naturalWidth;
            canvas.height = imgRef.current.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(imgRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            // Map the drawn region from screen-scale to natural image scale
            const scaleX = imgRef.current.naturalWidth / imgRef.current.clientWidth;
            const scaleY = imgRef.current.naturalHeight / imgRef.current.clientHeight;
            
            const scaledRegion = {
                x: region.x * scaleX,
                y: region.y * scaleY,
                width: region.width * scaleX,
                height: region.height * scaleY
            };

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/v1/ai/inspect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    region: scaledRegion,
                    imageBase64
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch AI response');
            
            setAiResponse(data.response);
        } catch (error: any) {
            console.error('Error fetching AI response:', error);
            setAiResponse(`Error: ${error.message || 'Something went wrong.'}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    
    return (
        <div className="w-full flex justify-center xl:sticky xl:top-[30px] mt-8 xl:mt-[30px] z-10">
            {/* Container for screenshot and buttons */}
            <div className="flex items-center justify-center w-full">
                
                {/* Screenshot and Ask AI container */}
                <div className="flex flex-col items-center gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-[7px] font-['Inter'] text-[13px] font-medium leading-[16px]">
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
                        <span className="text-[#878787]">Flows</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-white">{activeScreen?.flow?.name || 'Screens'}</span>
                    </div>

                    {/* Image Wrapper with Relative Positioning for Buttons */}
                    <div className="relative">
                        {/* Left Navigation Button */}
                        {prevUrl ? (
                            <Link 
                                to={prevUrl}
                                className={`absolute top-1/2 -translate-y-1/2 right-full mr-4 xl:mr-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:bg-[#3f3f46]`}
                            >
                                <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                        ) : (
                            <button 
                                disabled
                                className={`absolute top-1/2 -translate-y-1/2 right-full mr-4 xl:mr-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg opacity-50 cursor-not-allowed`}
                            >
                                <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}

                        <div className="relative w-[200px] sm:w-[230px] mx-auto">
                            {!isImageLoaded && (
                                <Skeleton className="absolute inset-0 w-full h-[430px] sm:h-[500px] rounded-[16px] z-10" />
                            )}
                            <img
                                ref={imgRef}
                                crossOrigin="anonymous"
                                src={activeScreen?.imageUrl || RevolutScreenshot}
                                alt="App Screenshot"
                                onLoad={() => setIsImageLoaded(true)}
                                className={`w-[200px] sm:w-[230px] h-[430px] sm:h-[500px] rounded-[16px] object-contain mx-auto block transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {isInspectMode && (
                                <RegionSelector 
                                    onClose={() => setIsInspectMode(false)}
                                    onSubmit={handleAiSubmit}
                                />
                            )}
                            
                            <AiResponseDialog
                                isOpen={isAiLoading || aiResponse !== null}
                                isLoading={isAiLoading}
                                response={aiResponse}
                                onClose={() => {
                                    setAiResponse(null);
                                    setIsAiLoading(false);
                                }}
                            />

                            {/* AI Inspect Button is now moved below the dots */}
                        </div>

                        {/* Right Navigation Button */}
                        {nextUrl ? (
                            <Link 
                                to={nextUrl}
                                className={`absolute top-1/2 -translate-y-1/2 left-full ml-4 xl:ml-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg cursor-pointer hover:bg-[#3f3f46]`}
                            >
                                <svg className="pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                        ) : (
                            <button 
                                disabled
                                className={`absolute top-1/2 -translate-y-1/2 left-full ml-4 xl:ml-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg opacity-50 cursor-not-allowed`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Carousel Dots */}
                    {totalScreens > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 px-4 mt-2">
                            {Array.from({ length: totalScreens }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-[5px] rounded-full transition-all duration-300 ${i === activeIndex ? 'w-[18px] bg-white' : 'w-[5px] bg-white/30'}`}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* AI Inspect Button (Positioned below the dots, aligned right) */}
                    <div className="w-full flex justify-end px-4 mt-2">
                        <div className="relative group z-30 flex flex-col items-end">
                            {/* Tooltip above the button */}
                            <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-800 text-zinc-200 px-3 py-1.5 rounded-full text-xs shadow-xl whitespace-nowrap pointer-events-none">
                                Ask me about this screen
                                <div className="absolute top-full right-4 border-[5px] border-transparent border-t-zinc-800"></div>
                            </div>
                            
                            <button
                                onClick={() => setIsInspectMode(!isInspectMode)}
                                className={`transition-transform hover:scale-110 active:scale-95 flex items-center justify-center p-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-black/20 backdrop-blur-md border border-white/10 ${
                                    isInspectMode ? 'ring-2 ring-blue-500/50' : ''
                                }`}
                            >
                                <img src={floatIcon} alt="Inspect Mode" className="h-14 w-14 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}