import { Leftside } from "../components/Leftside";
import { Middle } from "../components/Middle";
import { Rightside } from "../components/Rightside";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAppDetails } from "@/hooks/useAppDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";

export function AppScreens() {
    const navigate = useNavigate();
    const { slug, screenSlug } = useParams<{ slug: string; screenSlug?: string }>();
    const { data: appData, isLoading } = useAppDetails(slug || '');

    const screens = useMemo(() => {
        if (!appData?.screens) return [];
        return [...appData.screens].sort((a, b) => {
            const seqA = appData.appFlows?.find((af: any) => af.flowId === a.flowId)?.sequence ?? 999999;
            const seqB = appData.appFlows?.find((af: any) => af.flowId === b.flowId)?.sequence ?? 999999;
            
            if (seqA !== seqB) {
                return seqA - seqB;
            }
            
            // Fallback to screenNo if in the same flow or both unsequenced
            return (a.screenNo || 0) - (b.screenNo || 0);
        });
    }, [appData?.screens, appData?.appFlows]);

    // Auto-redirect to the first screen's slug if missing
    useEffect(() => {
        if (!isLoading && screens.length > 0 && !screenSlug) {
            navigate(`/app/${slug}/screens/${encodeURIComponent(screens[0].slug)}`, { replace: true });
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

    useSEO({
        title: activeScreen ? `${activeScreen.name} | ${appData?.name || 'App'}` : (appData ? `${appData.name} Screens` : 'Loading Screen...'),
        description: activeScreen?.keyHighlights || appData?.description || 'Explore the screens and UX patterns of this application.',
        image: activeScreen?.imageUrl || appData?.appThumbnail || appData?.appLogo
    });

    if (isLoading) {
        return (
            <main className="flex-1 w-full bg-black relative min-h-screen pb-[65px]">
                <div className="flex flex-col xl:flex-row justify-between items-center xl:items-stretch pt-8 xl:pt-4 px-4 sm:px-8 gap-8 xl:gap-4 max-w-[1400px] mx-auto">
                    <div className="w-full xl:w-[384px] shrink-0 xl:sticky xl:top-[100px] flex flex-col gap-3">
                        <Skeleton className="h-[60px] w-full" />
                        <Skeleton className="h-[200px] w-full" />
                    </div>
                    <div className="w-full flex-1 flex justify-center order-first xl:order-none mt-8 xl:mt-[30px]">
                        <Skeleton className="w-[200px] sm:w-[230px] h-[430px] sm:h-[500px] rounded-[16px]" />
                    </div>
                    <div className="w-full xl:w-[384px] shrink-0 xl:sticky xl:top-[100px] flex flex-col gap-3">
                        <Skeleton className="h-[120px] w-full" />
                        <Skeleton className="h-[80px] w-full" />
                    </div>
                </div>
            </main>
        );
    }

    const nextUrl = activeIndex < screens.length - 1 ? `/app/${slug}/screens/${encodeURIComponent(screens[activeIndex + 1].slug)}` : undefined;
    const prevUrl = activeIndex > 0 ? `/app/${slug}/screens/${encodeURIComponent(screens[activeIndex - 1].slug)}` : undefined;

    return (
        <main className="flex-1 w-full bg-black relative min-h-screen pb-[65px]">
            {/* Main container: stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col xl:flex-row justify-between items-center xl:items-stretch pt-6 px-4 xl:px-6 gap-8 xl:gap-4 w-full max-w-[1920px] mx-auto">

                <div className="w-full xl:w-[300px] shrink-0 xl:sticky xl:top-[100px] xl:h-[calc(100vh-120px)] xl:overflow-y-auto xl:pb-8 scrollbar-hide">
                    <Leftside activeScreen={activeScreen} />
                </div>

                {/* Middle Panel (Screenshot & Controls) */}
                <div className="w-full flex-1 flex justify-center order-first xl:order-none">
                    <Middle
                        activeScreen={activeScreen}
                        appName={appData?.name}
                        appSlug={slug}
                        nextUrl={nextUrl}
                        prevUrl={prevUrl}
                    />
                </div>

                {/* Right Panel */}
                <div className="w-full xl:w-[300px] shrink-0 xl:sticky xl:top-[100px] xl:h-[calc(100vh-120px)] xl:overflow-y-auto xl:pb-8 scrollbar-hide">
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
