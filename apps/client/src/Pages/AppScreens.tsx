import { Leftside } from "../components/Leftside";
import { Middle } from "../components/Middle";
import { Rightside } from "../components/Rightside";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppDetails } from "@/hooks/useAppDetails";
import { Skeleton } from "@/components/ui/skeleton";

export function AppScreens() {
    const navigate = useNavigate();
    const { slug, screenSlug } = useParams<{ slug: string; screenSlug?: string }>();
    const { data: appData, isLoading } = useAppDetails(slug || '');
    const [isTransitioning, setIsTransitioning] = useState(true);

    const screens = appData?.screens || [];
    
    // Auto-redirect to the first screen's slug if missing
    useEffect(() => {
        if (!isLoading && screens.length > 0 && !screenSlug) {
            navigate(`/app/${slug}/screens/${screens[0].slug}`, { replace: true });
        }
    }, [isLoading, screens, screenSlug, slug, navigate]);

    let activeIndex = 0;
    if (screenSlug && screens.length > 0) {
        const foundIndex = screens.findIndex(s => s.slug === screenSlug);
        if (foundIndex !== -1) {
            activeIndex = foundIndex;
        }
    }

    const activeScreen = screens[activeIndex];

    // Preload image for smooth transitions
    useEffect(() => {
        if (!activeScreen?.imageUrl) {
            setIsTransitioning(false);
            return;
        }
        
        setIsTransitioning(true);
        const img = new Image();
        img.onload = () => setIsTransitioning(false);
        img.onerror = () => setIsTransitioning(false);
        img.src = activeScreen.imageUrl;
    }, [activeScreen?.imageUrl]);

    if (isLoading || isTransitioning) {
        return (
            <main className="flex-1 w-full bg-black relative min-h-screen pb-[65px]">
                <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start pt-8 xl:pt-4 px-4 sm:px-8 gap-8 xl:gap-4 max-w-[1400px] mx-auto">
                    <div className="w-full xl:w-[384px] shrink-0 xl:sticky xl:top-[100px] flex flex-col gap-3">
                        <Skeleton className="h-[60px] w-full" />
                        <Skeleton className="h-[200px] w-full" />
                    </div>
                    <div className="w-full flex-1 flex justify-center order-first xl:order-none mt-8 xl:mt-[30px]">
                        <Skeleton className="w-[200px] sm:w-[230px] h-[430px] sm:h-[500px] rounded-[16px]" />
                    </div>
                    <div className="w-full xl:w-[311px] shrink-0 xl:sticky xl:top-[100px] flex flex-col gap-3">
                        <Skeleton className="h-[120px] w-full" />
                        <Skeleton className="h-[80px] w-full" />
                    </div>
                </div>
            </main>
        );
    }

    const handleNext = () => {
        if (activeIndex < screens.length - 1) {
            navigate(`/app/${slug}/screens/${screens[activeIndex + 1].slug}`);
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            navigate(`/app/${slug}/screens/${screens[activeIndex - 1].slug}`);
        }
    };

    return (
        <main className="flex-1 w-full bg-black relative min-h-screen pb-[65px]">
            {/* Main container: stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start pt-8 xl:pt-4 px-4 sm:px-8 gap-8 xl:gap-4 max-w-[1400px] mx-auto">
                
                <div className="w-full xl:w-[384px] shrink-0 xl:sticky xl:top-[100px] xl:h-[calc(100vh-120px)] xl:overflow-y-auto xl:pb-8 scrollbar-hide">
                    <Leftside activeScreen={activeScreen} />
                </div>

                {/* Middle Panel (Screenshot & Controls) */}
                <div className="w-full flex-1 flex justify-center order-first xl:order-none">
                    <Middle 
                        activeScreen={activeScreen}
                        appName={appData?.name}
                        appSlug={slug}
                        activeIndex={activeIndex}
                        totalScreens={screens.length}
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                </div>

                {/* Right Panel */}
                <div className="w-full xl:w-[311px] shrink-0 xl:sticky xl:top-[100px] xl:h-[calc(100vh-120px)] xl:overflow-y-auto xl:pb-8 scrollbar-hide">
                    <Rightside 
                        activeScreen={activeScreen}
                        appName={appData?.name}
                        categoryTitle={appData?.category?.title}
                    />
                </div>
            </div>
        </main>
    );
}
