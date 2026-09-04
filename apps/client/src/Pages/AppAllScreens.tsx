import { useParams, useNavigate } from "react-router-dom";
import { useAppDetails } from "@/hooks/useAppDetails";
import { useApps } from "@/hooks/useApps";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import RevolutLogo from "@/assets/Revolut_logo.png";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveFlowModal } from "@/components/InteractiveFlowModal";
import { useSEO } from "@/hooks/useSEO";

function ImageWithSkeleton({ src, alt, className, loading = "lazy" }: { src: string, alt: string, className?: string, loading?: "eager" | "lazy" }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {!isLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
            <img 
                src={src} 
                alt={alt}
                loading={loading}
                onLoad={() => setIsLoaded(true)}
                className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            />
        </>
    );
}

export function AppAllScreens() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: appData, isLoading } = useAppDetails(slug || '');
    const { user } = useAuth();
    const { data: rawAllApps } = useApps();
    const allApps = !user && rawAllApps ? rawAllApps.slice(0, 4) : rawAllApps;

    const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
    const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState(false);

    useSEO({
        title: appData ? `${appData.name} All Screens` : 'Loading Screens...',
        description: appData?.description || 'Explore all screens of this application.',
        image: appData?.appThumbnail || appData?.appLogo
    });

    // Calculate previous and next apps for navigation
    let prevAppSlug: string | null = null;
    let nextAppSlug: string | null = null;
    if (allApps && slug) {
        const currentIndex = allApps.findIndex(app => app.slug === slug);
        if (currentIndex > 0) prevAppSlug = allApps[currentIndex - 1].slug;
        if (currentIndex !== -1 && currentIndex < allApps.length - 1) nextAppSlug = allApps[currentIndex + 1].slug;
    }

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    const flows = useMemo(() => {
        if (!appData?.screens) return [];
        
        const flowMap = new Map();
        appData.screens.forEach(screen => {
            if (!screen.flow) return;
            if (!flowMap.has(screen.flow.id)) {
                flowMap.set(screen.flow.id, {
                    id: screen.flow.id,
                    name: screen.flow.name,
                    screens: []
                });
            }
            flowMap.get(screen.flow.id).screens.push(screen);
        });

        const flowsList = Array.from(flowMap.values());
        
        flowsList.sort((a, b) => {
            const indexA = appData.appFlows?.find(f => f.flowId === a.id)?.sequence ?? 999;
            const indexB = appData.appFlows?.find(f => f.flowId === b.id)?.sequence ?? 999;
            return indexA - indexB;
        });

        flowsList.forEach(flow => {
            flow.screens.sort((a: any, b: any) => (a.screenNo || 0) - (b.screenNo || 0));
        });

        return flowsList;
    }, [appData]);

    if (isLoading) {
        return (
            <main className="flex-1 w-full bg-black relative flex flex-col items-center">
                <div className="w-full max-w-[1400px] px-4 sm:px-8 xl:px-4 py-8">
                    <Skeleton className="h-6 w-64 mb-12" />
                    <Skeleton className="h-20 w-20 rounded-2xl mb-6" />
                    <Skeleton className="h-10 w-96 mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-12" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Skeleton className="h-[500px] rounded-xl" />
                        <Skeleton className="h-[500px] rounded-xl" />
                        <Skeleton className="h-[500px] rounded-xl" />
                        <Skeleton className="h-[500px] rounded-xl" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 w-full bg-black relative flex flex-col items-center pb-32">
            <div className="w-full max-w-[1400px] px-4 sm:px-8 xl:px-4 pt-8">
                
                {/* Breadcrumbs & Navigation */}
                <div className="flex items-center justify-between mb-[60px]">
                    <div className="flex items-center gap-2 font-['Inter'] text-[13px] text-[#5E5E5E]">
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate("/")}>Library</span>
                        <span>{'>'}</span>
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate("/")}>Apps</span>
                        <span>{'>'}</span>
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate(`/app/${slug}`)}>{appData?.name || 'App'}</span>
                        <span>{'>'}</span>
                        <span className="cursor-pointer hover:text-white transition-colors" onClick={() => navigate(`/app/${slug}/flows`)}>Flows</span>
                        <span>{'>'}</span>
                        <span className="text-white font-medium">All Screens</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            disabled={!prevAppSlug}
                            onClick={() => prevAppSlug && navigate(`/app/${prevAppSlug}/all-screens`)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#323232] bg-transparent text-[13px] font-['Inter'] transition-colors ${prevAppSlug ? 'text-[#878787] hover:text-white hover:border-[#5E5E5E]' : 'text-[#444] opacity-50 cursor-not-allowed'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            Prev App
                        </button>
                        <button 
                            disabled={!nextAppSlug}
                            onClick={() => nextAppSlug && navigate(`/app/${nextAppSlug}/all-screens`)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#323232] bg-transparent text-[13px] font-['Inter'] transition-colors ${nextAppSlug ? 'text-[#878787] hover:text-white hover:border-[#5E5E5E]' : 'text-[#444] opacity-50 cursor-not-allowed'}`}
                        >
                            Next App
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>

                {/* App Header Info */}
                <div className="flex flex-col mb-12">
                    <div className="flex items-center gap-6">
                        <img
                            src={appData?.appLogo || RevolutLogo}
                            alt={`${appData?.name || 'App'} Logo`}
                            className="w-[80px] h-[80px] rounded-[20px]"
                        />
                        <div className="flex flex-col">
                            <h1 className="font-['Inter'] font-medium text-[32px] sm:text-[40px] leading-none tracking-[-0.03em] text-white m-0">
                                {appData?.name || 'App Name'}
                            </h1>
                            <p className="mt-[10px] font-['Inter'] font-normal text-[14px] sm:text-[16px] leading-none text-[#5E5E5E] m-0">
                                {appData?.description || 'App description goes here'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="w-full h-[1px] bg-[#2B2B29] mb-16"></div>

                {/* Main Content Area */}
                <div className="flex flex-col gap-24 w-full">
                    {flows.length === 0 ? (
                        <div className="text-[#5E5E5E] text-lg text-center py-12">No screens found for this app.</div>
                    ) : (
                        flows.map((flow: any) => (
                            <div key={flow.id} className="flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="font-['Inter'] font-bold text-[28px] text-white">
                                        {flow.name}
                                    </h2>
                                    <button 
                                        onClick={() => {
                                            setActiveFlowId(flow.id);
                                            setIsInteractiveModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 bg-[#2B2B29] hover:bg-[#323232] text-white text-[13px] px-4 py-2 rounded-full transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        interactive flow
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                                    {flow.screens.map((screen: any) => (
                                        <div key={screen.id} className="flex flex-col relative group">
                                            <div className="w-full aspect-[230/500] relative overflow-hidden rounded-[24px]">
                                                <ImageWithSkeleton 
                                                    src={screen.imageUrl} 
                                                    alt={screen.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4 z-10">
                                                    <div className="bg-[#1C1C1C] rounded-[16px] p-5 shadow-2xl flex flex-col gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full">
                                                        <span className="text-[10px] font-bold tracking-wider text-[#5E5E5E] uppercase">UX ANALYSIS</span>
                                                        {screen.uxAnalysis ? (
                                                            <div 
                                                                className="text-[13px] text-white leading-relaxed line-clamp-4 [&>p]:m-0"
                                                                dangerouslySetInnerHTML={{ __html: screen.uxAnalysis }} 
                                                            />
                                                        ) : (
                                                            <p className="text-[13px] text-white leading-relaxed line-clamp-4">
                                                                Detailed UX analysis for this screen is available in the inspector view.
                                                            </p>
                                                        )}
                                                        <button 
                                                            onClick={() => navigate(`/app/${slug}/screens/${screen.slug}`)}
                                                            className="mt-2 bg-[#0099FF] text-white text-[12px] font-medium py-2 px-3 rounded-full hover:bg-[#0088EE] transition-colors w-full flex items-center justify-center gap-1.5 whitespace-nowrap"
                                                        >
                                                            Inspect Details
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <InteractiveFlowModal 
                isOpen={isInteractiveModalOpen}
                onClose={() => setIsInteractiveModalOpen(false)}
                flow={flows.find((f: any) => f.id === activeFlowId)}
            />
        </main>
    );
}
