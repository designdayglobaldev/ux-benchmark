import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUpgradeModal } from "@/contexts/UpgradeContext";
import { useSEO } from "@/hooks/useSEO";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ChevronRight, ChevronDown, ChevronLeft, Lock, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScreenActionOverlay } from "@/components/ScreenActionOverlay";

interface Screen {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  screenNo?: number;
  appId: string;
  app?: {
    id?: string;
    name: string;
    slug: string;
    appLogo?: string;
    category?: {
      title: string;
      slug: string;
    };
  };
}

interface FlowData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  screens: Screen[];
}

interface AppGroup {
  id: string;
  name: string;
  slug: string;
  appLogo?: string;
  categoryName: string;
  categorySlug?: string;
  screens: Screen[];
}

export function FlowDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();

  const [allFlows, setAllFlows] = useState<FlowData[]>([]);
  const [currentFlow, setCurrentFlow] = useState<FlowData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all flows for the dropdown and current flow resolution
  useEffect(() => {
    let isMounted = true;
    window.scrollTo(0, 0);
    setSelectedCategory(null);

    const fetchFlowData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/api/v1/flows`);
        if (!res.ok) throw new Error("Failed to fetch flows");
        const rawFlows: FlowData[] = await res.json();
        
        if (!isMounted) return;

        // Filter flows with at least one screen
        const validFlows = rawFlows.filter(
          (flow) => flow.screens && flow.screens.length > 0
        );
        setAllFlows(validFlows);

        // Find the matched flow by slug or id (case-insensitive)
        const currentSlugLower = (slug || "").toLowerCase();
        const matched = validFlows.find(
          (f) =>
            (f.slug && f.slug.toLowerCase() === currentSlugLower) ||
            f.id === slug
        );

        if (matched) {
          setCurrentFlow(matched);
        } else if (slug) {
          // Fallback direct fetch by id or slug
          const directRes = await fetch(`${apiUrl}/api/v1/flows/${slug}`);
          if (directRes.ok) {
            const single = await directRes.json();
            if (isMounted) setCurrentFlow(single);
          } else {
            if (isMounted) setError(true);
          }
        } else if (validFlows.length > 0) {
          setCurrentFlow(validFlows[0]);
        } else {
          if (isMounted) setError(true);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFlowData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  useSEO({
    title: currentFlow ? `${currentFlow.name} Flow` : "Flow Details",
    description:
      currentFlow?.description ||
      "Explore how top apps build this flow step-by-step.",
  });

  // Determine if this is the ONE flow available for logged-out users
  // (the very first valid flow in allFlows is the free flow for logged-out users)
  const isFreeFlow = Boolean(
    allFlows.length > 0 &&
      currentFlow &&
      (allFlows[0].id === currentFlow.id || allFlows[0].slug === currentFlow.slug)
  );

  // Group screens by app
  const appGroups: AppGroup[] = [];
  if (currentFlow?.screens) {
    const appMap = new Map<string, AppGroup>();

    currentFlow.screens.forEach((screen) => {
      if (!screen.app) return;
      const appKey = screen.app.slug || screen.appId;

      if (!appMap.has(appKey)) {
        appMap.set(appKey, {
          id: screen.app.id || screen.appId,
          name: screen.app.name,
          slug: screen.app.slug,
          appLogo: screen.app.appLogo,
          categoryName: screen.app.category?.title || "General",
          categorySlug: screen.app.category?.slug,
          screens: [],
        });
      }

      appMap.get(appKey)!.screens.push(screen);
    });

    appGroups.push(...Array.from(appMap.values()));

    // Sort screens within each app by screenNo
    appGroups.forEach((group) => {
      group.screens.sort((a, b) => (a.screenNo || 0) - (b.screenNo || 0));
    });
  }

  // Set of the first 4 app slugs in the free flow
  const freeAppSlugs = new Set(appGroups.slice(0, 4).map((g) => g.slug));

  // Extract unique categories for dropdown filter
  const categories = Array.from(
    new Set(
      appGroups
        .map((g) => g.categoryName)
        .filter(Boolean)
    )
  );

  // Filter apps by category if selected
  const filteredApps = selectedCategory
    ? appGroups.filter(
        (g) => g.categoryName.toLowerCase() === selectedCategory.toLowerCase()
      )
    : appGroups;

  const totalScreensCount = filteredApps.reduce(
    (acc, group) => acc + group.screens.length,
    0
  );

  if (isLoading) {
    return (
      <main className="flex-1 w-full bg-black flex flex-col items-center pb-24 sm:pb-32 min-h-screen text-white">
        <div className="w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 pt-6 sm:pt-10">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-12 bg-[#1C1C1C] rounded" />
            <span className="text-[#444] text-xs">/</span>
            <Skeleton className="h-4 w-28 bg-[#1C1C1C] rounded" />
          </div>

          {/* Header Title Skeleton */}
          <div className="flex flex-col gap-3 mb-8">
            <Skeleton className="h-10 w-64 sm:w-80 bg-[#1C1C1C] rounded-lg" />
            <Skeleton className="h-4 w-full max-w-xl bg-[#161616] rounded" />
          </div>

          {/* Meta Bar Skeleton */}
          <div className="flex items-center justify-between pb-6 border-b border-[#222222] mb-10">
            <Skeleton className="h-4 w-32 bg-[#161616] rounded" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24 rounded-full bg-[#161616]" />
              <Skeleton className="h-8 w-32 rounded-full bg-[#161616]" />
            </div>
          </div>

          {/* Flow Rows Skeleton */}
          <div className="flex flex-col gap-12 sm:gap-14">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A]" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-28 bg-[#1C1C1C] rounded" />
                      <Skeleton className="h-3 w-36 bg-[#161616] rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full bg-[#161616] border border-[#222]" />
                </div>
                <div className="flex items-center gap-4 sm:gap-5 overflow-hidden py-1 px-1">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton
                      key={j}
                      className="shrink-0 w-[170px] sm:w-[190px] md:w-[210px] aspect-[9/19.5] rounded-[18px] bg-[#141414] border border-[#222222]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !currentFlow) {
    return (
      <main className="flex-1 w-full bg-black flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h2 className="text-2xl font-semibold mb-2">Flow not found</h2>
        <p className="text-[#888888] mb-6">The requested flow could not be loaded.</p>
        <Button
          onClick={() => navigate("/flows")}
          variant="outline"
          className="rounded-full border-[#333] text-white"
        >
          Back to Flows
        </Button>
      </main>
    );
  }

  // Access check:
  // Logged-in user: Everything is unlocked!
  // Logged-out user:
  // - If isFreeFlow: only the first 4 apps are unlocked. 5th+ app is locked.
  // - If !isFreeFlow: entire flow is locked.
  const isEntireFlowLocked = !user && !isAuthLoading && !isFreeFlow;

  // Separate apps into unlocked vs locked for rendering the free flow banner properly
  const unlockedApps = filteredApps.filter((appGroup) => {
    if (user || isAuthLoading) return true;
    if (isEntireFlowLocked) return false;
    return freeAppSlugs.has(appGroup.slug);
  });

  const lockedApps = filteredApps.filter((appGroup) => {
    if (user || isAuthLoading) return false;
    if (isEntireFlowLocked) return true;
    return !freeAppSlugs.has(appGroup.slug);
  });

  return (
    <main className="flex-1 w-full bg-black flex flex-col items-center pb-24 sm:pb-32 min-h-screen text-white">
      <div className="w-full max-w-[1440px] px-4 sm:px-8 xl:px-12 pt-6 sm:pt-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-[#888888] mb-6">
          <Link to="/flows" className="hover:text-white transition-colors">
            Flows
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
          <span className="text-[#DDDDDD] font-medium">{currentFlow.name}</span>
        </nav>

        {/* Header Title & Subtitle */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[32px] sm:text-[42px] font-semibold tracking-[-0.03em] text-white">
            {currentFlow.name}
          </h1>
          <p className="text-[#888888] text-[14px] sm:text-[15px] font-normal max-w-2xl">
            {currentFlow.description ||
              `How apps build ${currentFlow.name.toLowerCase()} screen, each app staged in its real order, screen by screen.`}
          </p>
        </div>

        {/* Meta Bar: Counts & Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222] mb-10">
          <div className="text-[14px] text-[#8E8E8E] font-medium">
            {filteredApps.length} Apps · {totalScreensCount} Screens
          </div>

          <div className="flex items-center gap-3">
            {/* Categories Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2A2A2A] bg-[#141414] hover:bg-[#1F1F1F] hover:border-[#444] text-[13px] text-white transition-colors">
                  <span>{selectedCategory ? selectedCategory : "Categories"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#888]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 border-[#2A2A2A] bg-[#141414] text-white" align="end">
                <Command className="bg-[#141414]">
                  <CommandInput placeholder="Search category..." className="text-[#EAEAEA]" />
                  <CommandList className="max-h-[240px] overflow-y-auto no-scrollbar">
                    <CommandEmpty className="py-4 text-center text-xs text-[#888]">
                      No category found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setSelectedCategory(null)}
                        className="flex items-center justify-between px-3 py-2 cursor-pointer text-[#EAEAEA] hover:bg-[#222]"
                      >
                        <span>All Categories</span>
                        {!selectedCategory && <Check className="w-3.5 h-3.5 text-white" />}
                      </CommandItem>
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat}
                          onSelect={() =>
                            setSelectedCategory(cat === selectedCategory ? null : cat)
                          }
                          className="flex items-center justify-between px-3 py-2 cursor-pointer text-[#EAEAEA] hover:bg-[#222]"
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-white" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Flows Switcher Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2A2A2A] bg-[#141414] hover:bg-[#1F1F1F] hover:border-[#444] text-[13px] text-white transition-colors">
                  <span>{currentFlow.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#888]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 border-[#2A2A2A] bg-[#141414] text-white" align="end">
                <Command className="bg-[#141414]">
                  <CommandInput placeholder="Search flow..." className="text-[#EAEAEA]" />
                  <CommandList className="max-h-[260px] overflow-y-auto no-scrollbar">
                    <CommandEmpty className="py-4 text-center text-xs text-[#888]">
                      No flow found.
                    </CommandEmpty>
                    <CommandGroup>
                      {allFlows.map((flow) => (
                        <CommandItem
                          key={flow.id}
                          onSelect={() => {
                            navigate(`/flows/${flow.slug || flow.id}`);
                          }}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer text-[#EAEAEA] hover:bg-[#222]"
                        >
                          <span>{flow.name}</span>
                          {flow.id === currentFlow.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Apps List */}
        {filteredApps.length === 0 ? (
          <div className="text-center text-[#888888] py-20">
            No apps found for this flow.
          </div>
        ) : (
          <div className="flex flex-col gap-12 sm:gap-14">
            {/* Unlocked Apps Section */}
            {unlockedApps.map((appGroup) => (
              <AppFlowRow
                key={appGroup.id}
                appGroup={appGroup}
                isLocked={false}
                onUnlock={() => openUpgradeModal()}
              />
            ))}

            {/* Locked Apps Section (with Paywall Banner Overlay when in free flow) */}
            {lockedApps.length > 0 && (
              <div className="relative flex flex-col gap-12 sm:gap-14 isolate">
                {lockedApps.map((appGroup) => (
                  <AppFlowRow
                    key={appGroup.id}
                    appGroup={appGroup}
                    isLocked={true}
                    onUnlock={() => openUpgradeModal()}
                  />
                ))}

                {/* Paywall Overlay Banner (shown over locked apps in free flow) */}
                {isFreeFlow && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/75 rounded-2xl pointer-events-auto">
                    <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                      <h2 className="text-[26px] sm:text-[28px] font-semibold text-white mb-2 tracking-tight">
                        Unlock all flows
                      </h2>
                      <p className="text-[#CFCFCF] text-[15px] mb-6">
                        Log in to unlock the full flows of top performing products worldwide
                      </p>
                      <Button
                        onClick={() => openUpgradeModal()}
                        className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 h-10 font-semibold text-[14px] transition-transform active:scale-95 shadow-2xl"
                      >
                        Join PRO
                      </Button>
                      <div className="flex items-center gap-2.5 mt-5">
                        <div className="flex -space-x-1.5">
                          {[
                            "https://i.pravatar.cc/100?img=68",
                            "https://i.pravatar.cc/100?img=47",
                            "https://i.pravatar.cc/100?img=44",
                            "https://i.pravatar.cc/100?img=33",
                          ].map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt="Designer avatar"
                              className="w-5 h-5 rounded-full border border-[#111] object-cover"
                            />
                          ))}
                        </div>
                        <span className="text-[13px] text-[#A1A1A1]">
                          Supporting over 1M designers worldwide
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// App Row Component with Horizontal Scroll & Locked State
function AppFlowRow({
  appGroup,
  isLocked,
  onUnlock,
}: {
  appGroup: AppGroup;
  isLocked: boolean;
  onUnlock: () => void;
}) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    // Re-check after images load
    const timer = setTimeout(checkScroll, 300);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [appGroup.screens]);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* App Header */}
      <div className="flex items-center justify-between">
        <div 
          onClick={() => {
            if (isLocked) {
              onUnlock();
            } else {
              navigate(`/app/${appGroup.slug}`);
            }
          }}
          className="flex items-center gap-3 cursor-pointer group/app"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] group-hover/app:border-[#444] overflow-hidden flex items-center justify-center shrink-0 transition-all group-hover/app:scale-[1.02]">
            {appGroup.appLogo ? (
              <OptimizedImage
                src={appGroup.appLogo}
                alt={appGroup.name}
                optimizationWidth={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {appGroup.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-white text-[16px] font-semibold leading-tight tracking-tight group-hover/app:underline decoration-white/50 underline-offset-4 transition-all">
              {appGroup.name}
            </h3>
            <p className="text-[#888888] text-[13px] mt-0.5">
              {appGroup.categoryName} · {appGroup.screens.length} Screens
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isLocked) {
              onUnlock();
            } else {
              navigate(`/app/${appGroup.slug}/flows`);
            }
          }}
          className="rounded-full border border-[#2A2A2A] bg-transparent hover:bg-[#1A1A1A] hover:border-[#444] text-[12px] sm:text-[13px] font-medium text-white px-4 py-1.5 transition-colors cursor-pointer"
        >
          View All Flows
        </button>
      </div>

      {/* Horizontal Screens Carousel */}
      <div className="relative w-full group/carousel">
        {/* Scroll Left Button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy(-400)}
            aria-label="Scroll left"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#181818]/90 hover:bg-[#252525] border border-[#333] flex items-center justify-center text-white shadow-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 isolate [transform:translateZ(0)]"
        >
          {appGroup.screens.map((screen, idx) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              screenIndex={idx}
              appSlug={appGroup.slug}
              appName={appGroup.name}
              isLocked={isLocked}
              onUnlock={onUnlock}
            />
          ))}
        </div>

        {/* Scroll Right Button */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy(400)}
            aria-label="Scroll right"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#181818]/90 hover:bg-[#252525] border border-[#333] flex items-center justify-center text-white shadow-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Single Screen Card with Locked State & Hover Behavior
function ScreenCard({
  screen,
  screenIndex,
  appSlug,
  appName,
  isLocked,
  onUnlock,
}: {
  screen: Screen;
  screenIndex: number;
  appSlug: string;
  appName?: string;
  isLocked: boolean;
  onUnlock: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        if (isLocked) {
          onUnlock();
        } else {
          navigate(`/app/${appSlug}/screens/${encodeURIComponent(screen.slug || screen.id)}`);
        }
      }}
      className={`relative shrink-0 w-[170px] sm:w-[190px] md:w-[210px] aspect-[9/19.5] rounded-[18px] overflow-hidden border border-[#222222] bg-[#121212] select-none transition-transform duration-200 cursor-pointer group isolate [transform:translateZ(0)] ${
        isLocked ? "group/locked" : "hover:-translate-y-1 hover:border-[#383838]"
      }`}
    >
      {/* Screen Screenshot */}
      <OptimizedImage
        src={screen.imageUrl}
        alt={screen.name || `Screen ${screenIndex + 1}`}
        optimizationWidth={400}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLocked ? "filter blur-[12px] opacity-75 scale-105" : ""
        }`}
      />

      {/* Top-Right Hover Action Overlay (Bookmark/Collections & Copy) */}
      {!isLocked && (
        <ScreenActionOverlay 
          screenId={screen.id}
          imageUrl={screen.imageUrl}
          screenName={screen.name}
          appName={screen.app?.name || appName}
        />
      )}

      {/* Locked Overlay with hover reveal */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnlock();
            }}
            className="group/lockBtn relative z-20 flex items-center justify-center rounded-full bg-[#181818]/95 hover:bg-[#222222] border border-white/20 hover:border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_20px_rgba(168,85,247,0.2)] transition-all duration-300 h-11 w-11 hover:w-auto px-0 hover:px-4 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-white shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/lockBtn:max-w-[120px] group-hover/lockBtn:opacity-100 group-hover/lockBtn:ml-2 transition-all duration-300 text-[13px] font-medium text-white">
              Unlock screen
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
