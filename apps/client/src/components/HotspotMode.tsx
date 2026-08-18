import type { ScreenType } from "@/hooks/useAppDetails";
import { ThinkingOrb } from 'thinking-orbs';
interface InsightData {
    title: string;
    description: string;
    x: number;
    y: number;
}

interface HotspotModeProps {
    isOpen: boolean;
    onClose: () => void;
    activeScreen?: ScreenType;
    leftHalf: InsightData[];
    rightHalf: InsightData[];
    getCardYPercent: (idx: number, length: number) => number;
    isInsightsLoading?: boolean;
    loadingMessage?: string;
}

export function HotspotMode({ isOpen, onClose, activeScreen, leftHalf, rightHalf, getCardYPercent, isInsightsLoading, loadingMessage }: HotspotModeProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-[#0c0c0c] flex flex-col items-center overflow-y-auto overflow-x-hidden pt-24 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Top Pill */}
            <button 
                onClick={onClose}
                className="mb-4 bg-[#27272a] hover:bg-[#3f3f46] text-white/70 hover:text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 border border-white/10"
            >
                Hotspot Mode ✕
            </button>

            {/* Main Content Area */}
            <div className="relative flex items-center justify-center w-full max-w-[1200px]">
                {/* Central Phone */}
                <div className="relative shrink-0 w-[243.71px] h-[544px] rounded-[16px] overflow-visible bg-transparent shadow-2xl">
                    {activeScreen?.imageUrl && (
                        <img src={activeScreen.imageUrl} alt="Screen" className="w-full h-full object-cover rounded-[16px]" />
                    )}
                    
                    {isInsightsLoading && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-[16px]">
                            <ThinkingOrb state="solving" size={64} speed={1.10} />
                            <div className="mt-6 bg-[#141414]/90 border border-white/10 px-4 py-2 rounded-full shadow-lg">
                                <span className="text-[13px] font-medium text-white/90 animate-pulse">{loadingMessage || 'Analyzing...'}</span>
                            </div>
                        </div>
                    )}
                    {/* SVG Lines */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
                        {leftHalf.map((insight, idx) => {
                            const y1Percent = getCardYPercent(idx, leftHalf.length);
                            const py1 = (y1Percent / 100) * 544;
                            const px1 = -64;
                            const px2 = (insight.x / 100) * 243.71;
                            const py2 = (insight.y / 100) * 544;
                            const d = `M ${px1} ${py1} C ${px1 + 60} ${py1}, ${px2 - 40} ${py2}, ${px2} ${py2}`;
                            
                            return (
                                <g key={`left-line-${idx}`}>
                                    <path d={d} fill="none" stroke="#4E6BFF" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 4" className="animate-pulse" />
                                    <circle cx="-64" cy={py1} r="3.5" fill="#4E6BFF" />
                                </g>
                            );
                        })}
                        {rightHalf.map((insight, idx) => {
                            const y1Percent = getCardYPercent(idx, rightHalf.length);
                            const py1 = (y1Percent / 100) * 544;
                            const px1 = 243.71 + 64;
                            const px2 = (insight.x / 100) * 243.71;
                            const py2 = (insight.y / 100) * 544;
                            const d = `M ${px1} ${py1} C ${px1 - 60} ${py1}, ${px2 + 40} ${py2}, ${px2} ${py2}`;
                            
                            return (
                                <g key={`right-line-${idx}`}>
                                    <path d={d} fill="none" stroke="#E8348E" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 4" className="animate-pulse" />
                                    <circle cx={px1} cy={py1} r="3.5" fill="#E8348E" />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Left Side Elements */}
                    {leftHalf.map((insight, idx) => {
                        const top = `${getCardYPercent(idx, leftHalf.length)}%`;
                        return (
                            <div key={`left-group-${idx}`}>
                                {/* Hotspot on phone */}
                                <div 
                                    className="absolute w-6 h-6 rounded-full bg-[#4E6BFF]/30 border-2 border-[#4E6BFF] flex items-center justify-center cursor-pointer shadow-[0_0_10px_#4E6BFF] z-10"
                                    style={{ left: `${insight.x}%`, top: `${insight.y}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                                {/* Card */}
                                <div 
                                    className="absolute right-[100%] mr-16 w-[350px] bg-[#141414] border border-[#4E6BFF]/30 p-5 rounded-[12px] shadow-[0_0_20px_rgba(78,107,255,0.05)] z-20"
                                    style={{ top, transform: 'translateY(-50%)' }}
                                >
                                    <h3 className="text-white text-[15px] font-medium mb-2">{insight.title}</h3>
                                    <p className="text-[#a1a1aa] text-[14px] leading-relaxed">{insight.description}</p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Right Side Elements */}
                    {rightHalf.map((insight, idx) => {
                        const top = `${getCardYPercent(idx, rightHalf.length)}%`;
                        return (
                            <div key={`right-group-${idx}`}>
                                {/* Hotspot on phone */}
                                <div 
                                    className="absolute w-6 h-6 rounded-full bg-[#E8348E]/30 border-2 border-[#E8348E] flex items-center justify-center cursor-pointer shadow-[0_0_10px_#E8348E] z-10"
                                    style={{ left: `${insight.x}%`, top: `${insight.y}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                                {/* Card */}
                                <div 
                                    className="absolute left-[100%] ml-16 w-[350px] bg-[#141414] border border-[#E8348E]/30 p-5 rounded-[12px] shadow-[0_0_20px_rgba(232,52,142,0.05)] z-20"
                                    style={{ top, transform: 'translateY(-50%)' }}
                                >
                                    <h3 className="text-white text-[15px] font-medium mb-2">{insight.title}</h3>
                                    <p className="text-[#a1a1aa] text-[14px] leading-relaxed">{insight.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Banner */}
            <div className="mt-10 mb-10 flex items-center justify-center gap-3 px-6 py-4 rounded-[12px] bg-[#141414] border border-white/5 shadow-lg relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E8348E]/30 via-purple-500/30 to-[#4E6BFF]/30 p-[1px] rounded-[12px]" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px' }} />
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#E8348E] to-[#4E6BFF] flex items-center justify-center shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                </div>
                <span className="text-[#a1a1aa] text-[14px]">See how your design compares to this UI.</span>
                <button className="text-white font-medium text-[14px] underline underline-offset-4 hover:text-white/80 transition-colors">Try Compare mode</button>
            </div>
        </div>
    );
}
