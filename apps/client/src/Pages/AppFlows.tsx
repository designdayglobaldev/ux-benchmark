import { useParams, useNavigate } from "react-router-dom";
import { useAppDetails, type ScreenType } from "@/hooks/useAppDetails";
import { useApps } from "@/hooks/useApps";
import { useState, useEffect } from "react";
import RevolutLogo from "@/assets/Revolut_logo.png";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractiveFlowModal } from "@/components/InteractiveFlowModal";
import { useSEO } from "@/hooks/useSEO";

interface Flow {
    id: string;
    name: string;
    screens: ScreenType[];
}

function ImageWithSkeleton({ src, alt, className, loading = "lazy" }: { src: string, alt: string, className?: string, loading?: "eager" | "lazy" }) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <>
            {!isLoaded && <Skeleton className={`absolute inset-0 ${className}`} />}
            <img 
                src={src} 
                alt={alt}
                loading={loading}
                className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                onLoad={() => setIsLoaded(true)}
            />
        </>
    );
}

export function AppFlows() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: appData, isLoading } = useAppDetails(slug || '');
    const { data: allApps } = useApps();
    const [activeFlowId, setActiveFlowId] = useState<string | null>(null);
    const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState(false);

    useSEO({
        title: appData ? `${appData.name} Flows` : 'Loading Flows...',
        description: appData?.description || 'Explore the various flows and interactions of this application.',
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
        setActiveFlowId(null);
    }, [slug]);

    // Group screens into flows
    const flows: Flow[] = [];
    if (appData?.screens) {
        const flowMap = new Map<string, Flow>();
        appData.screens.forEach(screen => {
            if (screen.flow) {
                if (!flowMap.has(screen.flow.id)) {
                    flowMap.set(screen.flow.id, {
                        id: screen.flow.id,
                        name: screen.flow.name,
                        screens: []
                    });
                }
                flowMap.get(screen.flow.id)!.screens.push(screen);
            }
        });
        flows.push(...Array.from(flowMap.values()));

        if (appData.appFlows) {
            flows.sort((a, b) => {
                const seqA = appData.appFlows?.find((af: any) => af.flowId === a.id)?.sequence ?? 999999;
                const seqB = appData.appFlows?.find((af: any) => af.flowId === b.id)?.sequence ?? 999999;
                return seqA - seqB;
            });
        }
    }

    // Sort flows by screenNo inside each flow
    flows.forEach(flow => {
        flow.screens.sort((a: any, b: any) => (a.screenNo || 0) - (b.screenNo || 0));
    });

    useEffect(() => {
        if (flows.length > 0 && !activeFlowId) {
            setActiveFlowId(flows[0].id);
        }
    }, [flows, activeFlowId]);

    const activeFlow = flows.find(f => f.id === activeFlowId);

    if (isLoading) {
        return (
            <main className="flex-1 w-full bg-black relative flex flex-col items-center">
                <div className="w-full max-w-[1400px] px-4 sm:px-8 xl:px-4 py-8">
                    <Skeleton className="h-6 w-64 mb-12" />
                    <Skeleton className="h-20 w-20 rounded-2xl mb-6" />
                    <Skeleton className="h-10 w-96 mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-12" />
                    <div className="flex gap-8">
                        <Skeleton className="w-[280px] h-[600px] rounded-xl" />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Skeleton className="h-[500px] rounded-xl" />
                            <Skeleton className="h-[500px] rounded-xl" />
                            <Skeleton className="h-[500px] rounded-xl" />
                        </div>
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
                        <span className="text-white font-medium">Flows</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            disabled={!prevAppSlug}
                            onClick={() => prevAppSlug && navigate(`/app/${prevAppSlug}/flows`)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#323232] bg-transparent text-[13px] font-['Inter'] transition-colors ${prevAppSlug ? 'text-[#878787] hover:text-white hover:border-[#5E5E5E]' : 'text-[#444] opacity-50 cursor-not-allowed'}`}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            Prev
                        </button>
                        <button 
                            disabled={!nextAppSlug}
                            onClick={() => nextAppSlug && navigate(`/app/${nextAppSlug}/flows`)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-[#323232] bg-transparent text-[13px] font-['Inter'] transition-colors ${nextAppSlug ? 'text-[#878787] hover:text-white hover:border-[#5E5E5E]' : 'text-[#444] opacity-50 cursor-not-allowed'}`}
                        >
                            Next
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

                {/* Metadata Row */}
                <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-between w-full gap-y-6 mb-16 border-t border-b border-[#2B2B29] py-6">
                    <div className="flex flex-col gap-[10px]">
                        <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Category</span>
                        <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">{appData?.category?.title || appData?.tags?.[0] || 'Finance'}</span>
                    </div>

                    <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Platform</span>
                        <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">{(appData?.platform && appData.platform.length > 0) ? appData.platform.join(' · ') : 'iOS · Android'}</span>
                    </div>

                    <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Market</span>
                        <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">{(appData?.market && appData.market.length > 0) ? appData.market.join(' · ') : 'Worldwide'}</span>
                    </div>

                    <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                    <div className="flex flex-col gap-[10px]">
                        <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Target User</span>
                        <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">{appData?.targetAudience || 'Busy urban, on the go'}</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 w-full lg:items-stretch">
                    
                    {/* Left Sidebar */}
                    <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4 lg:sticky lg:top-8">
                        <div className="bg-[#1C1C1C] rounded-xl p-2 flex flex-col min-h-[400px]">
                            {flows.map(flow => (
                                <button
                                    key={flow.id}
                                    onClick={() => setActiveFlowId(flow.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-['Inter'] text-[14px] transition-colors ${
                                        activeFlowId === flow.id 
                                            ? 'bg-[#323232] text-white font-medium' 
                                            : 'text-[#878787] hover:bg-[#2B2B29] hover:text-white'
                                    }`}
                                >
                                    {flow.name}
                                </button>
                            ))}
                            {flows.length === 0 && (
                                <div className="text-[#5E5E5E] text-sm p-4 text-center">No flows found for this app.</div>
                            )}
                            
                            <div className="mt-auto pt-4 pb-2 px-2">
                                <button 
                                    onClick={() => navigate(`/app/${slug}/screens`)}
                                    className="w-full bg-[#0099FF] text-white rounded-full py-3 font-medium text-[14px] hover:bg-[#0088EE] transition-colors"
                                >
                                    Start Exploring
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {activeFlow && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-['Inter'] font-bold text-[24px] text-white">
                                        {activeFlow.name}
                                    </h2>
                                    <button 
                                        onClick={() => setIsInteractiveModalOpen(true)}
                                        className="flex items-center gap-2 bg-[#2B2B29] hover:bg-[#323232] text-white text-[13px] px-4 py-2 rounded-full transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        interactive flow
                                    </button>
                                </div>
                                <p className="font-['Inter'] text-[14px] text-[#878787] mb-12 max-w-[800px] leading-relaxed">
                                    Screens for the {activeFlow.name} flow. Use the interactive flow button to view them in the inspector.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                                    {activeFlow.screens.map((screen) => (
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
                            </>
                        )}
                    </div>

                </div>
            </div>

            <InteractiveFlowModal 
                isOpen={isInteractiveModalOpen}
                onClose={() => setIsInteractiveModalOpen(false)}
                flow={activeFlow}
            />
        </main>
    );
}
