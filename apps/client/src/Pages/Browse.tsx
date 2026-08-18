import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApps } from "@/hooks/useApps";
import { Sparkles, ArrowUpRight, ChevronDown, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import revolutImg from "@/assets/Revolut.png";
import revolutLogo from "@/assets/Revolut_logo.png";

const FilterDropdown = ({ title, options, selectedSlugs, onChange, singleSelect = false }: { title: string, options: any[], selectedSlugs: string[], onChange: (slugs: string[]) => void, singleSelect?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (slug: string) => {
    if (singleSelect) {
      if (selectedSlugs.includes(slug)) {
        onChange([]);
      } else {
        onChange([slug]);
      }
      setIsOpen(false);
      return;
    }

    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter(s => s !== slug));
    } else {
      onChange([...selectedSlugs, slug]);
    }
  };

  const hasSelection = selectedSlugs.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] transition-colors ${
            hasSelection || isOpen 
              ? "border-white bg-white text-black font-medium" 
              : "border-[#333333] bg-transparent text-[#EAEAEA] hover:border-[#555555]"
          }`}
        >
          {title} {hasSelection && !singleSelect && <span className="ml-1 bg-black text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{selectedSlugs.length}</span>}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 border-[#333333] bg-[#1A1A1A] text-white" align="start">
        <Command className="bg-[#1A1A1A]">
          <CommandInput placeholder={`Search ${title}...`} className="text-[#EAEAEA]" />
          <CommandList className="max-h-[300px] overflow-y-auto no-scrollbar">
            <CommandEmpty className="py-6 text-center text-sm text-[#888888]">No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSlugs.includes(option.slug);
                return (
                  <CommandItem
                    key={option.slug}
                    value={option.name || option.title}
                    onSelect={() => toggleOption(option.slug)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[#2A2A2A] cursor-pointer text-[#EAEAEA] aria-selected:bg-[#2A2A2A] aria-selected:text-white"
                  >
                    <span>{option.name || option.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  
  const { data: apps, isLoading, error } = useApps(queryString);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [uiElements, setUiElements] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const [catRes, flowsRes, uiRes, patRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/categories`),
          fetch(`${apiUrl}/api/v1/flows`),
          fetch(`${apiUrl}/api/v1/ui-elements`),
          fetch(`${apiUrl}/api/v1/patterns`)
        ]);
        setCategories(await catRes.json());
        setFlows(await flowsRes.json());
        setUiElements(await uiRes.json());
        setPatterns(await patRes.json());
      } catch (e) {
        console.error("Failed to fetch filters", e);
      }
    };
    fetchFilters();
  }, []);

  const updateParams = (key: string, values: string[]) => {
    if (values.length === 0) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, values.join(','));
    }
    setSearchParams(searchParams);
  };

  const getArrayParam = (key: string) => {
    const val = searchParams.get(key);
    return val ? val.split(',') : [];
  };

  return (
    <main className="flex-1 w-full bg-black flex flex-col pt-8 px-4 sm:px-6 pb-20">
      <div className="flex flex-col gap-8 w-full">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-[32px] font-medium tracking-tight text-[#EAEAEA]">Browse</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 relative z-40">
          <FilterDropdown 
            title="Platform" 
            options={[{ slug: 'ios', name: 'iOS' }, { slug: 'web', name: 'Web' }]} 
            selectedSlugs={getArrayParam('platform')} 
            onChange={(slugs) => updateParams('platform', slugs)}
          />
          <FilterDropdown 
            title="Categories" 
            options={categories} 
            selectedSlugs={getArrayParam('category')} 
            onChange={(slugs) => updateParams('category', slugs)}
          />
          <FilterDropdown 
            title="Flows" 
            options={flows} 
            selectedSlugs={getArrayParam('flows')} 
            onChange={(slugs) => updateParams('flows', slugs)}
          />
          <FilterDropdown 
            title="UI Elements" 
            options={uiElements} 
            selectedSlugs={getArrayParam('uiElements')} 
            onChange={(slugs) => updateParams('uiElements', slugs)}
          />
          <FilterDropdown 
            title="UX Patterns" 
            options={patterns} 
            selectedSlugs={getArrayParam('patterns')} 
            onChange={(slugs) => updateParams('patterns', slugs)}
          />
          
          {(queryString.length > 0) && (
            <button 
              onClick={() => setSearchParams({})}
              className="text-[#888888] hover:text-white text-[13px] underline ml-2"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="h-px w-full bg-[#222222]"></div>

        {/* Grid */}
        <div className="w-full mt-4">
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
              <div className="text-center text-[#A1A1A1] py-20">No results found for the selected filters.</div>
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
                                <div className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-[#161616] to-transparent z-10 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-[40px] backdrop-blur-[24px] [mask-image:linear-gradient(to_bottom,transparent,black)] z-20 pointer-events-none"></div>
                            </div>
                        </div>
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
      </div>
    </main>
  );
}
