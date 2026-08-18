import { Dialog, DialogContent } from "@/components/ui/dialog";
import { type ScreenType } from "@/hooks/useAppDetails";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "react-router-dom";

interface Flow {
    id: string;
    name: string;
    screens: ScreenType[];
}

interface InteractiveFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    flow: Flow | undefined;
}

function ImageWithSkeleton({ src, alt, className }: { src: string, alt: string, className?: string }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {!isLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
            <img 
                src={src} 
                alt={alt}
                className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={() => setIsLoaded(true)}
            />
        </>
    );
}

export function InteractiveFlowModal({ isOpen, onClose, flow }: InteractiveFlowModalProps) {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();

    if (!flow) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] bg-[#1C1C1C] border-[#2B2B29] rounded-[24px] p-8 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-['Inter'] font-bold text-[24px] text-white">
                            {flow.name}
                        </h2>
                        <p className="font-['Inter'] text-[14px] text-[#878787] max-w-[800px] leading-relaxed line-clamp-2">
                            {flow.screens.map(s => s.name).join(' · ')}
                        </p>
                    </div>
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
                    <div className="flex gap-8 w-max h-full items-center">
                        {flow.screens.map((screen, idx) => (
                            <div key={screen.id} className="flex flex-col items-center gap-4 group relative h-full">
                                {/* The phone frame wrapper */}
                                <div className="h-[60vh] min-h-[400px] aspect-[440/850] relative overflow-hidden rounded-[24px] bg-black border-4 border-transparent group-hover:border-[#0099FF] transition-all duration-300">
                                    <ImageWithSkeleton 
                                        src={screen.imageUrl} 
                                        alt={screen.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                
                                {/* UX Analysis Popover (shown on hover) */}
                                <div className="absolute top-8 -right-4 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
                                    <div className="bg-[#2B2B29] p-4 rounded-xl shadow-2xl w-[280px] flex flex-col gap-2 text-left relative pointer-events-auto">
                                        {/* Arrow for popover */}
                                        <div className="absolute top-6 -left-2 w-4 h-4 bg-[#2B2B29] rotate-45"></div>
                                        
                                        <span className="text-[10px] font-bold tracking-wider text-[#878787] uppercase relative z-10">UX ANALYSIS</span>
                                        {screen.uxAnalysis ? (
                                            <div 
                                                className="text-[13px] text-white leading-relaxed line-clamp-4 [&>p]:m-0 relative z-10"
                                                dangerouslySetInnerHTML={{ __html: screen.uxAnalysis }} 
                                            />
                                        ) : (
                                            <p className="text-[13px] text-white leading-relaxed line-clamp-4 relative z-10">
                                                No specific UX analysis provided for this screen.
                                            </p>
                                        )}

                                        {/* Screen-specific Insights */}
                                        {((screen.patterns && screen.patterns.length > 0) || (screen.uiElements && screen.uiElements.length > 0)) && (
                                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#3A3A38] relative z-10">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {screen.patterns?.slice(0, 3).map(pattern => (
                                                        <span key={pattern.title} className="bg-[#0099FF]/10 text-[#0099FF] text-[10px] px-2 py-0.5 rounded-sm font-medium whitespace-nowrap">
                                                            {pattern.title}
                                                        </span>
                                                    ))}
                                                    {screen.uiElements?.slice(0, 3).map(el => (
                                                        <span key={el.title} className="bg-[#1C1C1C] text-[#878787] text-[10px] px-2 py-0.5 rounded-sm font-medium whitespace-nowrap">
                                                            {el.title}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* CTA Button */}
                                        <div className="mt-2 pt-3 border-t border-[#3A3A38] relative z-10">
                                            <button 
                                                onClick={() => {
                                                    onClose();
                                                    navigate(`/app/${slug}/screens/${screen.slug}`);
                                                }}
                                                className="w-full bg-[#0099FF] hover:bg-[#0088EE] text-white px-4 py-2 rounded-lg font-medium text-[13px] transition-colors flex items-center justify-center gap-2"
                                            >
                                                Inspect Screen Details
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Flow step indicator */}
                                <div className="w-8 h-8 rounded-full bg-[#2B2B29] text-[#878787] font-medium text-[13px] flex items-center justify-center group-hover:bg-[#0099FF] group-hover:text-white transition-colors">
                                    {idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
