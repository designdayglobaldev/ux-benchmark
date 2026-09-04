import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, ListFilter, Check } from "lucide-react";
import revolutImg from "@/assets/Revolut.png";
import revolutLogo from "@/assets/Revolut_logo.png";
import canvasImg from "@/assets/Canvas.png";
// @ts-ignore
import { SubmitModule } from "../components/Submit_module";
import { useApps } from "@/hooks/useApps";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from 'react-router-dom'
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function Dashboard() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    // Filter States
    const [activeTab, setActiveTab] = useState<string>('latest');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Build query string
    const queryParts = [];
    if (activeCategory !== 'all') {
        const cat = categories.find(c => c.id === activeCategory);
        if (cat) queryParts.push(`category=${cat.slug}`);
    }
    if (activeSubcategory !== 'all') {
        const subcat = subcategories.find(sc => sc.id === activeSubcategory);
        if (subcat) queryParts.push(`subcategory=${subcat.slug}`);
    }
    if (activeTab === 'motion') queryParts.push('tag=motion');
    else if (activeTab === 'bonus') queryParts.push('tag=bonus');
    const queryString = queryParts.join('&');

    const { data: apps, isLoading, error } = useApps(queryString);

    useSEO({
        title: "Home",
        description: "BenchmarX - Explore UX analyses of top applications."
    });

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                const [catRes, subcatRes] = await Promise.all([
                    fetch(`${apiUrl}/api/v1/categories`),
                    fetch(`${apiUrl}/api/v1/subcategories`)
                ]);
                setCategories(await catRes.json());
                setSubcategories(await subcatRes.json());
            } catch (e) {
                console.error("Failed to fetch filters", e);
            }
        };
        fetchFilters();
    }, []);

    return (
        <main className="flex-1 w-full bg-black flex flex-col items-center pb-20 sm:pb-32">
            {/* Hero Section */}
            <div 
                className="w-full flex flex-col items-center pt-6 sm:pt-8 px-4 sm:px-6 relative"
                style={{
                    backgroundImage: `url(${canvasImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Dark overlay to ensure text remains readable */}
                <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center w-full">
                    {/* Badge */}
                    <div className="mb-6 rounded-full border border-[#333] bg-[#161616] px-3 py-1 text-[10px] font-medium text-[#A1A1A1]">
                        Updated weekly
                    </div>

                    {/* Main Heading */}
                    <h1 className="max-w-[700px] text-[32px] sm:text-[44px] md:text-[48px] font-medium tracking-tight leading-[1.1] text-center text-[#EAEAEA]">
                        Evidence-backed UX<br className="hidden sm:block" /> benchmarking for apps & sites
                    </h1>

                    {/* Spacer to replace mt-[100px] */}
                    <div className="h-8 sm:h-12 w-full"></div>
                </div>
            </div>



            {/* Filter Bar */}
            <div className="sticky top-[73px] z-40 w-full bg-black px-4 sm:px-[30px] pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {/* Sort Tabs */}
                    <div className="flex items-center gap-6 text-base font-medium">
                        {['latest', 'motion', 'bonus'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn("transition-colors capitalize pb-1 border-b-2", activeTab === tab ? "text-[#EAEAEA] border-[#EAEAEA]" : "text-[#A1A1A1] border-transparent hover:text-[#EAEAEA]")}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Dropdown */}
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 text-[#EAEAEA] hover:opacity-80 transition-opacity text-base font-medium ml-auto sm:ml-0">
                            <ListFilter className="w-5 h-5" />
                            Category {(activeCategory !== 'all' || activeSubcategory !== 'all') && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 bg-[#1A1A1A] border-[#333] text-[#EAEAEA]" align="end">
                        <Command className="bg-transparent">
                            <CommandInput placeholder="Search categories..." className="text-[#EAEAEA]" />
                            <CommandList>
                                <CommandEmpty>No category found.</CommandEmpty>
                                <CommandGroup heading="Categories">
                                    <CommandItem
                                        value="all-categories"
                                        onSelect={() => {
                                            setActiveCategory('all');
                                            setActiveSubcategory('all');
                                            setIsFilterOpen(false);
                                        }}
                                        className="text-[#EAEAEA] aria-selected:bg-[#333]"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", activeCategory === 'all' ? "opacity-100" : "opacity-0")} />
                                        All Categories
                                    </CommandItem>
                                    {categories.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.title}
                                            onSelect={() => {
                                                setActiveCategory(c.id);
                                                setActiveSubcategory('all'); // Reset sub on cat change
                                                setIsFilterOpen(false);
                                            }}
                                            className="text-[#EAEAEA] aria-selected:bg-[#333] flex items-center justify-between"
                                        >
                                            <div className="flex items-center">
                                                <Check className={cn("mr-2 h-4 w-4", activeCategory === c.id ? "opacity-100" : "opacity-0")} />
                                                {c.title}
                                            </div>
                                            {c._count?.apps === 0 && (
                                                <span className="ml-2 text-[10px] font-medium bg-[#333] text-[#A1A1A1] px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    Coming soon
                                                </span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                
                                {activeCategory !== 'all' && subcategories.filter(sc => sc.categoryId === activeCategory).length > 0 && (
                                    <CommandGroup heading="Subcategories">
                                        <CommandItem
                                            value="all-subcategories"
                                            onSelect={() => {
                                                setActiveSubcategory('all');
                                                setIsFilterOpen(false);
                                            }}
                                            className="text-[#EAEAEA] aria-selected:bg-[#333]"
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", activeSubcategory === 'all' ? "opacity-100" : "opacity-0")} />
                                            All Subcategories
                                        </CommandItem>
                                        {subcategories.filter(sc => sc.categoryId === activeCategory).map((sc) => (
                                            <CommandItem
                                                key={sc.id}
                                                value={sc.title}
                                                onSelect={() => {
                                                    setActiveSubcategory(sc.id);
                                                    setIsFilterOpen(false);
                                                }}
                                                className="text-[#EAEAEA] aria-selected:bg-[#333]"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", activeSubcategory === sc.id ? "opacity-100" : "opacity-0")} />
                                                {sc.title}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
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
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                        <img src="/code-learner.svg" alt="Updating library" className="w-48 h-48 mb-6" />
                        <h3 className="text-[#EAEAEA] text-[18px] font-medium mb-2">We're expanding our library!</h3>
                        <p className="text-[#A1A1A1] text-[14px]">Can't find what you're looking for? Request an app.</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8 w-full">
                            {(user || isLoading ? apps : apps?.slice(0, 8))?.map((app, index) => {
                                const isBlurred = !user && !isLoading && index >= 4;
                                return (
                                <div key={app.id} className={`flex flex-col gap-4 ${isBlurred ? 'pointer-events-none select-none' : ''}`}>
                                    <div 
                                        className="bg-[#161616] hover:bg-[#0E0E0E] transition-colors duration-300 rounded-[20px] border border-[#222222] aspect-[4/4.7] w-full relative overflow-hidden group cursor-pointer"
                                        onClick={() => !isBlurred && navigate(`/app/${app.slug}`)}
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
                                        <span className="text-[#888888] text-[13px]">{app.subcategory?.title || app.category?.title || app.tags?.[0] || "Category"}</span>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                        
                        {/* Overlay for Unauthenticated Users */}
                        {!user && !isAuthLoading && apps && apps.length > 4 && (
                            <div className="absolute top-[20%] left-0 right-0 bottom-[-120px] z-30 flex flex-col items-center justify-end pb-[160px] sm:pb-[180px]">
                                {/* Progressive Blur & Gradient Background */}
                                <div 
                                    className="absolute inset-0 backdrop-blur-[12px] bg-gradient-to-b from-transparent via-[#060606]/60 to-[#060606]"
                                    style={{ 
                                        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 80%)',
                                        maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, black 80%)' 
                                    }}
                                ></div>
                                
                                {/* Content */}
                                <div className="relative z-10 flex flex-col items-center">
                                    <h2 className="text-[24px] font-semibold text-white mb-2 tracking-[-0.06em]">Unlock the full BenchmarX library</h2>
                                    <p className="text-[#CFCFCF] text-[16px] font-normal mb-6 text-center tracking-[-0.06em]">Log in to unlock the full library of real screens and UX reasoning.</p>
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
                        <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
                    </div>
                )}
            </div>

            {/* Global Framer Blur Gradient */}
            <div className="fixed bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none z-40"></div>

            {/* Floating Action Pill */}
            <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-50">
                <SubmitModule>
                    <Button className="rounded-full bg-white text-black hover:bg-gray-200 h-12 px-6 font-medium text-base shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-[#333]">
                        <ArrowUpRight className="mr-2 h-5 w-5" />
                        Request App
                    </Button>
                </SubmitModule>
            </div>
        </main>
    );
}
