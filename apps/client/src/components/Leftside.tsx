import { useState } from "react";

const sameInfo =
    "This launch screen guides users to either Sign Up or Log In with minimal distraction. Strong branding and two equally weighted buttons keep the choice simple, while the consent text is placed directly above the actions to satisfy legal requirements. Account Recovery is intentionally de-emphasized as a secondary link so it remains available without competing with the main paths.";

const sections = [
    { title: "UX ANALYSIS", content: sameInfo, defaultOpen: true },
    { title: "KEY HIGHLIGHTS & UX PRINCIPLES", content: sameInfo, defaultOpen: false },
    { title: "EVIDENCE - WHO & WHY", content: sameInfo, defaultOpen: false },
    { title: "WHERE TO USE", content: sameInfo, defaultOpen: false },
    { title: "WHERE NOT TO USE", content: sameInfo, defaultOpen: false },
];

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

export function Leftside() {
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
        <div className="w-full flex flex-col gap-2 mt-8 xl:mt-[30px]">
            {sections.map((section, index) => {
                const isOpen = openStates[index];
                return (
                    <div
                        key={section.title}
                        className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] overflow-hidden"
                    >
                        <div
                            onClick={() => toggleSection(index)}
                            className="flex flex-row items-center justify-between p-5 sm:px-6 cursor-pointer select-none"
                        >
                            <span className="font-['Inter'] font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-[#878787]">
                                {section.title}
                            </span>
                            <PlusMinusIcon isOpen={isOpen} />
                        </div>

                        {isOpen && (
                            <p className="m-0 px-5 pb-5 sm:px-6 sm:pb-6 font-['Inter'] font-normal text-[14px] sm:text-[15px] leading-[24px] sm:leading-[26px] text-[#E5E7EB]">
                                {section.content}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}