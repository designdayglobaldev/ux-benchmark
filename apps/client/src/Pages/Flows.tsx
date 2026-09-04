import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface Flow {
    id: string;
    name: string;
    slug: string;
    screens: any[];
}

export function Flows() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useSEO({
        title: "Flows",
        description: "Explore how top apps build every flow."
    });

    useEffect(() => {
        const fetchFlows = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                const res = await fetch(`${apiUrl}/api/v1/flows`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                // Only keep flows that have at least one screen
                const flowsWithScreens = data.filter((flow: Flow) => flow.screens && flow.screens.length > 0);
                setFlows(flowsWithScreens);
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFlows();
    }, []);

    return (
        <main className="flex-1 w-full bg-black flex flex-col items-center pb-20 sm:pb-32 min-h-screen">
            <div className="w-full max-w-[1400px] px-4 sm:px-6 xl:px-4 pt-10 sm:pt-14">
                


                {/* Grid of Flows */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <Skeleton className="rounded-[24px] aspect-[4/3] w-full" />
                                <div className="flex flex-col gap-2 px-1">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-20">Error loading flows. Please try again later.</div>
                ) : flows.length === 0 ? (
                    <div className="text-center text-[#A1A1A1] py-20">No flows found.</div>
                ) : (
                    <div className="relative w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                            {(user || isAuthLoading ? flows : flows.slice(0, 6)).map((flow, index) => {
                                const isBlurred = !user && !isAuthLoading && index >= 3;
                                
                                // Calculate stats
                            const uniqueApps = new Map();
                            flow.screens.forEach(s => {
                                if (s.app && s.app.slug) {
                                    uniqueApps.set(s.app.slug, s.app);
                                }
                            });
                            const appCount = uniqueApps.size;
                            const screenCount = flow.screens.length;
                            const appList = Array.from(uniqueApps.values());
                            
                            // Take up to 3 screens for the preview
                            const previewScreens = flow.screens.slice(0, 3);

                            return (
                                <div key={flow.id} className={`flex flex-col gap-4 group ${isBlurred ? 'pointer-events-none select-none' : ''}`}>
                                    <div 
                                        onClick={() => {
                                            if (!isBlurred && appList.length > 0) {
                                                navigate(`/app/${appList[0].slug}/flows`);
                                            }
                                        }}
                                        className="bg-[#161616] border border-[#222222] rounded-[24px] p-6 aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center cursor-pointer transition-colors hover:bg-[#1E1E1E]"
                                    >
                                        <div className="flex items-center justify-center w-full h-full p-6">
                                            {previewScreens.map((screen, index) => {
                                                const total = previewScreens.length;
                                                let cardClass = "relative rounded-[12px] overflow-hidden shadow-xl border border-[#333] transition-transform duration-300 group-hover:-translate-y-2 bg-[#1C1C1C] flex-shrink-0";
                                                
                                                if (total === 3) {
                                                    if (index === 0) {
                                                        cardClass += " w-[32%] aspect-[9/19] z-0 opacity-60 translate-x-[30%] -rotate-6";
                                                    } else if (index === 1) {
                                                        cardClass += " w-[38%] aspect-[9/19] z-20 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
                                                    } else {
                                                        cardClass += " w-[32%] aspect-[9/19] z-0 opacity-60 -translate-x-[30%] rotate-6";
                                                    }
                                                } else if (total === 2) {
                                                    if (index === 0) {
                                                        cardClass += " w-[38%] aspect-[9/19] z-10 opacity-100 mr-4";
                                                    } else {
                                                        cardClass += " w-[38%] aspect-[9/19] z-10 opacity-100";
                                                    }
                                                } else {
                                                    // total === 1
                                                    cardClass += " w-[45%] aspect-[9/19] z-10 opacity-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
                                                }

                                                return (
                                                    <div key={screen.id} className={cardClass}>
                                                        <OptimizedImage 
                                                            src={screen.imageUrl} 
                                                            alt={`${flow.name} Screen ${index + 1}`} 
                                                            optimizationWidth={300}
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start justify-between px-2">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-white text-[18px] font-semibold tracking-tight">{flow.name}</h3>
                                            <p className="text-[#888888] text-[13px]">
                                                {screenCount} screens · {appCount} apps
                                            </p>
                                        </div>
                                        
                                        {/* App Icons (up to 3) */}
                                        <div className="flex -space-x-2">
                                            {appList.slice(0, 3).map((app: any, idx: number) => (
                                                <div key={app.slug} className="w-6 h-6 rounded-md bg-white p-0.5 border border-[#333] z-10" style={{ zIndex: 10 - idx }}>
                                                    <OptimizedImage
                                                        src={app.appLogo || "/placeholder-logo.png"}
                                                        alt={app.name}
                                                        optimizationWidth={50}
                                                        className="w-full h-full object-contain rounded-[4px]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                        
                        {/* Overlay for Unauthenticated Users */}
                        {!user && !isAuthLoading && flows.length > 3 && (
                            <div className="absolute top-[20%] left-0 right-0 bottom-[-120px] z-30 flex flex-col items-center justify-end pb-[160px] sm:pb-[180px]">
                                {/* Progressive Blur & Gradient Background */}
                                <div 
                                    className="absolute inset-0 backdrop-blur-[12px] bg-gradient-to-b from-transparent via-[#000000]/60 to-[#000000]"
                                    style={{ 
                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 80%)',
                                        maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 80%)' 
                                    }}
                                ></div>
                                
                                {/* Content */}
                                <div className="relative z-10 flex flex-col items-center">
                                    <h2 className="text-[24px] font-semibold text-white mb-2 tracking-[-0.06em]">Unlock all flows</h2>
                                    <p className="text-[#CFCFCF] text-[16px] font-normal mb-6 text-center tracking-[-0.06em]">Log in to explore how top apps build every feature.</p>
                                    <Button 
                                        onClick={() => navigate('/register')}
                                        className="bg-white text-black hover:bg-gray-200 rounded-full px-6 h-9 font-medium text-[14px]"
                                    >
                                        Join Free
                                    </Button>
                                    <div className="flex items-center gap-2.5 mt-6">
                                        <div className="flex -space-x-1.5">
                                            {[
                                                "https://i.pravatar.cc/100?img=68",
                                                "https://i.pravatar.cc/100?img=47",
                                                "https://i.pravatar.cc/100?img=44",
                                                "https://i.pravatar.cc/100?img=33"
                                            ].map((url, i) => (
                                                <img 
                                                    key={i} 
                                                    src={url} 
                                                    alt="Designer avatar" 
                                                    className="w-5 h-5 rounded-full border border-[#060606] object-cover" 
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[14px] font-normal text-[#CFCFCF] tracking-[-0.06em]">Supporting over 1M designers worldwide</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
