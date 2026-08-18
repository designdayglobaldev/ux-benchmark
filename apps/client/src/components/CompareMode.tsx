import { useState, useRef, useEffect } from 'react';
import type { ScreenType } from "@/hooks/useAppDetails";
import { ThinkingOrb } from 'thinking-orbs';

interface CompareModeProps {
    isOpen: boolean;
    onClose: () => void;
    activeScreen?: ScreenType;
    appName?: string;
}

export function CompareMode({ isOpen, onClose, activeScreen, appName }: CompareModeProps) {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResults, setComparisonResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadingMessages = [
        "Analyzing both screens...",
        "Comparing layouts and spacing...",
        "Evaluating typography and colors...",
        "Formulating UX metrics...",
        "Almost done..."
    ];

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isComparing) {
            interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
            }, 2000);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isComparing]);

    // Prevent body scrolling when active
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

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
                setComparisonResults(null);
                setError(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const urlToBase64 = async (url: string): Promise<string> => {
        if (url.startsWith('data:image')) return url;
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleCompare = async () => {
        if (!uploadedImage || !activeScreen?.imageUrl) return;
        setIsComparing(true);
        setError(null);

        try {
            const originalBase64 = await urlToBase64(activeScreen.imageUrl);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            const response = await fetch(`${apiUrl}/api/v1/ai/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImageBase64: originalBase64,
                    userImageBase64: uploadedImage
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to compare screens');
            }
            
            console.log("Comparison Results from API:", data);
            
            // Sometimes Claude might nest the metrics or return a slightly different shape
            if (data && data.metrics && Array.isArray(data.metrics)) {
                setComparisonResults(data);
            } else if (data && data.metrics && data.metrics.metrics) {
                setComparisonResults({ ...data, metrics: data.metrics.metrics });
            } else {
                setComparisonResults({ ...data, metrics: [] });
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsComparing(false);
        }
    };

    const resetUpload = () => {
        setUploadedImage(null);
        setComparisonResults(null);
        setError(null);
    };

    return (
        <div 
            className="fixed inset-0 z-[110] bg-[#0c0c0c] flex flex-col items-center overflow-y-auto overflow-x-hidden pt-24 pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onPaste={handlePaste}
        >
            {/* Top Pill */}
            <button 
                onClick={onClose}
                className="mb-8 bg-[#27272a] hover:bg-[#3f3f46] text-white/70 hover:text-white px-5 py-2 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 border border-white/10 shrink-0"
            >
                Comparison Mode ✕
            </button>

            {/* Loading Overlay */}
            {isComparing && (
                <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                    <ThinkingOrb state="solving" size={64} speed={1.10} />
                    <div className="mt-6 bg-[#141414]/90 border border-white/10 px-6 py-3 rounded-full shadow-lg">
                        <span className="text-[14px] font-medium text-white/90 animate-pulse">{loadingMessages[loadingMessageIndex]}</span>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="relative flex flex-col items-center justify-start w-full max-w-[1200px] min-h-min px-8 pb-32">
                
                {/* Side-by-Side Screens */}
                <div className="flex items-center justify-center gap-[60px] w-full max-w-[800px] mx-auto">
                    
                    {/* Left Screen (Active Screen) */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-[243.71px] h-[544px] rounded-[32px] overflow-visible border-4 border-dashed border-[#222222] p-1 shadow-2xl shrink-0">
                            <div className="w-full h-full rounded-[24px] overflow-hidden bg-[#141414]">
                                {activeScreen?.imageUrl && (
                                    <img src={activeScreen.imageUrl} alt="Active Screen" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center bg-[#222222] text-[#a1a1aa] px-4 py-1.5 rounded-full text-[12px] font-medium gap-2 mt-4">
                            <span className="text-white">{activeScreen?.name || 'Screen'}</span>
                            <span className="w-px h-3 bg-white/20"></span>
                            <span>{appName || 'App'}</span>
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="text-[#525252] font-semibold text-[14px]">VS</div>

                    {/* Right Screen (Upload/Uploaded) */}
                    <div className="flex flex-col items-center gap-4">
                        <div 
                            className={`relative w-[243.71px] h-[544px] rounded-[32px] border-4 ${isDragging ? 'border-[#4E6BFF] bg-[#4E6BFF]/5' : 'border-dashed border-[#222222]'} p-1 transition-colors shrink-0`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !uploadedImage && fileInputRef.current?.click()}
                        >
                            <div className={`w-full h-full rounded-[24px] overflow-hidden ${uploadedImage ? 'bg-transparent' : 'bg-[#141414]'} flex flex-col items-center justify-center ${!uploadedImage && 'cursor-pointer hover:bg-[#1a1a1a] transition-colors'}`}>
                                {uploadedImage ? (
                                    <img src={uploadedImage} alt="Uploaded Screen" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-center p-6 gap-2">
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
                        </div>
                        
                        {uploadedImage ? (
                            <button 
                                onClick={resetUpload}
                                className="flex items-center bg-[#222222] hover:bg-[#2a2a2a] text-[#a1a1aa] hover:text-white transition-colors px-4 py-1.5 rounded-full text-[12px] font-medium"
                            >
                                Re-upload screen
                            </button>
                        ) : (
                            <div className="h-[28px]"></div> // Spacer to keep layout balanced
                        )}
                    </div>

                </div>

                {/* Compare Action */}
                {uploadedImage && !comparisonResults && (
                    <div className="mt-12 flex flex-col items-center justify-center w-full gap-4">
                        <button 
                            onClick={handleCompare}
                            disabled={isComparing}
                            className="bg-white hover:bg-white/90 text-black px-8 py-3 rounded-full text-[15px] font-semibold transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center min-w-[200px]"
                        >
                            {isComparing ? "Comparing..." : "Compare Screens"}
                        </button>
                        {error && (
                            <div className="text-red-400 text-[13px]">{error}</div>
                        )}
                    </div>
                )}

                {/* Results View */}
                {comparisonResults && (
                    <div className="w-full max-w-[1000px] mx-auto mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        {/* Table */}
                        <div className="border border-[#222222] rounded-t-[12px] overflow-hidden bg-[#111111]">
                            <div className="grid grid-cols-[200px_1fr_1fr] bg-[#1a1a1a] border-b border-[#222222]">
                                <div className="p-4 text-center text-[#a1a1aa] text-[13px] font-semibold uppercase tracking-wider"></div>
                                <div className="p-4 text-center text-white text-[14px] font-semibold border-l border-[#222222]">{appName || 'Original'}</div>
                                <div className="p-4 text-center text-white text-[14px] font-semibold border-l border-[#222222]">Your Screen</div>
                            </div>
                            
                            {Array.isArray(comparisonResults.metrics) && comparisonResults.metrics.map((row: any, i: number) => (
                                <div key={i} className="grid grid-cols-[200px_1fr_1fr] border-b border-[#222222] last:border-0 hover:bg-[#151515] transition-colors">
                                    <div className="p-6 flex flex-col items-center justify-center text-center">
                                        <span className="text-white text-[14px] font-semibold">{row.name}</span>
                                    </div>
                                    <div className="p-6 border-l border-[#222222] flex items-center">
                                        <p className="text-[#d1d5db] text-[13px] leading-relaxed">{row.originalText}</p>
                                    </div>
                                    <div className="p-6 border-l border-[#222222] flex items-center">
                                        <p className="text-[#d1d5db] text-[13px] leading-relaxed">{row.userText}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Overall Scores Row */}
                            <div className="grid grid-cols-[200px_1fr_1fr] border-t border-[#333333] bg-[#1a1a1a]">
                                <div className="p-6 flex items-center justify-center">
                                    <span className="text-white text-[15px] font-bold">Over all Scores</span>
                                </div>
                                <div className="p-6 border-l border-[#222222] flex items-center justify-center">
                                    <span className="text-white text-[15px] font-bold">{comparisonResults.originalScore}/10</span>
                                </div>
                                <div className="p-6 border-l border-[#222222] flex items-center justify-center">
                                    <span className="text-white text-[15px] font-bold">{comparisonResults.userScore}/10</span>
                                </div>
                            </div>
                        </div>

                        {/* Verdict */}
                        <div className="mt-8 px-2">
                            <h3 className="text-white text-[18px] font-semibold mb-4">Over All Verdict</h3>
                            <p className="text-[#a1a1aa] text-[14px] leading-relaxed">
                                {comparisonResults.verdict}
                            </p>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
