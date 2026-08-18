import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, Scan, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const placeholders = [
  "Search for apps..",
  "Search for flows..",
  "Search for UX patterns..",
  "Search for UI elements.."
];

export function SearchModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState("Flows");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [uiElements, setUiElements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const isTyping = searchQuery !== debouncedQuery;
  const isLoading = isTyping || isSearching;

  const defaultRecentSearches = [
    { type: "app", title: "Revolut", iconChar: "R", bg: "bg-white", fg: "text-black" },
    { type: "app", title: "Superlist", iconChar: "", bg: "bg-red-500", fg: "text-white" },
    { type: "app", title: "Airbnb", iconChar: "A", bg: "bg-pink-500", fg: "text-white" }
  ];

  // Load recent searches and fetch flows on mount
  useEffect(() => {
    const saved = localStorage.getItem("ux_library_recent_searches");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Backward compatibility for old string searches
          setRecentSearches(parsed.map((item: any) => typeof item === 'string' ? { type: 'query', title: item } : item));
        } else {
          setRecentSearches(defaultRecentSearches);
        }
      } catch (e) {
        setRecentSearches(defaultRecentSearches);
      }
    } else {
      setRecentSearches(defaultRecentSearches);
    }

    const fetchFlows = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/flows`);
        const data = await res.json();
        if (Array.isArray(data)) setFlows(data);
      } catch (err) {
        console.error("Failed to fetch flows:", err);
      }
    };

    const fetchPatterns = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/patterns`);
        const data = await res.json();
        if (Array.isArray(data)) setPatterns(data);
      } catch (err) {
        console.error("Failed to fetch patterns:", err);
      }
    };

    const fetchUIElements = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/ui-elements`);
        const data = await res.json();
        if (Array.isArray(data)) setUiElements(data);
      } catch (err) {
        console.error("Failed to fetch UI elements:", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/categories`);
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    
    fetchFlows();
    fetchPatterns();
    fetchUIElements();
    fetchCategories();
  }, []);

  const saveRecentSearch = (item: any) => {
    const query = typeof item === 'string' ? item : item.title;
    if (!query || !query.trim()) return;
    
    const newItem = typeof item === 'string' ? { type: 'query', title: query.trim() } : item;
    const updated = [newItem, ...recentSearches.filter(s => s.title?.toLowerCase() !== query.trim().toLowerCase())].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem("ux_library_recent_searches", JSON.stringify(updated));
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (data.success && data.hits) {
          setSearchResults(data.hits);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search API error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentWord = placeholders[placeholderIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText(currentWord.substring(0, Math.max(0, displayText.length - 1)));
        if (displayText.length <= 1) {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }, 50);
    } else {
      timer = setTimeout(() => {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        if (displayText.length === currentWord.length) {
          timer = setTimeout(() => setIsDeleting(true), 2000);
        }
      }, 80);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, placeholderIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative w-full cursor-pointer" onClick={() => setOpen(true)}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A1A1A1]" />
          <div 
            className="flex items-center w-full h-[44px] bg-[#1A1A1A] rounded-[22px] pl-[42px] pr-[42px] text-[15px] text-[#888888] hover:bg-[#222222] transition-colors border border-transparent hover:border-[#333333]"
          >
            {displayText || " "}
          </div>
          <Scan className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A1A1A1] hover:text-white transition-colors" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] bg-[#161616] border-[#222222] text-white p-0 gap-0 rounded-[16px] overflow-hidden">
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-[#222222]">
          <Search className="h-[20px] w-[20px] text-[#888888] mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveRecentSearch(searchQuery);
              }
            }}
            placeholder={displayText}
            className="flex-1 bg-transparent text-[16px] text-white placeholder-[#888888] outline-none border-none"
            autoFocus
          />
        </div>

        {/* Content Area */}
        {searchQuery.length > 0 ? (
          <div className="flex flex-col h-[60vh] min-h-[400px] overflow-y-auto no-scrollbar p-3">
             <div className="flex flex-col gap-[2px]">
                 
                 {isLoading && (
                    <div className="flex justify-center items-center py-6 w-full text-[#888888]">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-[13px]">Searching...</span>
                    </div>
                 )}

                 {!isLoading && searchResults.length > 0 && (
                     <>
                         {/* Top Result */}
                         <div 
                             className="flex items-center gap-4 px-3 py-2 bg-[#2A2A2A] hover:bg-[#333333] rounded-[10px] cursor-pointer transition-colors mb-2"
                             onClick={() => {
                                 saveRecentSearch({ type: 'app', title: searchResults[0].title, iconChar: searchResults[0].iconChar, imageUrl: searchResults[0].imageUrl, bg: 'bg-[#10B981]', fg: 'text-black', slug: searchResults[0].slug });
                                 setOpen(false);
                                 navigate(`/app/${searchResults[0].slug}`);
                             }}
                         >
                             <div className="w-10 h-10 rounded-[8px] bg-[#10B981] flex items-center justify-center shrink-0 overflow-hidden">
                                 {searchResults[0].imageUrl ? (
                                     <img src={searchResults[0].imageUrl} alt={searchResults[0].title} className="w-full h-full object-cover" />
                                 ) : (
                                     <span className="text-black font-bold text-lg">{searchResults[0].iconChar || searchResults[0].title?.charAt(0) || '?'}</span>
                                 )}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-white text-[15px] font-semibold" dangerouslySetInnerHTML={{ __html: searchResults[0]._formatted?.title || searchResults[0].title }} />
                                 <span className="text-[#A1A1A1] text-[13px]">{searchResults[0].subtitle || searchResults[0].category || searchResults[0].type}</span>
                             </div>
                         </div>

                         {/* Category (Optional, based on top result) */}
                         {(searchResults[0].category || searchResults[0].subtitle) && (
                             <div 
                                 className="flex items-center gap-4 px-3 py-2 hover:bg-[#222222] rounded-[10px] cursor-pointer transition-colors"
                                 onClick={() => {
                                     const catName = searchResults[0].category || searchResults[0].subtitle;
                                     const catSlug = searchResults[0].categorySlug || catName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                                     setOpen(false);
                                     navigate(`/browse?category=${catSlug}`);
                                 }}
                             >
                                 <div className="w-10 h-10 rounded-[8px] bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0">
                                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-white text-[15px] font-semibold">{searchResults[0].category || searchResults[0].subtitle}</span>
                                     <span className="text-[#A1A1A1] text-[13px]">App Category</span>
                                 </div>
                             </div>
                         )}

                         {/* Search Action */}
                         <div 
                             className="flex items-center justify-between px-3 py-2 hover:bg-[#222222] rounded-[10px] cursor-pointer transition-colors"
                             onClick={() => {
                                 saveRecentSearch(searchQuery);
                                 setOpen(false);
                                 // Wait, there's no generic text search parameter configured in our Browse page 
                                 // (it only handles category, flows, patterns, uiElements). 
                                 // We will route back to /browse with all filters cleared just in case, or we could add a `?q=` param later.
                                 navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
                             }}
                         >
                             <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-[8px] bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0">
                                     <Search className="w-[18px] h-[18px] text-[#A1A1A1]" />
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="text-white text-[15px] font-semibold">Search</span>
                                 </div>
                             </div>
                             <span className="text-[#888888] tracking-widest leading-none mb-2">...</span>
                         </div>
                         
                         {/* Other Header */}
                         {searchResults.length > 1 && (
                             <>
                                 <div className="mt-4 mb-2 px-3">
                                     <span className="text-[#888888] text-[13px] font-medium">Other</span>
                                 </div>
                                 
                                 {/* Rest of the results */}
                                 {searchResults.slice(1).map((hit, idx) => (
                                     <div 
                                         key={hit.id || idx} 
                                         className="flex items-center gap-4 px-3 py-2 hover:bg-[#222222] rounded-[10px] cursor-pointer transition-colors"
                                         onClick={() => {
                                             saveRecentSearch({ type: 'app', title: hit.title, iconChar: hit.iconChar, imageUrl: hit.imageUrl, bg: 'bg-[#333333]', fg: 'text-white', slug: hit.slug });
                                             setOpen(false);
                                             navigate(`/app/${hit.slug}`);
                                         }}
                                     >
                                         <div className="w-10 h-10 rounded-[8px] bg-[#333333] border border-[#444444] flex items-center justify-center shrink-0 overflow-hidden">
                                             {hit.imageUrl ? (
                                                 <img src={hit.imageUrl} alt={hit.title} className="w-full h-full object-cover" />
                                             ) : (
                                                 <span className="text-white font-bold text-lg">{hit.iconChar || hit.title?.charAt(0) || '?'}</span>
                                             )}
                                         </div>
                                         <div className="flex flex-col">
                                             <span className="text-white text-[15px] font-semibold" dangerouslySetInnerHTML={{ __html: hit._formatted?.title || hit.title }} />
                                             <span className="text-[#A1A1A1] text-[13px]">{hit.subtitle || hit.category || hit.type}</span>
                                         </div>
                                     </div>
                                 ))}

                                 {/* Final Query Action */}
                                 <div 
                                     className="flex items-center gap-4 px-3 py-2 hover:bg-[#222222] rounded-[10px] cursor-pointer transition-colors mt-2"
                                     onClick={() => saveRecentSearch(searchQuery)}
                                 >
                                     <div className="w-10 h-10 rounded-[8px] bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0">
                                         <Search className="w-[18px] h-[18px] text-[#A1A1A1]" />
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-white text-[15px] font-semibold">"{searchQuery}"</span>
                                     </div>
                                 </div>
                             </>
                         )}
                     </>
                 )}

                 {!isLoading && searchResults.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-12 text-[#888888]">
                         <Search className="w-8 h-8 mb-4 opacity-50" />
                         <span className="text-[14px]">No results found for "{searchQuery}"</span>
                     </div>
                 )}
             </div>
          </div>
        ) : (
        <div className="flex h-[60vh] min-h-[400px]">
          {/* Left Column: Explore */}
          <div className="w-[220px] border-r border-[#222222] p-4 overflow-y-auto no-scrollbar">
            <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider pl-2">Explore</h3>
            <div className="flex flex-col gap-1">
              {['Flows', 'UX Patterns', 'UI Elements', 'Categories'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => setActiveTab(item)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] transition-colors text-left text-[14px] font-medium ${
                    activeTab === item 
                      ? 'bg-[#2A2A2A] text-white' 
                      : 'hover:bg-[#222222] text-[#A1A1A1] hover:text-white'
                  }`}
                >
                  {item}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeTab === item ? "#FFFFFF" : "#666666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Tags (Scrollable) */}
          <div className="flex-1 p-4 pl-8 overflow-y-auto no-scrollbar pb-10">
            {activeTab === "Flows" && (
              <>
                {recentSearches.length > 0 && (
                  <>
                    <h3 className="text-[#888888] text-[12px] font-medium mb-4 uppercase tracking-wider">Recent Searches</h3>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {recentSearches.map((search, idx) => (
                        <button 
                          key={search.title + idx} 
                          onClick={() => setSearchQuery(search.title)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222222] hover:bg-[#333333] border border-[#333333] text-[13px] text-white transition-colors"
                        >
                          {search.type === 'app' ? (
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${search.bg || 'bg-[#333333]'} ${search.fg || 'text-white'}`}>
                              {search.imageUrl ? (
                                <img src={search.imageUrl} alt={search.title} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                search.iconChar !== undefined ? search.iconChar : search.title.charAt(0)
                              )}
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-[#333333] border border-[#444444] rounded-full flex items-center justify-center text-[#888888] font-bold text-[10px]">
                              <Search className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {search.title}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-8">
                  {(() => {
                    const newUX = flows.filter(f => ['Browsing Tutorial', 'Creating Account', 'Onboarding', 'Pre-Onboarding', 'Post-Onboarding'].includes(f.name));
                    
                    const categorizedNames = [...newUX].map(f => f.name);
                    const otherFlows = flows.filter(f => !categorizedNames.includes(f.name));

                    return (
                      <>
                        {newUX.length > 0 && (
                          <div>
                            <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">New User Experience</h3>
                            <div className="flex flex-wrap gap-2">
                              {newUX.map((flow) => (
                                <button 
                                  key={flow.id} 
                                  onClick={() => { setOpen(false); navigate(`/browse?flows=${flow.slug}`); }}
                                  className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors"
                                >
                                  {flow.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {otherFlows.length > 0 && (
                          <div>
                            <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">Other Flows</h3>
                            <div className="flex flex-wrap gap-2">
                              {otherFlows.map((flow) => (
                                <button 
                                  key={flow.id} 
                                  onClick={() => { setOpen(false); navigate(`/browse?flows=${flow.slug}`); }}
                                  className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors"
                                >
                                  {flow.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}

            {activeTab === "UX Patterns" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">All UX Patterns</h3>
                  <div className="flex flex-wrap gap-2">
                    {patterns.map((pattern) => (
                      <button 
                        key={pattern.id} 
                        onClick={() => { setOpen(false); navigate(`/browse?patterns=${pattern.slug}`); }}
                        className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors"
                      >
                        {pattern.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "UI Elements" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">All UI Elements</h3>
                  <div className="flex flex-wrap gap-2">
                    {uiElements.map((element) => (
                      <button 
                        key={element.id} 
                        onClick={() => { setOpen(false); navigate(`/browse?uiElements=${element.slug}`); }}
                        className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors"
                      >
                        {element.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Categories" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">All Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button 
                        key={category.id} 
                        onClick={() => { setOpen(false); navigate(`/browse?category=${category.slug}`); }}
                        className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors"
                      >
                        {category.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
