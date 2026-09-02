import React, { useState, useRef, useEffect } from 'react';
import { Play, X, Upload, ChevronsUpDown, Check, ArrowRight, Share2, Copy, Download, Maximize, Minimize } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ThinkingOrb } from 'thinking-orbs';

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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Demo States
  const [appState, setAppState] = useState<'idle' | 'analyzing' | 'detected' | 'results'>('idle');

  // Taxonomy Data States
  const [categories, setCategories] = useState<{id: string, title: string}[]>([]);
  const [flows, setFlows] = useState<{id: string, title: string}[]>([]);
  const [patterns, setPatterns] = useState<{id: string, title: string}[]>([]);

  // Selected Taxonomy
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [detectedScreenType, setDetectedScreenType] = useState<string>('Account Creation');

  // Benchmark Results Data
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [benchmarkScreens, setBenchmarkScreens] = useState<any[]>([]);

  // Loading animation state
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Analyzing screen structure...",
    "Extracting UX patterns...",
    "Matching with market leaders...",
    "Almost done..."
  ];

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

  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('http://localhost:4000/api/v1/export/docx', {
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
        const [catsRes, flowsRes, patternsRes] = await Promise.all([
          fetch('http://localhost:4000/api/v1/categories'),
          fetch('http://localhost:4000/api/v1/flows'),
          fetch('http://localhost:4000/api/v1/patterns')
        ]);
        
        const catsData = await catsRes.json();
        const flowsData = await flowsRes.json();
        const patternsData = await patternsRes.json();

        const catArray = Array.isArray(catsData) ? catsData : catsData.data || [];
        const flowArray = Array.isArray(flowsData) ? flowsData : flowsData.data || [];
        const patArray = Array.isArray(patternsData) ? patternsData : patternsData.data || [];

        setCategories(catArray.map((c: any) => ({ id: c.id, title: c.title || c.name })));
        setFlows(flowArray.map((f: any) => ({ id: f.id, title: f.name || f.title })));
        setPatterns(patArray.map((p: any) => ({ id: p.id, title: p.title || p.name })));

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
    for (const item of items) {
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
        setAppState('idle'); // reset state if a new image is uploaded
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBenchmarkClick = async () => {
    setAppState('analyzing');
    
    try {
      const response = await fetch('http://localhost:4000/api/v1/ai/detect-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: uploadedImage })
      });
      const data = await response.json();
      
      if (data.categoryId) setSelectedCategory(data.categoryId);
      if (data.flowId) setSelectedFlow(data.flowId);
      if (data.screenType) setDetectedScreenType(data.screenType);
      
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
      const response = await fetch('http://localhost:4000/api/v1/ai/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: uploadedImage,
          categoryId: selectedCategory,
          flowId: selectedFlow,
          screenType: detectedScreenType
        })
      });
      const data = await response.json();
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
    } catch (error) {
      console.error(error);
      setAppState('detected');
    }
  };

  if (appState === 'results' && benchmarkData) {
    return (
      <div className="flex flex-col flex-1 bg-[#262626] min-h-[calc(100vh-72px)] p-12 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto w-full">
          
          <div 
            ref={resultsContainerRef}
            className={`mx-auto bg-[#141414] shadow-2xl transition-all duration-300 ${
            isResultsFullscreen 
              ? 'fixed inset-0 z-[200] p-12 overflow-y-auto w-full max-w-none rounded-none border-none' 
              : 'w-full rounded-[24px] border border-[#2a2a2a] p-10'
          }`}>
            <div className={isResultsFullscreen ? 'max-w-[1200px] mx-auto' : ''}>
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-6 mb-8">
                <h1 className="text-[20px] font-semibold text-white tracking-wide">Benchmark Results</h1>
                <div className="flex items-center gap-5 text-[#888]">
                  <Button 
                    className="bg-[#222] text-[#ccc] hover:bg-[#333] hover:text-white rounded-full px-5 h-9 text-[12px] font-medium mr-4 border border-[#333]"
                    onClick={() => {
                      setAppState('idle');
                      setUploadedImage(null);
                      setIsResultsFullscreen(false);
                    }}
                  >
                    Try another Screen
                  </Button>
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

              {/* Slider Section */}
              <div className="w-full pb-10 mb-10 border-b border-[#2a2a2a] overflow-x-auto custom-scrollbar flex gap-6">
                {/* Your Design */}
                <div className="flex flex-col gap-3 shrink-0">
                  <span className="text-[#0099FF] text-[13px] font-semibold tracking-wide uppercase px-1">Your Design</span>
                  <div className="h-[400px] aspect-[230/500] rounded-[16px] overflow-hidden border-2 border-[#0099FF] shadow-lg relative">
                      <img src={uploadedImage!} alt="Your Design" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Benchmarks (Dynamic) */}
                {benchmarkScreens.map((app, idx) => (
                  <div key={idx} className="flex flex-col gap-3 shrink-0">
                      <span className="text-[#888] text-[13px] font-medium tracking-wide px-1">{app.name}</span>
                      <div className={`h-[400px] aspect-[230/500] rounded-[16px] overflow-hidden border border-[#333] shadow-lg relative bg-black flex items-center justify-center group`}>
                        <img src={app.imageUrl} className={`w-full h-full object-cover grayscale ${app.opacity || 'opacity-50'} group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300`} alt={app.name} />
                      </div>
                  </div>
                ))}
              </div>

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
                <span className="text-[#888]">AI Detected Screen Type :</span>
                <span className="text-[#4E6BFF] font-medium">{detectedScreenType}</span>
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
                  {benchmarkData.snapshot?.strongConventions?.map((item: string, i: number) => (
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
                  {benchmarkData.snapshot?.notableDifferences?.map((item: string, i: number) => (
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
                  {benchmarkData.snapshot?.keyOpportunities?.map((item: string, i: number) => (
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
              {benchmarkData.commonPatterns?.map((pattern: any, i: number) => (
                <div key={i} className="flex flex-col gap-4 border-t border-[#2a2a2a] pt-6">
                  <div>
                    <h3 className="text-white text-[15px] font-medium mb-1">{pattern.title}</h3>
                  </div>
                  
                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Evidence</p>
                    <p className="text-[#ccc] text-[13px]">{pattern.evidence}</p>
                  </div>
                  
                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Why it matters</p>
                    <p className="text-[#ccc] text-[13px]">{pattern.whyItMatters}</p>
                  </div>

                  {pattern.metrics && (
                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Market Standard Parity ({pattern.metrics.marketStandardParity}/10)</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Proven Pattern Adherence ({pattern.metrics.provenPatternAdherence}/10)</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Information Density Match ({pattern.metrics.informationDensityMatch}/10)</p>
                      </div>
                      <div>
                        <p className="text-[#666] text-[12px] mb-1">Competitive Edge ({pattern.metrics.competitiveEdge}/10)</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 3. Where Your Design Differs */}
            <h2 className="text-[16px] font-semibold text-white mb-6">3. Where Your Design Differs</h2>
            <div className="space-y-10 mb-14">
              {benchmarkData.designDifferences?.map((diff: any, i: number) => (
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
              {benchmarkData.opportunities?.map((opp: any, i: number) => (
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

                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Evidence</p>
                    <p className="text-[#ccc] text-[13px]">{opp.evidence}</p>
                  </div>

                  <div>
                    <p className="text-[#666] text-[12px] mb-1">Confidence</p>
                    <p className="text-[#ccc] text-[13px]">{opp.confidence}</p>
                  </div>
                </div>
              ))}
            </div>

            </div> {/* Close max-w inner container if fullscreen */}
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
        <div className={`w-full h-full rounded-[24px] overflow-hidden ${uploadedImage ? 'bg-transparent' : 'bg-[#141414]'} flex flex-col items-center justify-center ${(appState === 'idle' && !uploadedImage) ? 'cursor-pointer hover:bg-[#1a1a1a] transition-colors' : ''}`}>
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
      </div>

      {/* Dynamic Action Area */}
      {appState === 'idle' && (
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
            <div className="w-2 h-2 rounded-full bg-[#4ee6b6] animate-pulse" />
            <h3 className="text-white font-medium text-[16px]">Context Detected</h3>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-[#777] text-[12px] font-medium uppercase tracking-wider ml-1">Category</span>
              <TaxonomyCombobox 
                options={categories} 
                value={selectedCategory} 
                onChange={setSelectedCategory} 
                placeholder="Select Category..." 
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
            Please verify the context above. We will fetch top market leaders in this specific category to run the benchmark.
          </p>

          <Button 
            className="bg-[#4E6BFF] text-white hover:bg-[#3d5be6] rounded-full px-10 h-11 text-[14px] font-semibold shadow-lg shadow-[#4E6BFF]/20"
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
