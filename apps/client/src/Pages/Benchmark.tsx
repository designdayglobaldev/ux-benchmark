import { useState, useRef, useEffect } from 'react';
import { useBenchmarkTaxonomy } from '@/hooks/queries/useBenchmarkTaxonomy';
import { Play, X, ArrowRight, Share2, Copy, Download, Maximize, Minimize, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ThinkingOrb } from 'thinking-orbs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/ui/optimized-image';
import api from '@/utils/api';

import { TaxonomyCombobox } from '@/components/benchmark/TaxonomyCombobox';
import { BenchmarkScreenCarousel } from '@/components/benchmark/BenchmarkScreenCarousel';
import { BenchmarkReportView } from '@/components/benchmark/BenchmarkReportView';
import { BenchmarkChatDrawer } from '@/components/benchmark/BenchmarkChatDrawer';
import { StartBenchmarkButton } from '@/components/StartBenchmarkButton';
import benchmarkDotsImg from '@/assets/benchmaekdots.png';
import seeHowItWorksThumb from '@/assets/see-how-it-works-thumb.png';
import demoTransferScreen from '@/assets/demo-transfer-screen.png';
import { DEMO_BENCHMARK_REPORT, DEMO_BENCHMARK_SCREENS, DEMO_IMPROVED_DESIGN_HTML } from '@/components/benchmark/demoBenchmarkData';

export function Benchmark() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => sessionStorage.getItem('benchmark_uploadedImage') || demoTransferScreen);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  // Demo States
  const [appState, setAppState] = useState<'idle' | 'analyzing' | 'detected' | 'results'>(() => sessionStorage.getItem('benchmark_appState') as any || 'idle');

  // Taxonomy data provided by useBenchmarkTaxonomy hook

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
  const [improvedDesignCode, setImprovedDesignCode] = useState<string | null>(() => sessionStorage.getItem('benchmark_improvedDesignHTML') || null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState<boolean>(false);
  const generationAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const generateImprovedDesign = async () => {
      if (appState === 'results' && benchmarkData && uploadedImage && !isGeneratingDesign) {
        if (generationAttemptedRef.current === uploadedImage) return;
        
        generationAttemptedRef.current = uploadedImage;

        // If it's the built-in demo screen, immediately set the curated improved UI
        if (uploadedImage === demoTransferScreen) {
          setImprovedDesignCode(DEMO_IMPROVED_DESIGN_HTML);
          sessionStorage.setItem('benchmark_improvedDesignHTML', DEMO_IMPROVED_DESIGN_HTML);
          return;
        }

        setImprovedDesignCode(null);
        sessionStorage.removeItem('benchmark_improvedDesignHTML');
        setIsGeneratingDesign(true);
        try {
          const res = await api.post('/ai/improve-design', {
            imageBase64: uploadedImage,
            benchmarkResult: benchmarkData,
          });
          const data = res.data;
          if (data.code) {
            setImprovedDesignCode(data.code);
            sessionStorage.setItem('benchmark_improvedDesignHTML', data.code);
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
  const [exportProgress, setExportProgress] = useState<number | null>(null);

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);

      // 1. Dispatch asynchronous job to BullMQ Redis Queue
      const queueRes = await api.post('/queues/jobs/export', {
        screens: benchmarkScreens,
        benchmarkData,
        format: 'docx',
      });

      const { jobId, queue } = queueRes.data;

      // 2. Poll job status until worker completes
      let isCompleted = false;
      let attempts = 0;

      while (!isCompleted && attempts < 30) {
        await new Promise((r) => setTimeout(r, 1200));
        attempts++;

        const statusRes = await api.get(`/queues/jobs/${queue}/${jobId}`);
        const job = statusRes.data.job;

        if (job) {
          if (typeof job.progress === 'number') {
            setExportProgress(job.progress);
          }

          if (job.state === 'completed') {
            isCompleted = true;
            setExportProgress(100);

            // Fetch worker-generated artifact directly from Redis artifact cache
            let downloadPath = job.returnvalue?.downloadUrl || `/export/download/${jobId}`;
            if (downloadPath.startsWith('/api/v1')) {
              downloadPath = downloadPath.replace('/api/v1', '');
            }
            const downloadRes = await api.get(downloadPath, { responseType: 'blob' });

            const blob = new Blob([downloadRes.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'UX-Benchmark-Report.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            break;
          }

          if (job.state === 'failed') {
            throw new Error(job.failedReason || 'Export job failed');
          }
        }
      }
    } catch (error) {
      console.error('Failed to export DOCX via queue:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Fetch initial data
  const [isResultsFullscreen, setIsResultsFullscreen] = useState(false);
  
  // Cached via TanStack Query (30 min cache, zero repetitive network roundtrips)
  const { data: taxonomyData } = useBenchmarkTaxonomy();
  const categories = taxonomyData?.categories || [];
  const flows = taxonomyData?.flows || [];
  const subcategories = taxonomyData?.subcategories || [];

  const handleBenchmarkClick = async () => {
    // If benchmarking the built-in demo transfer screen, immediately populate curated results
    if (uploadedImage === demoTransferScreen) {
      setAppState('analyzing');
      setTimeout(() => {
        setBenchmarkData(DEMO_BENCHMARK_REPORT);
        setSelectedCategory('75673897-7eac-4695-bba5-04250b6b9463'); // Finance & Banking
        setSelectedSubcategory('a5cf5d41-3d00-4d7a-8e39-19f6fd22948f'); // Payment & Wallets
        setSelectedFlow('9f01f41f-aa41-4b90-aa70-a5f186f8d36a'); // Transferring Money
        
        const opacities = ['opacity-70', 'opacity-60', 'opacity-50', 'opacity-40', 'opacity-30'];
        setBenchmarkScreens(DEMO_BENCHMARK_SCREENS.map((s: any, idx: number) => ({
          ...s,
          opacity: opacities[idx % opacities.length]
        })));
        setImprovedDesignCode(DEMO_IMPROVED_DESIGN_HTML);
        sessionStorage.setItem('benchmark_improvedDesignHTML', DEMO_IMPROVED_DESIGN_HTML);
        setAppState('results');
      }, 700);
      return;
    }

    setAppState('analyzing');
    
    try {
      const response = await api.post('/ai/detect-context', {
        imageBase64: uploadedImage
      });
      const data = response.data;
      
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
      const response = await api.post('/ai/benchmark', {
        imageBase64: uploadedImage,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        flowId: selectedFlow,
      });
      const data = response.data;
      
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
                      setUploadedImage(demoTransferScreen);
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
                      className={`hover:text-white transition-colors flex items-center gap-1.5 ${isExporting ? 'text-amber-400 animate-pulse font-medium text-[12px]' : ''}`} 
                      title="Download DOCX" 
                      onClick={handleExportDocx}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{exportProgress !== null ? `${exportProgress}%` : 'Queued'}</span>
                        </>
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Slider Section for Benchmark Screens */}
                <BenchmarkScreenCarousel screens={benchmarkScreens} />

                {/* Benchmark Report Sections */}
                <BenchmarkReportView 
                  benchmarkData={benchmarkData}
                  categoryTitle={categories.find((c: any) => c.id === selectedCategory)?.title || 'Banking'}
                  flowTitle={flows.find((f: any) => f.id === selectedFlow)?.title || 'Onboarding'}
                  subCategoryTitle={subcategories.find((s: any) => s.id === selectedSubcategory)?.title || 'Checkout'}
                  benchmarkScreens={benchmarkScreens}
                  isGeneratingDesign={isGeneratingDesign}
                  improvedDesignCode={improvedDesignCode}
                />

              </div> {/* Close Card */}
              </div> {/* Close scrollable report */}

              {/* Chat Drawer & Floating Chatbar */}
              <BenchmarkChatDrawer 
                isOpen={isChatOpen}
                onOpen={() => setIsChatOpen(true)}
                onClose={() => setIsChatOpen(false)}
                chatMessages={chatMessages}
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onChatSubmit={handleChatSubmit}
                isChatting={isChatting}
                messagesEndRef={chatMessagesEndRef}
              />

            </div> {/* Close Right Content */}
            </div> {/* Close Grid */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col flex-1 bg-[#141414] items-center pt-[60px] pb-12 relative min-h-[calc(100vh-72px)] overflow-hidden"
    >
      {/* Background Dots Pattern (Exact Figma image 24 specs) */}
      <div
        className="pointer-events-none absolute z-0 select-none bg-no-repeat bg-contain bg-bottom"
        style={{
          width: "1412px",
          height: "906px",
          left: "calc(50% - 1412px / 2)",
          bottom: "0px",
          backgroundImage: `url(${benchmarkDotsImg})`,
        }}
      />
      
      {/* Left How it Works Card (Hide during processing/results) */}
      {showHowItWorks && appState === 'idle' && (
        <div 
          className="absolute z-20"
          style={{
            width: "258px",
            height: "225.38px",
            left: "60px",
            top: "102.52px",
          }}
        >
          {/* Main Card (Frame 2147227938) */}
          <div 
            className="w-[231px] h-[225.38px] bg-[#292929] rounded-[12px] p-[7px_7px_13px] flex flex-col items-start gap-[9px] shadow-2xl relative"
          >
            {/* Thumbnail Container (Frame 2147228089) */}
            <div className="w-[217px] h-[137.38px] rounded-[4px] relative overflow-hidden bg-black shrink-0 flex items-center justify-center">
              <img 
                src={seeHowItWorksThumb} 
                alt="See how it works" 
                className="w-full h-full object-cover rounded-[4px]"
              />
              <div className="absolute inset-0 bg-black/30 rounded-[4px] pointer-events-none" />
              
              {/* Play Button (Frame 2147227829) */}
              <div className="absolute w-[24px] h-[24px] bg-[#27272A] rounded-full flex items-center justify-center shadow-md">
                <div className="w-[9.12px] h-[11.04px] ml-[2px] flex items-center justify-center">
                  <Play className="text-white" size={10} fill="white" />
                </div>
              </div>
            </div>
            
            {/* Text Content (Frame 2147228090) */}
            <div className="w-[217px] flex flex-col items-start gap-[6px]">
              <h3 className="text-white font-medium text-[16px] leading-[19px] tracking-[-0.04em] font-sans">
                See how it works
              </h3>
              <p className="text-[#A3A3A3] font-normal text-[14px] leading-[17px] tracking-[-0.04em] font-sans">
                Compare your design and uncover UX insights.
              </p>
            </div>
          </div>

          {/* Close Button at right: 0 (Frame 2147228074) */}
          <button 
            onClick={() => setShowHowItWorks(false)}
            className="absolute top-0 right-0 w-[24px] h-[24px] bg-[#27272A] hover:bg-[#333] rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors z-30"
            title="Close"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Main Upload Zone (Frame 2147227965) */}
      <div 
        className="relative z-10 w-[264px] h-[556px] rounded-[27px] border-[2.5px] border-dashed border-[#494949] bg-[#252424] p-[4px] shrink-0 flex items-center justify-center select-none"
      >
        <div className={`w-[250.16px] h-[541.87px] rounded-[21px] overflow-hidden bg-transparent flex flex-col items-center justify-center ${!user && !isAuthLoading ? 'blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          <img 
            src={demoTransferScreen} 
            alt="Demo Screen" 
            className={`w-full h-full object-cover transition-opacity duration-500 ${appState !== 'idle' ? 'opacity-30 grayscale' : 'opacity-100'}`} 
          />
        </div>

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

      {/* Floating UI Details Tag (Frame 2147227935) */}
      {appState === 'idle' && (
        <div 
          className="absolute z-20 flex flex-col justify-center items-start p-[12px] gap-[8px] rounded-[14px] border border-[#252525] backdrop-blur-[6.7px] shadow-lg pointer-events-none"
          style={{
            width: "231px",
            height: "77px",
            left: "calc(50% + 144px)",
            top: "calc(50% + 80px)",
            background: "linear-gradient(180deg, rgba(29, 29, 29, 0.87) 0%, rgba(21, 21, 21, 0.92) 100%)",
          }}
        >
          <span className="text-white text-[12px] font-normal leading-[15px] font-sans">
            UI Details
          </span>
          <span className="text-[#868686] text-[12px] font-normal leading-[15px] font-sans">
            Domain : Fintech<br/>Flow : Transfer Flow
          </span>
        </div>
      )}

      {/* Dynamic Action Area */}
      {appState === 'idle' && user && (
        <div className="mt-[24px] relative z-10 flex flex-col items-center gap-[18px]">
          <StartBenchmarkButton 
            disabled={!uploadedImage}
            onClick={handleBenchmarkClick}
            text="Benchmark Design"
            width="166px"
            height="36px"
          />

          {/* Development Notice Pill (Frame 2147227993) */}
          <div 
            className="flex flex-row items-center p-[10px_13px_10px_12px] gap-[10px] rounded-[7px] border border-[#282828] bg-[#181818]"
            style={{ width: "447px", minHeight: "65px" }}
          >
            <div className="w-[36px] h-[36px] shrink-0 flex items-center justify-center">
              <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.25" d="M5.54993 10.411L5.54993 3.4736L16.6498 3.4736L16.6498 10.411L11.0999 15.9609L5.54993 10.411Z" fill="url(#paint0_linear_1688_100)"/>
                <path d="M2.28441 5.75312L5.05938 2.97816C5.12381 2.91365 5.20032 2.86248 5.28454 2.82757C5.36876 2.79266 5.45903 2.77469 5.5502 2.77469C5.64137 2.77469 5.73164 2.79266 5.81586 2.82757C5.90008 2.86248 5.97659 2.91365 6.04102 2.97816L8.81598 5.75312C8.94616 5.88329 9.01929 6.05985 9.01929 6.24394C9.01929 6.42803 8.94616 6.60459 8.81598 6.73476C8.68581 6.86494 8.50925 6.93807 8.32516 6.93807C8.14107 6.93807 7.96451 6.86494 7.83434 6.73476L6.24394 5.14349L6.24394 10.1194L11.1001 14.9755L15.9563 10.1194L15.9563 5.1435L14.3659 6.73476C14.2357 6.86494 14.0592 6.93807 13.8751 6.93807C13.691 6.93807 13.5144 6.86494 13.3843 6.73476C13.2541 6.60459 13.181 6.42804 13.181 6.24394C13.181 6.05985 13.2541 5.88329 13.3843 5.75312L16.1592 2.97816C16.2237 2.91366 16.3002 2.86249 16.3844 2.82757C16.4686 2.79266 16.5589 2.77469 16.6501 2.77469C16.7412 2.77469 16.8315 2.79266 16.9157 2.82757C16.9999 2.86249 17.0764 2.91366 17.1409 2.97816L19.9158 5.75312C19.9803 5.81758 20.0314 5.8941 20.0663 5.97831C20.1012 6.06253 20.1191 6.15279 20.1191 6.24394C20.1191 6.3351 20.1012 6.42536 20.0663 6.50957C20.0314 6.59379 19.9803 6.67031 19.9158 6.73476C19.7857 6.86494 19.6091 6.93807 19.425 6.93807C19.3339 6.93807 19.2436 6.92011 19.1594 6.88523C19.0752 6.85035 18.9986 6.79922 18.9342 6.73476L17.3438 5.1435L17.3438 10.4064C17.3439 10.4975 17.326 10.5878 17.2912 10.672C17.2563 10.7562 17.2053 10.8327 17.1409 10.8972L11.7939 16.2433L11.7939 20.1188C11.7939 20.3027 11.7208 20.4792 11.5907 20.6093C11.4606 20.7394 11.2841 20.8125 11.1001 20.8125C10.9161 20.8125 10.7397 20.7394 10.6096 20.6093C10.4795 20.4792 10.4064 20.3027 10.4064 20.1188L10.4064 16.2433L5.05938 10.8972C4.99497 10.8327 4.9439 10.7562 4.90909 10.672C4.87427 10.5878 4.85639 10.4975 4.85646 10.4064L4.85646 5.14349L3.26606 6.73476C3.13588 6.86494 2.95933 6.93807 2.77523 6.93807C2.59114 6.93807 2.41459 6.86494 2.28441 6.73476C2.15424 6.60459 2.08111 6.42803 2.08111 6.24394C2.08111 6.05985 2.15424 5.88329 2.28441 5.75312Z" fill="url(#paint1_linear_1688_100)"/>
                <defs>
                  <linearGradient id="paint0_linear_1688_100" x1="15.6901" y1="13.9872" x2="0.636793" y2="1.95737" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#992E4E"/>
                    <stop offset="0.5" stopColor="#F4A547"/>
                    <stop offset="0.75" stopColor="#26A1E9"/>
                    <stop offset="1" stopColor="#CC3BD1"/>
                  </linearGradient>
                  <linearGradient id="paint1_linear_1688_100" x1="18.5596" y1="17.9615" x2="-3.60793" y2="-1.96833" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#992E4E"/>
                    <stop offset="0.5" stopColor="#F4A547"/>
                    <stop offset="0.75" stopColor="#26A1E9"/>
                    <stop offset="1" stopColor="#CC3BD1"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-[#A8A8A8] text-[14px] leading-[22px] tracking-[-0.03em] font-normal">
              Benchmark is currently under development. In the meantime, you can explore and benchmark the built-in design provided.
            </p>
          </div>
        </div>
      )}

      {appState === 'detected' && (
        <div className="mt-8 relative z-10 flex flex-col items-center bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] shadow-2xl animate-in slide-in-from-bottom-4 fade-in">
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
                options={subcategories.filter((s: any) => s.categoryId === selectedCategory).map((s: any) => ({id: s.id, title: s.title}))} 
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
            asChild
            className="p-0 h-auto bg-transparent hover:bg-transparent shadow-none border-0"
          >
            <StartBenchmarkButton 
              disabled={!selectedCategory || !selectedSubcategory || !selectedFlow}
              onClick={handleViewResults}
              text="Confirm & View Results"
            />
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
