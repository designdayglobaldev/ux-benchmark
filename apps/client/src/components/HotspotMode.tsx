import { useState, useMemo } from 'react';
import type { ScreenType } from "@/hooks/useAppDetails";
import { ThinkingOrb } from 'thinking-orbs';

export interface InsightData {
    title: string;
    description: string;
    x: number;
    y: number;
    category?: 'Heuristic' | 'Microcopy' | 'Hierarchy' | 'Conversion' | 'Friction' | string;
}

interface HotspotModeProps {
    isOpen: boolean;
    onClose: () => void;
    activeScreen?: ScreenType;
    insights: InsightData[];
    isInsightsLoading?: boolean;
    loadingMessage?: string;
    onOpenCompare?: () => void;
}

const CATEGORY_STYLES: Record<string, { label: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
    Heuristic: {
        label: "Heuristic",
        badgeBg: "bg-indigo-500/10",
        badgeBorder: "border-indigo-500/30",
        badgeText: "text-indigo-400"
    },
    Conversion: {
        label: "Conversion",
        badgeBg: "bg-emerald-500/10",
        badgeBorder: "border-emerald-500/30",
        badgeText: "text-emerald-400"
    },
    Hierarchy: {
        label: "Hierarchy",
        badgeBg: "bg-purple-500/10",
        badgeBorder: "border-purple-500/30",
        badgeText: "text-purple-400"
    },
    Microcopy: {
        label: "Microcopy",
        badgeBg: "bg-cyan-500/10",
        badgeBorder: "border-cyan-500/30",
        badgeText: "text-cyan-400"
    },
    Friction: {
        label: "Friction",
        badgeBg: "bg-rose-500/10",
        badgeBorder: "border-rose-500/30",
        badgeText: "text-rose-400"
    }
};

interface ProcessedHotspot extends InsightData {
    id: string;
    side: 'left' | 'right';
    cardY: number; // in percentage (0-100)
    originalIdx: number;
}

export function HotspotMode({ 
    isOpen, 
    onClose, 
    activeScreen, 
    insights,
    isInsightsLoading, 
    loadingMessage,
    onOpenCompare
}: HotspotModeProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 250, height: 544 });

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
            const targetHeight = 544;
            const computedWidth = (img.naturalWidth / img.naturalHeight) * targetHeight;
            // Round and constrain to reasonable mobile frame widths (between 235px and 280px)
            const safeWidth = Math.max(230, Math.min(290, Math.round(computedWidth * 10) / 10));
            setDimensions({ width: safeWidth, height: targetHeight });
        }
    };

    // Compute direct non-crossing side and cardY for each hotspot
    const processedHotspots = useMemo<ProcessedHotspot[]>(() => {
        if (!insights || insights.length === 0) return [];

        // 1. Initial side assignment: if total <= 4, balance sides so neither side has > 2 cards
        const sorted = [...insights].map((insight, originalIdx) => ({ insight, originalIdx }))
            .sort((a, b) => a.insight.y - b.insight.y);

        const leftItems: { insight: InsightData; originalIdx: number }[] = [];
        const rightItems: { insight: InsightData; originalIdx: number }[] = [];

        // If 2 or 3 items, balance them 1-1 or 1-2 based on x
        if (sorted.length === 2) {
            if (sorted[0].insight.x <= sorted[1].insight.x) {
                leftItems.push(sorted[0]);
                rightItems.push(sorted[1]);
            } else {
                leftItems.push(sorted[1]);
                rightItems.push(sorted[0]);
            }
        } else if (sorted.length === 3) {
            // Put the most 'left' one on left, the most 'right' one on right, and the middle one to whichever side has fewer
            const byX = [...sorted].sort((a, b) => a.insight.x - b.insight.x);
            leftItems.push(byX[0]);
            rightItems.push(byX[2]);
            if (byX[1].insight.x <= 50) {
                leftItems.push(byX[1]);
            } else {
                rightItems.push(byX[1]);
            }
        } else {
            // 4 or more items: assign strictly by x <= 50 vs x > 50, but cap each side at max 2
            sorted.forEach(item => {
                if (item.insight.x <= 50) {
                    if (leftItems.length < 2) {
                        leftItems.push(item);
                    } else {
                        rightItems.push(item);
                    }
                } else {
                    if (rightItems.length < 2) {
                        rightItems.push(item);
                    } else {
                        leftItems.push(item);
                    }
                }
            });
        }

        // 2. Sort each side vertically by Y
        leftItems.sort((a, b) => a.insight.y - b.insight.y);
        rightItems.sort((a, b) => a.insight.y - b.insight.y);

        // 3. Relax Y positions so two cards on the same side NEVER overlap
        const computeRelaxedY = (items: { insight: InsightData; originalIdx: number }[]): number[] => {
            if (items.length === 0) return [];
            if (items.length === 1) return [Math.max(25, Math.min(75, items[0].insight.y))];

            // For 2 cards on the same side, enforce 50% separation (272px)
            const minSpacing = 50;
            let y1 = Math.max(14, Math.min(38, items[0].insight.y));
            let y2 = Math.max(62, Math.min(86, items[1].insight.y));

            if (y2 - y1 < minSpacing) {
                const mid = (y1 + y2) / 2;
                y1 = Math.max(12, mid - minSpacing / 2);
                y2 = Math.min(88, mid + minSpacing / 2);
            }

            return [y1, y2];
        };

        const leftYs = computeRelaxedY(leftItems);
        const rightYs = computeRelaxedY(rightItems);

        const result: ProcessedHotspot[] = [];

        leftItems.forEach((item, idx) => {
            result.push({
                ...item.insight,
                id: `left-${item.originalIdx}`,
                side: 'left',
                cardY: leftYs[idx],
                originalIdx: item.originalIdx
            });
        });

        rightItems.forEach((item, idx) => {
            result.push({
                ...item.insight,
                id: `right-${item.originalIdx}`,
                side: 'right',
                cardY: rightYs[idx],
                originalIdx: item.originalIdx
            });
        });

        return result;
    }, [insights]);

    if (!isOpen) return null;

    const renderBadge = (category?: string) => {
        if (!category) return null;
        const style = CATEGORY_STYLES[category] || {
            label: category,
            badgeBg: "bg-white/10",
            badgeBorder: "border-white/20",
            badgeText: "text-white/80"
        };
        return (
            <span className={`inline-flex items-center text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full border ${style.badgeBg} ${style.badgeBorder} ${style.badgeText}`}>
                {style.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-[110] bg-[#0c0c0c] flex flex-col items-center overflow-y-auto overflow-x-hidden pt-20 pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Top Bar / Close Pill */}
            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={onClose}
                    className="group bg-[#18181b] hover:bg-[#27272a] text-white/80 hover:text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 border border-white/10 shadow-lg hover:border-white/20 cursor-pointer"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Interactive Hotspot Analysis</span>
                    <span className="text-white/40 group-hover:text-white transition-colors ml-1">✕</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="relative flex items-center justify-center w-full max-w-[1260px] px-6 my-auto">
                {/* Central Phone Frame */}
                <div 
                    className="relative shrink-0 rounded-[18px] overflow-visible bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                    style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
                >
                    {activeScreen?.imageUrl && (
                        <img 
                            src={activeScreen.imageUrl} 
                            alt="Screen" 
                            onLoad={handleImageLoad}
                            className="w-full h-full object-fill rounded-[18px] select-none" 
                        />
                    )}
                    
                    {/* Loading State Overlay */}
                    {isInsightsLoading && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md rounded-[18px]">
                            <ThinkingOrb state="solving" size={64} speed={1.10} />
                            <div className="mt-6 bg-[#141414]/95 border border-white/15 px-4 py-2 rounded-full shadow-2xl">
                                <span className="text-[13px] font-medium text-white/95 animate-pulse tracking-wide">
                                    {loadingMessage || 'Analyzing UI patterns...'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0">
                        <defs>
                            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id="glow-pink" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {processedHotspots.map((item) => {
                            const isHovered = hoveredId === item.id;
                            const isAnyHovered = hoveredId !== null;
                            const isLeft = item.side === 'left';
                            
                            // Card connection point
                            const px1 = isLeft ? -56 : dimensions.width + 56;
                            const py1 = (item.cardY / 100) * dimensions.height;

                            // Hotspot pin position on phone
                            const px2 = (item.x / 100) * dimensions.width;
                            const py2 = (item.y / 100) * dimensions.height;

                            // Smooth cubic bezier with curvature
                            const curveOffset = isLeft ? 45 : -45;
                            const d = `M ${px1} ${py1} C ${px1 + curveOffset} ${py1}, ${px2 - (curveOffset * 0.6)} ${py2}, ${px2} ${py2}`;

                            const color = isLeft ? (isHovered ? "#60A5FA" : "#4E6BFF") : (isHovered ? "#F472B6" : "#E8348E");
                            const filter = isHovered ? (isLeft ? "url(#glow-blue)" : "url(#glow-pink)") : undefined;

                            return (
                                <g key={`line-${item.id}`} className="transition-all duration-300">
                                    <path 
                                        d={d} 
                                        fill="none" 
                                        stroke={color} 
                                        strokeWidth={isHovered ? "2.5" : "1.5"} 
                                        opacity={isHovered ? 1 : isAnyHovered ? 0.2 : 0.65} 
                                        strokeDasharray={isHovered ? "none" : "4 4"}
                                        filter={filter}
                                        className={isHovered ? "" : "animate-pulse"} 
                                    />
                                    <circle 
                                        cx={px1} 
                                        cy={py1} 
                                        r={isHovered ? 5 : 3.5} 
                                        fill={color} 
                                        opacity={isHovered ? 1 : isAnyHovered ? 0.3 : 1}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Hotspot Pins and Cards */}
                    {processedHotspots.map((item) => {
                        const isHovered = hoveredId === item.id;
                        const isAnyHovered = hoveredId !== null;
                        const isLeft = item.side === 'left';
                        const accentColor = isLeft ? '#4E6BFF' : '#E8348E';
                        const hoverRing = isLeft ? 'ring-blue-400' : 'ring-pink-400';
                        const hoverShadow = isLeft ? 'shadow-[0_0_16px_#60A5FA]' : 'shadow-[0_0_16px_#F472B6]';
                        const pingBorder = isLeft ? 'border-blue-400/60' : 'border-pink-400/60';

                        return (
                            <div 
                                key={`group-${item.id}`}
                                onMouseEnter={() => setHoveredId(item.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Pin on screen */}
                                <div 
                                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center cursor-pointer z-20 transition-transform duration-300 ${
                                        isHovered 
                                            ? `scale-125 bg-[${accentColor}]/50 border-2 border-white ${hoverShadow}` 
                                            : `bg-[${accentColor}]/35 border-2 border-[${accentColor}] shadow-[0_0_10px_${accentColor}]`
                                    }`}
                                    style={{ 
                                        left: `${item.x}%`, 
                                        top: `${item.y}%`, 
                                        transform: 'translate(-50%, -50%)',
                                        opacity: !isHovered && isAnyHovered ? 0.35 : 1
                                    }}
                                >
                                    <div className={`rounded-full transition-all duration-300 ${isHovered ? `w-2 h-2 bg-white ring-2 ${hoverRing}` : 'w-1.5 h-1.5 bg-white'}`} />
                                    {isHovered && (
                                        <span className={`absolute -inset-1 rounded-full border ${pingBorder} animate-ping pointer-events-none`} />
                                    )}
                                </div>

                                {/* Insight Card positioned directly on its own side */}
                                <div 
                                    className={`absolute ${isLeft ? 'right-[100%] mr-12' : 'left-[100%] ml-12'} w-[310px] px-4 py-3.5 rounded-[12px] z-30 cursor-pointer transition-all duration-300 ${
                                        isHovered
                                            ? `bg-[#18181c] border ${isLeft ? 'border-blue-400/80 shadow-[0_10px_35px_rgba(78,107,255,0.25)] -translate-x-1.5' : 'border-pink-400/80 shadow-[0_10px_35px_rgba(232,52,142,0.25)] translate-x-1.5'}`
                                            : `bg-[#141416]/95 border border-[${accentColor}]/25 shadow-[0_4px_20px_rgba(0,0,0,0.5)]`
                                    }`}
                                    style={{ 
                                        top: `${item.cardY}%`, 
                                        transform: `translateY(-50%) ${isHovered ? 'scale(1.02)' : 'scale(1)'}`,
                                        opacity: !isHovered && isAnyHovered ? 0.35 : 1
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <h3 className={`text-[13.5px] font-semibold tracking-tight transition-colors ${isHovered ? 'text-white' : 'text-white/90'} line-clamp-1`}>
                                            {item.title}
                                        </h3>
                                        {renderBadge(item.category)}
                                    </div>
                                    <p className="text-[#a1a1aa] text-[12.5px] leading-[1.5] font-normal">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Callout Banner */}
            <div className="mt-8 flex items-center justify-center gap-3 px-6 py-3.5 rounded-[14px] bg-[#141414]/90 border border-white/10 shadow-xl relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E8348E]/30 via-purple-500/30 to-[#4E6BFF]/30 p-[1px] rounded-[14px] pointer-events-none" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px' }} />
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#E8348E] to-[#4E6BFF] flex items-center justify-center shadow-sm shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                </div>
                <span className="text-[#a1a1aa] text-[13.5px]">See how your design compares to this UI.</span>
                <button 
                    onClick={onOpenCompare}
                    className="text-white font-medium text-[13.5px] underline underline-offset-4 hover:text-white/80 transition-colors cursor-pointer"
                >
                    Try Compare mode
                </button>
            </div>
        </div>
    );
}
