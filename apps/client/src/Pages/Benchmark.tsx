import React, { useState, useRef, useEffect } from 'react';
import { Play, X, Upload, ChevronsUpDown, Check, ArrowRight, ArrowUp, Share2, Copy, Download, Maximize, Minimize, ChevronLeft, ChevronRight, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { ThinkingOrb } from 'thinking-orbs';
import floatIcon from '@/assets/floaticon.svg';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/optimized-image';
import api from '@/utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sandpack } from "@codesandbox/sandpack-react";

const getConfidencePill = (conf: string) => {
  if (!conf) return null;
  const isHigh = conf.toLowerCase().includes('high');
  const isMed = conf.toLowerCase().includes('medium');
  const isLow = conf.toLowerCase().includes('low');
  let bg = 'bg-[#333]';
  let text = 'text-[#ccc]';
  if (isHigh) { bg = 'bg-green-500/20'; text = 'text-green-400'; }
  else if (isMed) { bg = 'bg-yellow-500/20'; text = 'text-yellow-400'; }
  else if (isLow) { bg = 'bg-red-500/20'; text = 'text-red-400'; }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[13px] font-medium ${bg} ${text}`}>
      {conf}
    </span>
  );
};

// Reusable Combobox for Taxonomy
function TaxonomyCombobox({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: { id: string, title: string }[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string 
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between bg-[#141414] border-[#333] text-white hover:bg-[#222] hover:text-white"
        >
          <span className="truncate pr-2 text-left">
            {value
              ? options.find((opt) => opt.id === value)?.title
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 border-[#333] bg-[#141414] text-white">
        <Command className="bg-transparent text-white">
          <CommandInput placeholder={`Search...`} className="text-white border-b border-[#333]" />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.title}
                  onSelect={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className="text-white hover:bg-[#222] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.id ? "opacity-100 text-[#4E6BFF]" : "opacity-0"
                    )}
                  />
                  {opt.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function Benchmark() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => sessionStorage.getItem('benchmark_uploadedImage') || null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo States
  const [appState, setAppState] = useState<'idle' | 'analyzing' | 'detected' | 'results'>(() => sessionStorage.getItem('benchmark_appState') as any || 'idle');

  // Taxonomy Data States
  const [categories, setCategories] = useState<{id: string, title: string}[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [flows, setFlows] = useState<{id: string, title: string}[]>([]);

  // Selected Taxonomy
  const [selectedCategory, setSelectedCategory] = useState<string>(() => sessionStorage.getItem('benchmark_selectedCategory') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(() => sessionStorage.getItem('benchmark_selectedSubcategory') || '');
  const [selectedFlow, setSelectedFlow] = useState<string>(() => sessionStorage.getItem('benchmark_selectedFlow') || '');

  const [benchmarkData, setBenchmarkData] = useState<any>(() => {
    const val = sessionStorage.getItem('benchmark_benchmarkData');
    return val ? JSON.parse(val) : null;
  });
  const [benchmarkScreens, setBenchmarkScreens] = useState<any[]>(() => {
    const val = sessionStorage.getItem('benchmark_benchmarkScreens');
    return val ? JSON.parse(val) : [];
  });
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>(() => {
    const val = sessionStorage.getItem('benchmark_chatMessages');
    return val ? JSON.parse(val) : [{ role: 'assistant', content: 'Hi! I analyzed your screen. What questions do you have about the Benchmark report?' }];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Loading animation state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing screen structure...",
    "Extracting UX patterns...",
    "Almost done..."
  ];

  // Improved Design States
  const [improvedDesignCode, setImprovedDesignCode] = useState<string | null>(() => sessionStorage.getItem('benchmark_improvedDesignCode') || null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState<boolean>(false);
  const generationAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const generateImprovedDesign = async () => {
      if (appState === 'results' && benchmarkData && uploadedImage && !improvedDesignCode && !isGeneratingDesign) {
        if (generationAttemptedRef.current === uploadedImage) return;
        
        generationAttemptedRef.current = uploadedImage;
        setIsGeneratingDesign(true);
        try {
          const apiUrl = api.defaults.baseURL;
          const res = await fetch(`${apiUrl}/ai/improve-design`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: uploadedImage,
              benchmarkResult: benchmarkData,
            })
          });
          const data = await res.json();
          if (data.code) {
            setImprovedDesignCode(data.code);
            sessionStorage.setItem('benchmark_improvedDesignCode', data.code);
          }
        } catch (err) {
          console.error("Error generating improved design:", err);
        } finally {
          setIsGeneratingDesign(false);
        }
      }
    };
    generateImprovedDesign();
  }, [appState, benchmarkData, uploadedImage, improvedDesignCode, isGeneratingDesign]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (appState === 'analyzing') {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [appState]);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('benchmark_appState', appState);
    if (uploadedImage) sessionStorage.setItem('benchmark_uploadedImage', uploadedImage);
    else sessionStorage.removeItem('benchmark_uploadedImage');
    
    if (benchmarkData) sessionStorage.setItem('benchmark_benchmarkData', JSON.stringify(benchmarkData));
    else sessionStorage.removeItem('benchmark_benchmarkData');
    
    if (benchmarkScreens.length > 0) sessionStorage.setItem('benchmark_benchmarkScreens', JSON.stringify(benchmarkScreens));
    else sessionStorage.removeItem('benchmark_benchmarkScreens');

    if (chatMessages.length > 1) sessionStorage.setItem('benchmark_chatMessages', JSON.stringify(chatMessages));
    else sessionStorage.removeItem('benchmark_chatMessages');

    sessionStorage.setItem('benchmark_selectedCategory', selectedCategory);
    sessionStorage.setItem('benchmark_selectedSubcategory', selectedSubcategory);
    sessionStorage.setItem('benchmark_selectedFlow', selectedFlow);
  }, [appState, uploadedImage, benchmarkData, benchmarkScreens, chatMessages, selectedCategory, selectedSubcategory, selectedFlow]);

  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const apiUrl = api.defaults.baseURL;
      const response = await fetch(`${apiUrl}/export/docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ screens: benchmarkScreens, benchmarkData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'UX-Benchmark-Report.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch initial data
  const [isResultsFullscreen, setIsResultsFullscreen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = api.defaults.baseURL;
        const [catsRes, flowsRes, subcatsRes] = await Promise.all([
          fetch(`${apiUrl}/categories`),
          fetch(`${apiUrl}/flows`),
          fetch(`${apiUrl}/subcategories`)
        ]);
        
        const catsData = await catsRes.json();
        const flowsData = await flowsRes.json();
        const subcatsData = await subcatsRes.json();

        const catArray = Array.isArray(catsData) ? catsData : catsData.data || [];
        const flowArray = Array.isArray(flowsData) ? flowsData : flowsData.data || [];
        const subcatArray = Array.isArray(subcatsData) ? subcatsData : subcatsData.data || [];

        setCategories(catArray.map((c: any) => ({ id: c.id, title: c.title || c.name })));
        setFlows(flowArray.map((f: any) => ({ id: f.id, title: f.name || f.title })));
        setSubcategories(subcatArray);

      } catch (err) {
        console.error("Error fetching taxonomy data:", err);
      }
    };
    fetchData();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
        setAppState('detected'); // go straight to manual entry!
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBenchmarkClick = async () => {
    setAppState('analyzing');
    
    try {
      const apiUrl = api.defaults.baseURL;
      const response = await fetch(`${apiUrl}/ai/detect-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: uploadedImage })
      });
      const data = await response.json();
      
      if (data.categoryId) setSelectedCategory(data.categoryId);
      if (data.flowId) setSelectedFlow(data.flowId);
      
      setAppState('detected');
    } catch (error) {
      console.error('Failed to detect context:', error);
      // Fallback in case of error
      const defaultCat = categories[0]?.id;
      const defaultFlow = flows[0]?.id;
      if (defaultCat) setSelectedCategory(defaultCat);
      if (defaultFlow) setSelectedFlow(defaultFlow);
      setAppState('detected');
    }
  };

  const handleViewResults = async () => {
    setAppState('analyzing');
    try {
      const apiUrl = api.defaults.baseURL;
      const response = await fetch(`${apiUrl}/ai/benchmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: uploadedImage,
          categoryId: selectedCategory,
          subcategoryId: selectedSubcategory,
          flowId: selectedFlow,
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      
      if (data.report) {
        setBenchmarkData(data.report);
        // Fallback mock screens if DB is empty for UI testing
        let screens = data.benchmarkScreens || [];
        if (screens.length === 0) {
          screens = [
            { name: 'Revolut', imageUrl: uploadedImage! },
            { name: 'Monzo', imageUrl: uploadedImage! }
          ];
        }
        
        // Add staggered opacity for styling
        const opacities = ['opacity-70', 'opacity-60', 'opacity-50', 'opacity-40', 'opacity-30'];
        setBenchmarkScreens(screens.map((s: any, idx: number) => ({...s, opacity: opacities[idx % opacities.length]})));
        
        setAppState('results');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred during benchmarking.');
      setAppState('detected');
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatting) return;

    const newMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setIsChatting(true);
    setIsChatOpen(true);

    try {
      const response = await api.post('/ai/benchmark-chat', {
        message: newMessage.content,
        chatHistory: chatMessages,
        benchmarkData: benchmarkData
      });

      setChatMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (appState === 'results' && benchmarkData) {
    const allScreens = [
      { name: 'Your Design', imageUrl: uploadedImage! },
      ...benchmarkScreens
    ];

    return (
      <div className="flex flex-col flex-1 bg-[#121212] min-h-[calc(100vh-72px)] overflow-hidden">
        <div className="flex-1 w-full flex">
          
          <div 
            ref={resultsContainerRef}
            className={`w-full mx-auto bg-[#141414] transition-all duration-300 ${
            isResultsFullscreen 
              ? 'fixed inset-0 z-[200] max-w-none' 
              : 'max-w-[1600px] border-x border-[#2a2a2a]'
          }`}>
            <div className={`grid grid-cols-[340px_1fr] h-full min-h-screen ${isResultsFullscreen ? '' : ''}`}>
              
              {/* Left Sidebar (Sticky) */}
              <div className="bg-transparent p-8 flex flex-col items-center h-full max-h-screen overflow-y-auto sticky top-0 custom-scrollbar">
                <div className="w-[260px] relative mb-6 flex-1 flex flex-col justify-center">
                  
                  {/* Carousel Header */}
                  <div className="flex items-center justify-between mb-4 px-2">
                     <button 
                       onClick={() => setActiveScreenIndex(prev => Math.max(0, prev - 1))}
                       disabled={activeScreenIndex === 0}
                       className="p-1.5 text-[#666] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-full hover:bg-white/5 transition-colors"
                     >
                       <ChevronLeft size={16} />
                     </button>
                     <span className="text-[#888] text-[12px] font-medium tracking-wide truncate px-2 text-center flex-1 uppercase">
                       {allScreens[activeScreenIndex]?.name}
                     </span>
                     <button 
                       onClick={() => setActiveScreenIndex(prev => Math.min(allScreens.length - 1, prev + 1))}
                       disabled={activeScreenIndex === allScreens.length - 1}
                       className="p-1.5 text-[#666] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-full hover:bg-white/5 transition-colors"
                     >
                       <ChevronRight size={16} />
                     </button>
                  </div>
                  
                  {/* Image Container with Tight Dashed Border */}
                  <div className="w-full aspect-[230/500] rounded-[32px] border-[2px] border-dashed border-[#555] p-[6px] flex items-center justify-center">
                    <div className="w-full h-full rounded-[26px] overflow-hidden bg-black shadow-2xl relative">
                       <OptimizedImage 
                         src={allScreens[activeScreenIndex]?.imageUrl} 
                         alt={allScreens[activeScreenIndex]?.name} 
                         className="w-full h-full object-cover" 
                         optimizationWidth={400} 
                         priority={true} 
                       />
                    </div>
                  </div>
                </div>

                <div className="w-[260px] mt-4 mb-4">
                  <Button 
                    className="bg-white text-black hover:bg-gray-200 rounded-full px-6 h-12 text-[14px] font-semibold shadow-[0_8px_30px_rgba(255,255,255,0.1)] w-full transition-transform hover:scale-[1.02]"
                    onClick={() => {
                      setAppState('idle');
                      setUploadedImage(null);
                      setIsResultsFullscreen(false);
                      setActiveScreenIndex(0);
                    }}
                  >
                    Try another Screen
                  </Button>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex flex-col h-full max-h-screen overflow-hidden bg-transparent relative">
                
                <div className="flex-1 overflow-y-auto p-8 pb-32 custom-scrollbar">
                  
                  <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-[24px] p-10 max-w-[1000px] w-full">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 mb-8">
                      <h1 className="text-[20px] font-semibold text-white tracking-wide">Benchmark Results</h1>
                  <div className="flex items-center gap-5 text-[#888]">
                    <button 
                      onClick={() => setIsResultsFullscreen(!isResultsFullscreen)}
                      className="hover:text-white transition-colors" 
                      title={isResultsFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isResultsFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    <button className="hover:text-white transition-colors" title="Share"><Share2 size={18} /></button>
                    <button className="hover:text-white transition-colors" title="Copy"><Copy size={18} /></button>
                    <button 
                      className={`hover:text-white transition-colors ${isExporting ? 'opacity-50 animate-pulse' : ''}`} 
                      title="Download DOCX" 
                      onClick={handleExportDocx}
                      disabled={isExporting}
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                {/* Slider Section for Benchmark Screens */}
                {benchmarkScreens.length > 0 && (
                  <div className="w-full pb-8 mb-8 border-b border-[#2a2a2a] overflow-x-auto custom-scrollbar flex gap-6">
                    {benchmarkScreens.map((app, idx) => (
                      <div key={idx} className="flex flex-col gap-3 shrink-0">
                          <span className="text-[#888] text-[13px] font-medium tracking-wide px-1">{app.name}</span>
                          <div className={`h-[400px] aspect-[230/500] rounded-[16px] overflow-hidden border border-[#333] shadow-lg relative bg-black flex items-center justify-center group`}>
                            <OptimizedImage src={app.imageUrl} className={`w-full h-full object-cover grayscale ${app.opacity || 'opacity-50'} group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300`} alt={app.name} optimizationWidth={400} priority={idx < 2} />
                          </div>
                      </div>
                    ))}
                  </div>
                )}

            {/* Metadata */}
            <div className="flex flex-col gap-3.5 mb-10">
              <div className="flex gap-2 text-[14px]">
                <span className="text-[#888]">Industry :</span>
                <span className="text-[#ccc]">{categories.find(c => c.id === selectedCategory)?.title || 'Banking'}</span>
              </div>
              <div className="flex gap-2 text-[14px]">
                <span className="text-[#888]">Flow :</span>
                <span className="text-[#ccc]">{flows.find(f => f.id === selectedFlow)?.title || 'Onboarding'}</span>
              </div>
              <div className="flex gap-2 text-[14px]">
                <span className="text-[#888]">Subcategory :</span>
                <span className="text-[#ccc]">{subcategories.find(s => s.id === selectedSubcategory)?.title || ''}</span>
              </div>
              <div className="flex gap-2 text-[14px]">
                <span className="text-[#888]">Benchmark group:</span>
                <span className="text-[#ccc]">Global {categories.find(c => c.id === selectedCategory)?.title || ''}</span>
              </div>
              <div className="flex items-center gap-3 text-[14px] mt-2">
                <span className="text-[#888]">Comparable Products :</span>
                <div className="flex items-center gap-2">
                  {benchmarkScreens.map(prod => (
                    <span key={prod.name} className="px-3 py-1 rounded-full bg-[#2a2a2a] text-[#ccc] text-[12px] font-medium">{prod.name}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Alignment */}
            <div className="bg-[#1c1c1c] rounded-xl p-6 mb-12">
              <p className="text-[#666] text-[12px] mb-2 font-medium">Overall Benchmark Alignment</p>
              <p className="text-[#ddd] text-[14px] leading-relaxed">
                {benchmarkData.overallAlignment}
              </p>
            </div>

            {/* 1. Benchmark Snapshot */}
            <h2 className="text-[16px] font-semibold text-white mb-6">1. Benchmark Snapshot</h2>
            <div className="grid grid-cols-3 gap-5 mb-14">
              {/* Strong Conventions */}
              <div className="bg-[#1c1c1c] rounded-xl p-6">
                <h3 className="text-[#888] text-[13px] font-medium mb-4">Strong Conventions :</h3>
                <ul className="space-y-4">
                  {(Array.isArray(benchmarkData.snapshot?.strongConventions) ? benchmarkData.snapshot.strongConventions : []).map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                      <span className="text-[#666] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Notable Differences */}
              <div className="bg-[#1c1c1c] rounded-xl p-6">
                <h3 className="text-[#888] text-[13px] font-medium mb-4">Notable Differences :</h3>
                <ul className="space-y-4">
                  {(Array.isArray(benchmarkData.snapshot?.notableDifferences) ? benchmarkData.snapshot.notableDifferences : []).map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                      <span className="text-[#666] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Key Opportunities */}
              <div className="bg-[#1c1c1c] rounded-xl p-6">
                <h3 className="text-[#888] text-[13px] font-medium mb-4">Key Opportunities</h3>
                <ul className="space-y-4">
                  {(Array.isArray(benchmarkData.snapshot?.keyOpportunities) ? benchmarkData.snapshot.keyOpportunities : []).map((item: string, i: number) => (
                    <li key={i} className="flex gap-2.5 text-[13px] text-[#ccc] leading-snug">
                      <span className="text-[#666] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

              {/* 2. Common Benchmark Patterns */}
              <h2 className="text-[16px] font-semibold text-white mb-6">2. Common Benchmark Patterns</h2>
              <div className="space-y-10 mb-14">
                {(Array.isArray(benchmarkData.commonPatterns) ? benchmarkData.commonPatterns : []).map((pattern: any, i: number) => (
                  <div key={i} className="flex flex-col gap-4 border-t border-[#2a2a2a] pt-6">
                    <div>
                      <h3 className="text-white text-[15px] font-medium mb-1">{pattern.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Benchmark Evidence</p>
                        <p className="text-[#ccc] text-[13px]">{pattern.evidence}</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Confidence</p>
                        <div>{getConfidencePill(pattern.confidence)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[#666] text-[12px] mb-1">Why it matters</p>
                      <p className="text-[#ccc] text-[13px]">{pattern.whyItMatters}</p>
                    </div>

                    {pattern.exceptions && (
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Exceptions</p>
                        <p className="text-[#ccc] text-[13px]">{pattern.exceptions}</p>
                      </div>
                    )}

                    {pattern.benchmarkExamples && pattern.benchmarkExamples.length > 0 && (
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Benchmark examples</p>
                        <ul className="list-disc list-inside text-[#ccc] text-[13px] space-y-1">
                          {pattern.benchmarkExamples.map((ex: string, idx: number) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
  
                    {pattern.metrics && (
                      <div className="flex flex-col gap-4 mt-2">
                        <div>
                          <p className="text-[#666] text-[12px] mb-1">Market Standard Parity ({pattern.metrics.marketStandardParity?.score ?? pattern.metrics.marketStandardParity}/10)</p>
                          {pattern.metrics.marketStandardParity?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.marketStandardParity.reasoning}</p>}
                        </div>
                        <div>
                          <p className="text-[#666] text-[12px] mb-1">Proven Pattern Adherence ({pattern.metrics.provenPatternAdherence?.score ?? pattern.metrics.provenPatternAdherence}/10)</p>
                          {pattern.metrics.provenPatternAdherence?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.provenPatternAdherence.reasoning}</p>}
                        </div>
                        <div>
                          <p className="text-[#666] text-[12px] mb-1">Information Density Match ({pattern.metrics.informationDensityMatch?.score ?? pattern.metrics.informationDensityMatch}/10)</p>
                          {pattern.metrics.informationDensityMatch?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.informationDensityMatch.reasoning}</p>}
                        </div>
                        <div>
                          <p className="text-[#666] text-[12px] mb-1">Competitive Edge ({pattern.metrics.competitiveEdge?.score ?? pattern.metrics.competitiveEdge}/10)</p>
                          {pattern.metrics.competitiveEdge?.reasoning && <p className="text-[#999] text-[12px]">{pattern.metrics.competitiveEdge.reasoning}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            {/* 3. Where Your Design Differs */}
            <h2 className="text-[16px] font-semibold text-white mb-6">3. Where Your Design Differs</h2>
            <div className="space-y-10 mb-14">
              {(Array.isArray(benchmarkData.designDifferences) ? benchmarkData.designDifferences : []).map((diff: any, i: number) => (
                <div key={i} className="flex flex-col gap-4 border-t border-[#2a2a2a] pt-6">
                  <h3 className="text-white text-[15px] font-medium">{diff.title}</h3>
                  
                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Your design</p>
                    <p className="text-[#ccc] text-[13px]">{diff.yourDesign}</p>
                  </div>
                  
                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Benchmark</p>
                    <p className="text-[#ccc] text-[13px]">{diff.benchmark}</p>
                  </div>

                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Difference</p>
                    <p className="text-[#ccc] text-[13px]">{diff.difference}</p>
                  </div>

                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Potential impact</p>
                    <p className="text-[#ccc] text-[13px]">{diff.potentialImpact}</p>
                  </div>
                </div>
              ))}
            </div>

              {/* 4. Key Opportunities */}
              <h2 className="text-[16px] font-semibold text-white mb-6">4. Key Opportunities</h2>
              <div className="space-y-10 pb-10 border-t border-[#2a2a2a] pt-6">
                {(Array.isArray(benchmarkData.opportunities) ? benchmarkData.opportunities : []).map((opp: any, i: number) => (
                  <div key={i} className="flex flex-col gap-4 mt-6 first:mt-0">
                    <h3 className="text-white text-[15px] font-medium">{opp.title}</h3>
                    
                    <div>
                      <p className="text-[#666] text-[12px] mb-1">Observation</p>
                      <p className="text-[#ccc] text-[13px]">{opp.observation}</p>
                    </div>
                    
                    <div>
                      <p className="text-[#666] text-[12px] mb-1">Recommendation</p>
                      <p className="text-[#ccc] text-[13px]">{opp.recommendation}</p>
                    </div>
  
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Benchmark Evidence</p>
                        <p className="text-[#ccc] text-[13px]">{opp.evidence}</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Confidence</p>
                        <div>{getConfidencePill(opp.confidence)}</div>
                      </div>
                    </div>

                    {opp.exceptions && (
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Exceptions</p>
                        <p className="text-[#ccc] text-[13px]">{opp.exceptions}</p>
                      </div>
                    )}

                    {opp.benchmarkExamples && opp.benchmarkExamples.length > 0 && (
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Benchmark examples</p>
                        <ul className="list-disc list-inside text-[#ccc] text-[13px] space-y-1">
                          {opp.benchmarkExamples.map((ex: string, idx: number) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 5. Improved UI Generated by AI */}
              { (isGeneratingDesign || improvedDesignCode) && (
                <>
                  <h2 className="text-[16px] font-semibold text-white mb-6 mt-10">5. Improved UI Recommendation</h2>
                  <div className="border-t border-[#2a2a2a] pt-6 pb-10">
                    {isGeneratingDesign ? (
                      <div className="flex flex-col items-center justify-center p-12 bg-[#1a1a1a] rounded-2xl border border-[#333]">
                        <Loader2 className="w-8 h-8 text-[#4E6BFF] animate-spin mb-4" />
                        <p className="text-white text-[15px] font-medium">✨ AI is crafting an improved interactive design based on these findings...</p>
                        <p className="text-[#888] text-[13px] mt-2">Generating live React + Tailwind code</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl overflow-hidden border border-[#333]">
                        <Sandpack 
                          template="react-ts"
                          theme="dark"
                          files={{
                            "/App.tsx": improvedDesignCode || "",
                            "/public/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
                          }}
                          options={{
                            showNavigator: true,
                            showLineNumbers: true,
                            editorHeight: "600px",
                            externalResources: ["https://cdn.tailwindcss.com"]
                          }}
                          customSetup={{
                            dependencies: {
                              "lucide-react": "latest"
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              </div> {/* Close Card */}
              </div> {/* Close scrollable report */}

              {/* Chat Modal (Bottom Sheet) */}
              {isChatOpen && (
                <div className="fixed inset-0 z-[300] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm px-4 pt-10">
                  {/* Close Button */}
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="mb-4 bg-[#27272a] hover:bg-[#3f3f46] text-white/70 hover:text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 border border-white/10 shadow-lg"
                  >
                    Close chat <X size={14} />
                  </button>

                  {/* Background Glow */}
                  <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[#4E6BFF]/30 blur-[150px] rounded-full pointer-events-none z-0" />

                  {/* Modal Container */}
                  <div className="w-full max-w-[800px] h-[75vh] min-h-[500px] bg-[#141414] rounded-t-[24px] overflow-hidden flex flex-col border border-[#323232] border-b-0 shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10">
                    {/* Subtle Top Glow */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#4E6BFF] to-transparent opacity-50" />
                    
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-10 pb-6 flex flex-col gap-8 custom-scrollbar scrollbar-hide">
                      {chatMessages.map((msg, i) => {
                        if (i === 0) return null; // Skip initial greeting
                        
                        if (msg.role === 'user') {
                          return (
                            <div key={i} className="flex flex-col items-end gap-3 self-end max-w-[80%]">
                              <div className="bg-[#1e1e1e] text-white/90 px-5 py-3.5 rounded-[16px] rounded-tr-sm text-[15px] leading-relaxed border border-white/5 font-medium shadow-sm">
                                {msg.content}
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={i} className="flex items-start gap-5 max-w-[95%]">
                            <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center rounded-full bg-[#1e1e1e] border border-white/10">
                              <img src={floatIcon} className="w-5 h-5" alt="AI" />
                            </div>
                            <div className="flex-1">
                              <div className="prose prose-invert max-w-none prose-p:leading-[1.7] prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-headings:text-zinc-200 prose-a:text-blue-400 text-zinc-200 text-[15px]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {isChatting && (
                        <div className="flex items-start gap-5 max-w-[95%]">
                          <div className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center">
                            <ThinkingOrb state="solving" size={20} speed={1.10} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 text-zinc-400 py-1.5">
                              <span className="text-[15px] font-medium animate-pulse">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatMessagesEndRef} />
                    </div>

                    {/* Modal Input Area */}
                    <div className="p-6 bg-transparent mt-auto flex justify-center pb-8">
                      <div className="w-[425px] min-h-[104px] relative rounded-[12px]">
                        <div className="w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col border border-[#434343]">
                          <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} className="flex flex-col h-full">
                            <div className="flex flex-col justify-between p-3 h-full relative bg-transparent">
                              <textarea 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask me anything"
                                className="w-full bg-transparent text-white/90 text-[14px] resize-none outline-none placeholder:text-[#666] min-h-[40px] custom-scrollbar pb-8"
                                disabled={isChatting}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChatSubmit();
                                  }
                                }}
                              />
                              <div className="absolute bottom-3 right-3 flex items-center justify-end">
                                <button 
                                  type="submit"
                                  disabled={!chatInput.trim() || isChatting}
                                  className="w-7 h-7 rounded-[8px] bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                                >
                                  <ArrowUp size={14} className={isChatting ? 'opacity-0' : 'opacity-100'} />
                                  {isChatting && <Loader2 size={14} className="absolute animate-spin" />}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Chatbar (Visible only when chat panel is closed) */}
              {!isChatOpen && (
                <div className="fixed bottom-10 left-[calc(50vw+170px)] -translate-x-1/2 z-[300] w-[600px] flex flex-col items-center pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                  <div className="relative w-full flex flex-col items-center pointer-events-auto">
                    {/* Expand Chat Button (if history exists) */}
                    {chatMessages.length > 1 && (
                      <button 
                        onClick={() => setIsChatOpen(true)}
                        className="mb-3 px-4 py-1.5 bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-full text-[#0099FF] text-[12px] font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-lg"
                      >
                        <MessageSquare size={14} />
                        View Chat History
                      </button>
                    )}
                    
                    {/* Floating Input Bar */}
                    <div className="w-full bg-[#1e1e1e]/90 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-white/20 transition-colors">
                      <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); setIsChatOpen(true); }} className="flex gap-2 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]">
                          <MessageSquare size={18} />
                        </div>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a follow-up question about this UX report..."
                          className="flex-1 bg-transparent border-none rounded-full pl-12 pr-16 py-2.5 text-[14px] text-white focus:outline-none focus:ring-0 transition-all placeholder-[#666]"
                          disabled={isChatting}
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isChatting}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0099FF] flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0088EE] transition-colors shadow-lg shadow-[#0099FF]/20"
                        >
                          <Send size={15} className={isChatting ? 'opacity-0' : 'opacity-100 ml-[-2px]'} />
                          {isChatting && <Loader2 size={15} className="animate-spin absolute" />}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

            </div> {/* Close Right Content */}
            </div> {/* Close Grid */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col flex-1 bg-[#121212] items-center pt-[60px] pb-12 relative min-h-[calc(100vh-72px)]"
      onPaste={handlePaste}
    >
      
      {/* Left How it Works Card (Hide during processing/results) */}
      {showHowItWorks && appState === 'idle' && (
        <div className="absolute left-10 top-10 w-[300px] bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#222]">
          <button 
            onClick={() => setShowHowItWorks(false)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 z-10"
          >
            <X size={14} />
          </button>
          
          <div className="w-full h-[160px] bg-[#222] relative flex items-center justify-center">
            <div className="w-full h-full opacity-60 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                <Play className="text-white ml-1" size={20} fill="white" />
              </div>
            </div>
          </div>
          
          <div className="p-5 flex flex-col gap-1.5">
            <h3 className="text-white font-medium text-[15px]">See how it works</h3>
            <p className="text-[#a1a1aa] text-[13px] leading-relaxed">
              Compare your design and uncover UX insights.
            </p>
          </div>
        </div>
      )}

      {/* Main Upload Zone */}
      <div 
        className={`relative w-[264px] h-[559px] rounded-[32px] border-2 ${isDragging ? 'border-[#4E6BFF] bg-[#4E6BFF]/5' : 'border-dashed border-[#333] hover:border-[#555]'} p-1 transition-colors shrink-0`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => appState === 'idle' && !uploadedImage && fileInputRef.current?.click()}
      >
        <div className={`w-full h-full rounded-[24px] overflow-hidden ${uploadedImage ? 'bg-transparent' : 'bg-[#141414]'} flex flex-col items-center justify-center ${(appState === 'idle' && !uploadedImage) ? 'cursor-pointer hover:bg-[#1a1a1a] transition-colors' : ''} ${!user && !isAuthLoading ? 'blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          {uploadedImage ? (
            <>
              <img src={uploadedImage} alt="Uploaded Screen" className={`w-full h-full object-cover transition-opacity duration-500 ${appState !== 'idle' ? 'opacity-30 grayscale' : 'opacity-100'}`} />
            </>
          ) : (
            <div className="flex flex-col items-center text-center p-6 gap-2">
              <Upload className="w-6 h-6 text-[#a1a1aa] mb-2" />
              <p className="text-white text-[15px] font-semibold">Upload your screen</p>
              <p className="text-[#a1a1aa] text-[13px] leading-relaxed">Drag & Drop or directly paste<br/>with cmd + V</p>
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }} 
          accept="image/*" 
          className="hidden" 
        />
        
        {uploadedImage && appState === 'idle' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setUploadedImage(null);
            }}
            className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white p-2 rounded-full hover:bg-black"
          >
            <X size={16} />
          </button>
        )}

        {/* Overlay for Unauthenticated Users (Inside the phone screen) */}
        {!user && !isAuthLoading && appState === 'idle' && (
            <div className="absolute inset-1 rounded-[24px] z-30 flex flex-col items-center justify-center p-4">
                <div className="relative z-10 flex flex-col items-center bg-black/60 w-full py-6 px-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                    <h2 className="text-[18px] font-semibold text-white mb-2 tracking-[-0.04em] text-center leading-tight">Unlock AI Benchmarking</h2>
                    <p className="text-[#CFCFCF] text-[13px] font-normal mb-5 text-center tracking-[-0.02em] leading-relaxed">
                        Log in to benchmark screens against market leaders.
                    </p>
                    <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/register');
                        }}
                        className="bg-white text-black hover:bg-gray-200 rounded-full w-full h-9 font-medium text-[13px]"
                    >
                        Join Free
                    </Button>
                </div>
            </div>
        )}
      </div>

      {/* Dynamic Action Area */}
      {appState === 'idle' && user && (
        <div className="mt-[48px]">
          <Button 
            disabled={!uploadedImage}
            className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-11 text-[14px] font-semibold shadow-lg disabled:opacity-50 min-w-[160px]"
            onClick={handleBenchmarkClick}
          >
            Benchmark Now
          </Button>
        </div>
      )}

      {appState === 'detected' && (
        <div className="mt-8 flex flex-col items-center bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] shadow-2xl animate-in slide-in-from-bottom-4 fade-in">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-white font-medium text-[16px]">Select Context</h3>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-[#777] text-[12px] font-medium uppercase tracking-wider ml-1">Category</span>
              <TaxonomyCombobox 
                options={categories} 
                value={selectedCategory} 
                onChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubcategory('');
                }} 
                placeholder="Select Category..." 
              />
            </div>
            <ArrowRight className="text-[#444] mt-5" size={18} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[#777] text-[12px] font-medium uppercase tracking-wider ml-1">Subcategory</span>
              <TaxonomyCombobox 
                options={subcategories.filter(s => s.categoryId === selectedCategory).map(s => ({id: s.id, title: s.title}))} 
                value={selectedSubcategory} 
                onChange={setSelectedSubcategory} 
                placeholder="Select Subcategory..." 
              />
            </div>
            <ArrowRight className="text-[#444] mt-5" size={18} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[#777] text-[12px] font-medium uppercase tracking-wider ml-1">Flow</span>
              <TaxonomyCombobox 
                options={flows} 
                value={selectedFlow} 
                onChange={setSelectedFlow} 
                placeholder="Select Flow..." 
              />
            </div>
          </div>

          <p className="text-[#888] text-[13px] mb-6 text-center max-w-sm">
            Please fill in the context above. We will fetch top market leaders matching this context to run the benchmark.
          </p>

          <Button 
            disabled={!selectedCategory || !selectedSubcategory || !selectedFlow}
            className="bg-[#4E6BFF] text-white hover:bg-[#3d5be6] rounded-full px-10 h-11 text-[14px] font-semibold shadow-lg shadow-[#4E6BFF]/20 disabled:opacity-50"
            onClick={handleViewResults}
          >
            Confirm & View Results
          </Button>
        </div>
      )}

      {/* Fullscreen Loading Overlay (same as CompareMode) */}
      {appState === 'analyzing' && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <ThinkingOrb state="solving" size={64} speed={1.10} />
          <div className="mt-6 bg-[#141414]/90 border border-white/10 px-6 py-3 rounded-full shadow-lg">
            <span className="text-[14px] font-medium text-white/90 animate-pulse">{loadingMessages[loadingMessageIndex]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
