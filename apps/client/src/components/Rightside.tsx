import { Smallbox } from "./Smallbox";
import DOMPurify from 'dompurify';
import type { ScreenType } from "@/hooks/useAppDetails";

interface RightsideProps {
    activeScreen?: ScreenType;
    appName?: string;
    categoryTitle?: string;
}

export function Rightside({ activeScreen, appName, categoryTitle }: RightsideProps) {
    return (
        <div className="w-full flex flex-col gap-3 mt-8 xl:mt-[30px] xl:sticky xl:top-[30px]">
            
            {/* Box 1: App Info */}
            <div className="w-full rounded-[6px] bg-[#111111] px-[14px] pt-[10px] pb-[14px] flex flex-col gap-3">
                <span className="font-['Inter'] font-normal text-[14px] leading-[22px] text-[#BDBDBD]">
                    {appName || 'App'} · {categoryTitle || 'Category'}
                </span>
                <h2 className="font-['Inter'] font-medium text-[16px] leading-[22px] text-white/80 m-0">
                    {activeScreen?.name || 'Screen Name'}
                </h2>
                {activeScreen?.uxAnalysis ? (
                    <div 
                        className="m-0 font-['Inter'] font-normal text-[13px] leading-[22px] text-[#E5E7EB] prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeScreen.uxAnalysis, { ADD_ATTR: ['style'] }) }}
                    />
                ) : (
                    <p className="m-0 font-['Inter'] font-normal text-[13px] leading-[22px] text-[#E5E7EB]">
                        Select a screen to view details.
                    </p>
                )}
            </div>

            {/* Box 2: UI Elements */}
            <div className="w-full rounded-[6px] bg-[#111111] px-[14px] pt-[10px] pb-[14px] flex flex-col gap-3">
                <span className="font-['Inter'] font-normal text-[12px] leading-normal tracking-[0.04em] uppercase text-[#BDBDBD]">
                    UI Elements
                </span>
                <div className="flex flex-wrap gap-2.5">
                    {activeScreen?.uiElements?.length ? (
                        activeScreen.uiElements.map((el, i) => (
                            <Smallbox key={i} text={el.title} />
                        ))
                    ) : (
                        <span className="text-[#878787] text-[13px]">No elements tagged</span>
                    )}
                </div>
            </div>

            {/* Box 3: Patterns */}
            <div className="w-full rounded-[6px] bg-[#111111] px-[14px] pt-[10px] pb-[14px] flex flex-col gap-3">
                <span className="font-['Inter'] font-normal text-[12px] leading-normal tracking-[0.04em] uppercase text-[#BDBDBD]">
                    Patterns
                </span>
                <div className="flex flex-wrap gap-2.5">
                    {activeScreen?.patterns?.length ? (
                        activeScreen.patterns.map((pt, i) => (
                            <Smallbox key={i} text={pt.title} />
                        ))
                    ) : (
                        <span className="text-[#878787] text-[13px]">No patterns tagged</span>
                    )}
                </div>
            </div>

            {/* Box 4: Flow */}
            <div className="w-full rounded-[6px] bg-[#111111] px-[14px] pt-[10px] pb-[14px] flex flex-col gap-3">
                <span className="font-['Inter'] font-normal text-[12px] leading-normal tracking-[0.04em] uppercase text-[#BDBDBD]">
                    Flow
                </span>
                <div className="flex flex-col gap-2.5 items-start">
                    {activeScreen?.flow ? (
                        <Smallbox text={activeScreen.flow.name} />
                    ) : (
                        <span className="text-[#878787] text-[13px]">Not part of a flow</span>
                    )}
                </div>
            </div>

        </div>
    );
}