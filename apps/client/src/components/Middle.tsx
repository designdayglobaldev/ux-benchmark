import { useState, useRef, useEffect, useMemo } from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import { Link } from 'react-router-dom';
import floatIcon from '@/assets/floaticon.svg';
import RevolutScreenshot from "@/assets/Revolut.png";
import type { ScreenType } from "@/hooks/useAppDetails";
import { useInspectMode } from "@/contexts/InspectContext";
import { RegionSelector, type Region } from "./RegionSelector";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HotspotMode } from './HotspotMode';
import { CompareMode } from './CompareMode';

interface InsightData {
    title: string;
    description: string;
    x: number;
    y: number;
}

interface MiddleProps {
    activeScreen?: ScreenType;
    appName?: string;
    appSlug?: string;
    nextUrl?: string;
    prevUrl?: string;
}

const cardColors = ['#FBBF24', '#34D399', '#A78BFA', '#F87171', '#38BDF8'];

export function Middle({ activeScreen, appName, appSlug, nextUrl, prevUrl }: MiddleProps) {
    const { isInspectMode, setIsInspectMode } = useInspectMode();
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isHotspotMode, setIsHotspotMode] = useState(false);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [isSummaryVisible, setIsSummaryVisible] = useState(false);
    const [insightsData, setInsightsData] = useState<InsightData[]>([]);
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);
    const [lastSubmittedRegion, setLastSubmittedRegion] = useState<Region | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

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
    
    const getCardYPercent = (idx: number, length: number) => {
        if (length === 1) return 50;
        if (length === 2) return idx === 0 ? 25 : 75;
        if (length === 3) return idx === 0 ? 15 : (idx === 1 ? 50 : 85);
        return 10 + (idx * (80 / (length - 1)));
    };

    const { leftHalf, rightHalf, balancedData } = useMemo(() => {
        if (!insightsData.length) return { leftHalf: [], rightHalf: [], balancedData: [] };
        const imgWidth = imgRef.current?.naturalWidth || 400;
        const imgHeight = imgRef.current?.naturalHeight || 850;
        
        const normalizedData = insightsData.map(insight => {
            let nx = insight.x > 100 ? (insight.x / imgWidth) * 100 : insight.x;
            let ny = insight.y > 100 ? (insight.y / imgHeight) * 100 : insight.y;
            return {
                ...insight,
                x: Math.max(0, Math.min(100, nx)),
                y: Math.max(0, Math.min(100, ny))
            };
        });

        const sortedByX = [...normalizedData].sort((a, b) => a.x - b.x);
        const leftHalf = sortedByX.slice(0, Math.ceil(sortedByX.length / 2)).sort((a, b) => a.y - b.y);
        const rightHalf = sortedByX.slice(Math.ceil(sortedByX.length / 2)).sort((a, b) => a.y - b.y);
        return { leftHalf, rightHalf, balancedData: [...leftHalf, ...rightHalf] };
    }, [insightsData]);

    const loadingMessages = [
        "Analyzing UI elements...",
        "Identifying UX patterns...",
        "Applying design heuristics...",
        "Formulating insights...",
        "Almost done..."
    ];

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

    useEffect(() => {
        setIsImageLoaded(false);
        setInsightsData([]);
        setIsSummaryVisible(false);
    }, [activeScreen?.imageUrl]);

    useEffect(() => {
        if (!isInspectMode) {
            setIsSummaryVisible(false);
            setSelectedRegion(null);
        }
    }, [isInspectMode]);

    const fetchInsights = async () => {
        if (!imgRef.current || !isImageLoaded || insightsData.length > 0) return;
        
        setIsInsightsLoading(true);
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = imgRef.current.naturalWidth;
            canvas.height = imgRef.current.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(imgRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/v1/ai/insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64 })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch AI insights');
            
            if (data.insights && Array.isArray(data.insights)) {
                setInsightsData(data.insights);
            }
        } catch (error: any) {
            console.error('Error fetching insights:', error);
        } finally {
            setIsInsightsLoading(false);
        }
    };

    useEffect(() => {
        if ((isSummaryVisible || isHotspotMode) && isImageLoaded && insightsData.length === 0) {
            fetchInsights();
        }
    }, [isSummaryVisible, isHotspotMode, isImageLoaded]);

    const handleAiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const currentPrompt = prompt;
        const currentRegion = selectedRegion;

        setLastSubmittedPrompt(currentPrompt);
        setLastSubmittedRegion(currentRegion);
        
        setIsAiLoading(true);
        setPrompt('');
        setIsInspectMode(false);
        setAiResponse(null);
        
        try {
            if (!imgRef.current) return;
            // Draw image to canvas to get base64
            const canvas = document.createElement('canvas');
            canvas.width = imgRef.current.naturalWidth;
            canvas.height = imgRef.current.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(imgRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            // Map the drawn region from screen-scale to natural image scale (if region is selected)
            let scaledRegion = null;
            if (selectedRegion) {
                const scaleX = imgRef.current.naturalWidth / imgRef.current.clientWidth;
                const scaleY = imgRef.current.naturalHeight / imgRef.current.clientHeight;
                
                scaledRegion = {
                    x: selectedRegion.x * scaleX,
                    y: selectedRegion.y * scaleY,
                    width: selectedRegion.width * scaleX,
                    height: selectedRegion.height * scaleY
                };
            }

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
            setPrompt(''); // Clear prompt on success
            setSelectedRegion(null); // Clear region on success
        } catch (error: any) {
            console.error('Error fetching AI response:', error);
            setAiResponse(`Error: ${error.message || 'Something went wrong.'}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    
    return (
        <div className={`w-full flex justify-center xl:sticky xl:top-[30px] mt-8 xl:mt-[30px] z-10`}>
            {/* Container for screenshot and buttons */}
            <div className="flex items-center justify-center w-full">
                
                {/* Screenshot and Ask AI container */}
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
                            <span className="text-[#878787]">Flows</span>
                        )}
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

                        <div className={`relative w-[243.71px] mx-auto ${isInspectMode ? 'z-50' : ''}`}>
                            {!isImageLoaded && (
                                <Skeleton className="absolute inset-0 w-[243.71px] h-[544px] rounded-[16px] z-10" />
                            )}
                            <img
                                ref={imgRef}
                                crossOrigin="anonymous"
                                src={activeScreen?.imageUrl || RevolutScreenshot}
                                alt="App Screenshot"
                                onLoad={() => setIsImageLoaded(true)}
                                className={`w-[243.71px] h-[544px] rounded-[16px] object-cover mx-auto block transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                            
                            {/* AI Insights Summary Overlay */}
                            {isSummaryVisible && (
                                <div className="absolute inset-0 pointer-events-none z-40 hidden md:block">
                                    {isInsightsLoading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-[8px] pointer-events-auto">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="flex gap-1.5 items-center justify-center">
                                                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-sm font-medium text-purple-300 animate-pulse">{loadingMessages[loadingMessageIndex]}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="absolute inset-0 w-full h-full overflow-visible drop-shadow-md">
                                                {(() => {
                                                    let leftCount = 0;
                                                    let rightCount = 0;
                                                    
                                                    return balancedData.map((insight, idx) => {
                                                        const isRightSide = rightHalf.includes(insight);
                                                        const indexOnSide = isRightSide ? rightCount++ : leftCount++;
                                                        const totalOnSide = isRightSide ? rightHalf.length : leftHalf.length;
                                                        
                                                        let startY = "50%";
                                                        if (totalOnSide > 1) {
                                                            startY = indexOnSide === 0 ? "20%" : "80%";
                                                        }
                                                        
                                                        const startX = isRightSide ? "115%" : "-15%";
                                                        const color = cardColors[idx % cardColors.length];
                                                        
                                                        return (
                                                            <g key={`arrow-${idx}`}>
                                                                <line x1={startX} y1={startY} x2={`${insight.x}%`} y2={`${insight.y}%`} stroke={color} strokeWidth="2" />
                                                                <circle cx={`${insight.x}%`} cy={`${insight.y}%`} r="4" fill={color} />
                                                            </g>
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            
                                            {(() => {
                                                let leftCount = 0;
                                                let rightCount = 0;
                                                
                                                return balancedData.map((insight, idx) => {
                                                    const isRightSide = rightHalf.includes(insight);
                                                    const indexOnSide = isRightSide ? rightCount++ : leftCount++;
                                                    const totalOnSide = isRightSide ? rightHalf.length : leftHalf.length;
                                                    
                                                    let style: React.CSSProperties = {
                                                        width: '260px'
                                                    };
                                                    
                                                    if (isRightSide) {
                                                        style.left = 'calc(100% + 20px)';
                                                    } else {
                                                        style.right = 'calc(100% + 20px)';
                                                    }
                                                    
                                                    if (totalOnSide === 1) {
                                                        style.top = '50%';
                                                        style.transform = 'translateY(-50%)';
                                                    } else if (indexOnSide === 0) {
                                                        style.top = '0px';
                                                    } else {
                                                        style.bottom = '0px';
                                                    }
                                                    
                                                    const slideClass = isRightSide ? "slide-in-from-left-4" : "slide-in-from-right-4";
                                                    
                                                    return (
                                                        <div key={`card-${idx}`} style={style} className={`absolute bg-[#1a1a1c] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2 pointer-events-auto transition-all duration-500 animate-in fade-in ${slideClass} max-h-[calc(50%-10px)] overflow-y-auto [&::-webkit-scrollbar]:hidden`}>
                                                            <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">{insight.title}</div>
                                                            <div className="text-zinc-400 text-xs leading-relaxed">{insight.description}</div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </>
                                    )}
                                </div>
                            )}
                            {isInspectMode && (
                                <RegionSelector 
                                    onClose={() => setIsInspectMode(false)}
                                    onSelectRegion={setSelectedRegion}
                                    selectedRegion={selectedRegion}
                                    hideInstructions={isSummaryVisible}
                                />
                            )}


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
                        <div className={`w-[425px] min-h-[104px] mt-[15px] relative rounded-[12px] ${(isInspectMode || selectedRegion) ? 'bg-gradient-to-r from-[#4E6BFF] to-[#FF8A4C] p-[1px] z-50' : 'z-50'}`}>
                            <div className={`w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col ${!(isInspectMode || selectedRegion) ? 'border border-[#434343]' : ''}`}>
                                <form onSubmit={handleAiSubmit} className="flex flex-col h-full">
                                    <div className="flex flex-col justify-between p-3 h-full relative bg-transparent">
                                        {selectedRegion && (() => {
                                            const maxDim = Math.max(selectedRegion.width, selectedRegion.height);
                                            const scale = 40 / maxDim;
                                            const thumbWidth = selectedRegion.width * scale;
                                            const thumbHeight = selectedRegion.height * scale;
                                            
                                            return (
                                                <div className="mb-2 pb-2 border-b border-white/5 flex">
                                                    <div className="relative group shrink-0">
                                                        <div className="w-10 h-10 bg-[#1e1e1e] border border-white/10 rounded-[6px] flex items-center justify-center overflow-hidden shadow-sm">
                                                            <div 
                                                                className="bg-no-repeat bg-left-top shrink-0"
                                                                style={{ 
                                                                    width: thumbWidth, 
                                                                    height: thumbHeight,
                                                                    backgroundImage: `url(${activeScreen?.imageUrl || RevolutScreenshot})`,
                                                                    backgroundSize: `${243.71 * scale}px ${544 * scale}px`,
                                                                    backgroundPosition: `-${selectedRegion.x * scale}px -${selectedRegion.y * scale}px`
                                                                }}
                                                            />
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setSelectedRegion(null)} 
                                                            className="absolute -top-1.5 -right-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center text-white"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div className="flex gap-2 w-full flex-1">
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleAiSubmit(e as any);
                                                    }
                                                }}
                                                placeholder="Ask me anything"
                                                className="w-full bg-transparent border-none text-white placeholder:text-[#525252] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 resize-none flex-1 text-[14px] scrollbar-hide"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between w-full mt-2">
                                            <button 
                                                type="button"
                                                onClick={() => setIsInspectMode(!isInspectMode)}
                                                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-[6px] border transition-colors ${
                                                    (isInspectMode || selectedRegion) ? 'bg-[#1a224a] border-[#2b3a8b] text-white' : 'bg-transparent border-[#323232] text-[#BDBDBD] hover:text-white hover:bg-white/5'
                                                } text-[13px] font-medium`}
                                            >
                                                <img src="/inspect.svg" alt="Inspect" className="w-3.5 h-3.5" />
                                                Inspect Screen
                                            </button>

                                            <button 
                                                type="submit" 
                                                disabled={!prompt.trim() || isAiLoading}
                                                className="shrink-0 h-[28px] w-[28px] rounded-[4.31px] bg-gradient-to-b from-[#FFFFFF] to-[#C6C6C6] shadow-[inset_0.5px_0.5px_0.5px_rgba(99,99,99,0.56)] text-black flex items-center justify-center transition-opacity opacity-50 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
                                            >
                                                {isAiLoading ? (
                                                    <ThinkingOrb state="solving" size={64} speed={1.10} />
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="19" x2="12" y2="5"></line>
                                                        <polyline points="5 12 12 5 19 12"></polyline>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Modal (Bottom Sheet) */}
            {(isAiLoading || aiResponse) && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm px-4 pt-10">
                    {/* Close Button */}
                    <button 
                        onClick={() => {
                            setAiResponse(null);
                            setIsAiLoading(false);
                        }}
                        className="mb-4 bg-[#27272a] hover:bg-[#3f3f46] text-white/70 hover:text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 border border-white/10"
                    >
                        Close chat ✕
                    </button>

                    {/* Background Glow */}
                    <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[#4E6BFF]/40 blur-[150px] rounded-full pointer-events-none z-0" />

                    {/* Modal Container */}
                    <div className="w-full max-w-[800px] h-[75vh] min-h-[500px] bg-[#141414] rounded-t-[24px] overflow-hidden flex flex-col border border-[#323232] border-b-0 shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10">
                        {/* Subtle Top Glow */}
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#4E6BFF] to-transparent opacity-50" />
                        
                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-10 pb-6 flex flex-col gap-8 scrollbar-hide">
                            {/* User Message */}
                            <div className="flex flex-col items-end gap-3 self-end max-w-[80%]">
                                {lastSubmittedRegion && (() => {
                                    const maxDim = Math.max(lastSubmittedRegion.width, lastSubmittedRegion.height);
                                    const scale = 120 / maxDim; // bigger thumbnail for chat history
                                    const thumbWidth = lastSubmittedRegion.width * scale;
                                    const thumbHeight = lastSubmittedRegion.height * scale;
                                    return (
                                        <div className="bg-white rounded-[12px] p-2 shadow-sm flex items-center justify-center">
                                            <div className="w-[120px] h-[120px] rounded-[6px] overflow-hidden flex items-center justify-center bg-white">
                                                <div 
                                                    className="bg-no-repeat bg-left-top shrink-0"
                                                    style={{ 
                                                        width: thumbWidth, 
                                                        height: thumbHeight,
                                                        backgroundImage: `url(${activeScreen?.imageUrl || RevolutScreenshot})`,
                                                        backgroundSize: `${243.71 * scale}px ${544 * scale}px`,
                                                        backgroundPosition: `-${lastSubmittedRegion.x * scale}px -${lastSubmittedRegion.y * scale}px`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="bg-[#1e1e1e] text-white/90 px-5 py-3.5 rounded-[16px] rounded-tr-sm text-[15px] leading-relaxed border border-white/5 font-medium shadow-sm">
                                    {lastSubmittedPrompt}
                                </div>
                            </div>

                            {/* AI Message */}
                            <div className="flex items-start gap-5 max-w-[95%]">
                                <div className={`w-8 h-8 shrink-0 mt-1 flex items-center justify-center ${isAiLoading ? '' : 'rounded-full bg-[#1e1e1e] border border-white/10'}`}>
                                    {isAiLoading ? (
                                        <ThinkingOrb state="solving" size={20} speed={1.10} />
                                    ) : (
                                        <img src={floatIcon} className="w-5 h-5" alt="AI" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    {isAiLoading ? (
                                        <div className="flex items-center gap-4 text-zinc-400 py-1.5">
                                            <span className="text-[15px] font-medium animate-pulse">{loadingMessages[loadingMessageIndex]}</span>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none prose-p:leading-[1.7] prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-headings:text-zinc-200 prose-a:text-blue-400 text-zinc-200 text-[15px]">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse || ''}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Input Area - Matches Inline Chatbar */}
                        <div className="p-6 bg-transparent mt-auto flex justify-center pb-8">
                            <div className={`w-[425px] min-h-[104px] relative rounded-[12px] ${selectedRegion ? 'bg-gradient-to-r from-[#4E6BFF] to-[#FF8A4C] p-[1px]' : ''}`}>
                                <div className={`w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col ${!selectedRegion ? 'border border-[#434343]' : ''}`}>
                                    <form onSubmit={handleAiSubmit} className="flex flex-col h-full">
                                        <div className="flex flex-col justify-between p-3 h-full relative bg-transparent">
                                            {selectedRegion && (() => {
                                                const maxDim = Math.max(selectedRegion.width, selectedRegion.height);
                                                const scale = 40 / maxDim;
                                                const thumbWidth = selectedRegion.width * scale;
                                                const thumbHeight = selectedRegion.height * scale;
                                                
                                                return (
                                                    <div className="mb-2 pb-2 border-b border-white/5 flex">
                                                        <div className="relative group shrink-0">
                                                            <div className="w-10 h-10 bg-[#1e1e1e] border border-white/10 rounded-[6px] flex items-center justify-center overflow-hidden shadow-sm">
                                                                <div 
                                                                    className="bg-no-repeat bg-left-top shrink-0"
                                                                    style={{ 
                                                                        width: thumbWidth, 
                                                                        height: thumbHeight,
                                                                        backgroundImage: `url(${activeScreen?.imageUrl || RevolutScreenshot})`,
                                                                        backgroundSize: `${243.71 * scale}px ${544 * scale}px`,
                                                                        backgroundPosition: `-${selectedRegion.x * scale}px -${selectedRegion.y * scale}px`
                                                                    }}
                                                                />
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedRegion(null)} 
                                                                className="absolute -top-1.5 -right-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center text-white"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            
                                            <div className="flex gap-2 w-full flex-1">
                                                <textarea
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleAiSubmit(e as any);
                                                        }
                                                    }}
                                                    placeholder="Ask me anything"
                                                    className="w-full bg-transparent border-none text-white placeholder:text-[#525252] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 resize-none flex-1 text-[14px] scrollbar-hide"
                                                />
                                            </div>
                                            
                                            <div className="flex items-center justify-between w-full mt-2">
                                                <div className="w-[124px]"></div>
                                                <button 
                                                    type="submit" 
                                                    disabled={!prompt.trim() || isAiLoading}
                                                    className="shrink-0 h-[28px] w-[28px] rounded-[4.31px] bg-gradient-to-b from-[#FFFFFF] to-[#C6C6C6] shadow-[inset_0.5px_0.5px_0.5px_rgba(99,99,99,0.56)] text-black flex items-center justify-center transition-opacity opacity-50 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    {isAiLoading ? (
                                                        <ThinkingOrb state="solving" size={64} speed={1.10} />
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="19" x2="12" y2="5"></line>
                                                            <polyline points="5 12 12 5 19 12"></polyline>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Hotspot Mode Overlay */}
            <HotspotMode 
                isOpen={isHotspotMode} 
                onClose={() => setIsHotspotMode(false)} 
                activeScreen={activeScreen} 
                leftHalf={leftHalf} 
                rightHalf={rightHalf} 
                getCardYPercent={getCardYPercent} 
                isInsightsLoading={isInsightsLoading}
                loadingMessage={loadingMessages[loadingMessageIndex]}
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