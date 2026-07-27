import RevolutScreenshot from "@/assets/Revolut.png";
import type { ScreenType } from "@/hooks/useAppDetails";

interface MiddleProps {
    activeScreen?: ScreenType;
    appName?: string;
    appSlug?: string;
    activeIndex: number;
    totalScreens: number;
    onNext: () => void;
    onPrev: () => void;
}

export function Middle({ activeScreen, appName, appSlug, activeIndex, totalScreens, onNext, onPrev }: MiddleProps) {
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
                        <button 
                            onClick={onPrev}
                            disabled={activeIndex === 0}
                            className={`absolute top-1/2 -translate-y-1/2 right-full mr-4 xl:mr-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#3f3f46]'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>

                        <img
                            src={activeScreen?.imageUrl || RevolutScreenshot}
                            alt="App Screenshot"
                            className="w-[200px] sm:w-[230px] h-[430px] sm:h-[500px] rounded-[16px] object-contain mx-auto block"
                        />

                        {/* Right Navigation Button */}
                        <button 
                            onClick={onNext}
                            disabled={activeIndex === totalScreens - 1}
                            className={`absolute top-1/2 -translate-y-1/2 left-full ml-4 xl:ml-[60px] z-20 w-[40px] h-[40px] xl:w-[48px] xl:h-[48px] rounded-full bg-[#27272A] border-none flex items-center justify-center transition-colors shadow-lg ${activeIndex === totalScreens - 1 || totalScreens === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#3f3f46]'}`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
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
                </div>
            </div>
        </div>
    );
}