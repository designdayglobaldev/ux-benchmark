import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, Plus } from "lucide-react";
import revolutImg from "@/assets/Revolut.png";
import revolutLogo from "@/assets/Revolut_logo.png";
// @ts-ignore
import { SubmitModule } from "../components/Submit_module";
import { useApps } from "@/hooks/useApps";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useEffect } from "react";

import { useNavigate } from 'react-router-dom'

export function Dashboard() {
    const navigate = useNavigate();
    const [activeCategorySlug, setActiveCategorySlug] = useState("latest");
    const [categories, setCategories] = useState<{slug: string, name: string}[]>([]);
    
    // Build query string for the active category
    const queryString = activeCategorySlug !== 'latest' ? `category=${activeCategorySlug}` : '';
    const { data: apps, isLoading, error } = useApps(queryString);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                const catRes = await fetch(`${apiUrl}/api/v1/categories`);
                const data = await catRes.json();
                setCategories([{ slug: 'latest', name: 'Latest' }, ...data]);
            } catch (e) {
                console.error("Failed to fetch categories", e);
                // Fallback
                setCategories([{ slug: 'latest', name: 'Latest' }]);
            }
        };
        fetchCategories();
    }, []);

    return (
        <main className="flex-1 w-full bg-black flex flex-col items-center pt-8 sm:pt-[50px] px-4 sm:px-6 pb-20 sm:pb-32">
            {/* Badge */}
            <div className="mb-6 rounded-full border border-[#333] bg-[#161616] px-3 py-1 text-[10px] font-medium text-[#A1A1A1]">
                Updated weekly
            </div>

            {/* Main Heading */}
            <h1 className="max-w-[700px] text-[32px] sm:text-[44px] md:text-[48px] font-medium tracking-tight leading-[1.1] mb-10 text-center text-[#EAEAEA]">
                Evidence-backed UX<br className="hidden sm:block" /> benchmarking for apps & sites
            </h1>

            {/* Subscribe Input */}
            <div className="flex w-full max-w-[420px] items-center bg-[#1A1A1A] rounded-full p-1 border border-[#2A2A2A] mb-4">
                <input
                    type="email"
                    placeholder="hi@example.com"
                    className="flex-1 bg-transparent px-4 text-[12px] outline-none placeholder:text-[#666666] text-[#EAEAEA] h-8"
                />
                <Button type="submit" className="rounded-full px-5 bg-[#2A2A2A] hover:bg-[#333333] text-[#A1A1A1] hover:text-white text-[12px] font-medium h-8 transition-colors">
                    Subscribe
                </Button>
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-[#666666] font-medium">
                Stay ahead with weekly UX benchmark updates.
            </p>

            {/* Spacer to replace mt-[100px] */}
            <div className="h-[50px] sm:h-[100px] w-full"></div>

            {/* Categories Bar */}
            <div className="sticky top-[73px] z-40 w-full bg-black pl-4 sm:pl-[30px] py-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center text-[14px] font-normal whitespace-nowrap">
                    {categories.map((category: any) => {
                        const displayName = category.name || category.title;
                        return (
                            <button
                                key={category.slug}
                                onClick={() => setActiveCategorySlug(category.slug)}
                                className={`transition-colors ${activeCategorySlug === category.slug
                                        ? "text-white bg-[#1A1A1A] px-3 py-2 rounded-full"
                                        : "text-[#A1A1A1] hover:text-white px-3 py-2 rounded-full"
                                    }`}
                            >
                                {displayName}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grid of Boxes */}
            <div className="w-full mt-4 sm:mt-[30px] px-4 sm:pl-[30px] sm:pr-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8 w-full">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-4">
                                <Skeleton className="rounded-[20px] aspect-[4/4.7] w-full" />
                                <div className="flex items-center gap-3 px-1">
                                    <Skeleton className="w-10 h-10 rounded-lg" />
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-20">Error loading apps. Make sure the backend is running.</div>
                ) : apps?.length === 0 ? (
                    <div className="text-center text-[#A1A1A1] py-20">No apps found.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8 w-full">
                        {apps?.map((app) => (
                            <div key={app.id} className="flex flex-col gap-4">
                                <div 
                                    className="bg-[#161616] hover:bg-[#0E0E0E] transition-colors duration-300 rounded-[20px] border border-[#222222] aspect-[4/4.7] w-full relative overflow-hidden group cursor-pointer"
                                    onClick={() => navigate(`/app/${app.slug}`)}
                                >
                                    {app.isStaffPick && (
                                        <div className="absolute top-[16px] left-[20px] flex items-center gap-2 z-10">
                                            <Sparkles className="w-4 h-4 text-[#FF5500] fill-[#FF5500]" />
                                            <span className="text-white text-[14px] font-medium tracking-wide">Staff picks</span>
                                        </div>
                                    )}
                                    
                                    {/* Hover Arrow Button */}
                                    <div className="absolute top-[16px] right-[16px] w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                        <ArrowUpRight className="w-4 h-4 text-[#A1A1A1]" />
                                    </div>

                                    <div className="absolute bottom-0 left-[80px] right-[80px] top-[46px] group-hover:left-[70px] group-hover:right-[70px] group-hover:top-[41px] transition-all duration-300 rounded-t-[16px] overflow-hidden">
                                        <OptimizedImage 
                                            src={app.appThumbnail || revolutImg} 
                                            alt={app.name} 
                                            optimizationWidth={600}
                                            containerClassName="w-full h-full"
                                            className="w-full h-full object-cover object-top" 
                                        />
                                        {/* Inside Black Fade */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#161616] to-transparent z-10 pointer-events-none"></div>
                                        {/* Framer Blur Gradient Component */}
                                        <div className="absolute bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] z-20 pointer-events-none"></div>
                                    </div>
                                </div>
                                {/* App Details Below Box */}
                                <div className="flex items-center gap-3 px-1">
                                    <OptimizedImage 
                                        src={app.appLogo || revolutLogo} 
                                        alt={`${app.name} Logo`} 
                                        optimizationWidth={100}
                                        containerClassName="w-10 h-10 rounded-lg shrink-0"
                                        className="w-10 h-10 rounded-lg object-contain bg-white" 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[#EAEAEA] text-[15px] font-medium">{app.name}</span>
                                        <span className="text-[#888888] text-[13px]">{app.tags?.[0] || "Category"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Global Framer Blur Gradient */}
            <div className="fixed bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none z-40"></div>

            {/* Floating Action Pill */}
            <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center p-1.5 rounded-full border border-[#333333] bg-[#1A1A1A] shadow-2xl shadow-black/50">
                    <SubmitModule>
                        <Button variant="ghost" className="rounded-full text-[#A1A1A1] hover:text-white hover:bg-[#2A2A2A] h-9 px-4 font-normal text-[14px]">
                            <Plus className="mr-2 h-4 w-4" />
                            Submit
                        </Button>
                    </SubmitModule>
                    <Button className="rounded-full bg-white text-black hover:bg-gray-200 h-9 px-5 font-medium text-[14px]">
                        <ArrowUpRight className="mr-1.5 h-4 w-4" />
                        Get My Report
                    </Button>
                </div>
            </div>
        </main>
    );
}
