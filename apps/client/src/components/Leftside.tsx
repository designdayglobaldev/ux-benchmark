import { useState } from "react";
import DOMPurify from 'dompurify';

import type { ScreenType } from "@/hooks/useAppDetails";

interface LeftsideProps {
    activeScreen?: ScreenType;
}

function PlusMinusIcon({ isOpen }: { isOpen: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <line x1="1" y1="7" x2="13" y2="7" stroke="#878787" strokeWidth="1.5" strokeLinecap="round" />
            {!isOpen && (
                <line x1="7" y1="1" x2="7" y2="13" stroke="#878787" strokeWidth="1.5" strokeLinecap="round" />
            )}
        </svg>
    );
}

export function Leftside({ activeScreen }: LeftsideProps) {
    const sections = [
        { title: "UX ANALYSIS", content: activeScreen?.uxAnalysis || "Analysis not available.", defaultOpen: false },
        { title: "KEY HIGHLIGHTS & UX PRINCIPLES", content: activeScreen?.keyHighlights || "Not available.", defaultOpen: false },
        { title: "EVIDENCE - WHO & WHY", content: activeScreen?.evidenceWhoWhy || "Not available.", defaultOpen: false },
        { title: "WHERE TO USE", content: activeScreen?.whereToUse || "Not available.", defaultOpen: false },
        { title: "WHERE NOT TO USE", content: activeScreen?.whereNotToUse || "Not available.", defaultOpen: false },
    ];

    const [openStates, setOpenStates] = useState<boolean[]>(
        sections.map((s) => s.defaultOpen)
    );

    const toggleSection = (index: number) => {
        setOpenStates((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    return (
        <div className="w-full flex flex-col gap-3 mt-8 xl:mt-[30px]">
            {sections.map((section, index) => {
                const isOpen = openStates[index];
                return (
                    <div
                        key={section.title}
                        className="w-full rounded-[12px] bg-[#111111] overflow-hidden"
                    >
                        <div
                            onClick={() => toggleSection(index)}
                            className="flex flex-row items-center justify-between px-4 py-3 cursor-pointer select-none"
                        >
                            <span className="font-['Inter'] font-normal text-[12px] leading-normal tracking-[0.04em] uppercase text-[#BDBDBD]">
                                {section.title}
                            </span>
                            <PlusMinusIcon isOpen={isOpen} />
                        </div>

                        {isOpen && (
                            <div 
                                className="m-0 px-4 pb-3 pt-0 font-['Inter'] font-normal text-[13px] leading-[22px] text-[#E5E7EB] prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content, { ADD_ATTR: ['style'] }) }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}