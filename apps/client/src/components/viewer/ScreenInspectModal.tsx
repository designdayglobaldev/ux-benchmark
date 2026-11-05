import React from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import floatIcon from '@/assets/floaticon.svg';
import type { Region } from '@/components/RegionSelector';
import RevolutScreenshot from "@/assets/Revolut.png";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ScreenInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAiLoading: boolean;
  aiResponse: string | null;
  lastSubmittedPrompt: string | null;
  lastSubmittedRegion: Region | null;
  activeScreenImageUrl?: string;
  loadingMessage: string;
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedRegion: Region | null;
  onClearRegion: () => void;
}

export function ScreenInspectModal({
  isOpen,
  onClose,
  isAiLoading,
  aiResponse,
  lastSubmittedPrompt,
  lastSubmittedRegion,
  activeScreenImageUrl,
  loadingMessage,
  prompt,
  onPromptChange,
  onSubmit,
  selectedRegion,
  onClearRegion
}: ScreenInspectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm px-4 pt-10">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="mb-4 bg-[#27272a] hover:bg-[#3f3f46] text-white/70 hover:text-white px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-2 border border-white/10"
      >
        Close chat ✕
      </button>

      {/* Background Glow */}
      <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[#4E6BFF]/40 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Modal Container */}
      <div className="w-full max-w-[800px] h-[75vh] min-h-[500px] bg-[#141414] rounded-t-[24px] overflow-hidden flex flex-col border border-[#323232] border-b-0 shadow-[0_0_120px_rgba(0,0,0,0.5)] relative z-10">
        {/* Subtle Top Glow */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#4E6BFF] to-transparent opacity-50" />
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-10 pb-6 flex flex-col gap-8 scrollbar-hide">
          {/* User Message */}
          <div className="flex flex-col items-end gap-3 self-end max-w-[80%]">
            {lastSubmittedRegion && (() => {
              const maxDim = Math.max(lastSubmittedRegion.width, lastSubmittedRegion.height);
              const scale = 120 / maxDim;
              const thumbWidth = lastSubmittedRegion.width * scale;
              const thumbHeight = lastSubmittedRegion.height * scale;
              return (
                <div className="bg-white rounded-[12px] p-2 shadow-sm flex items-center justify-center">
                  <div className="w-[120px] h-[120px] rounded-[6px] overflow-hidden flex items-center justify-center bg-white">
                    <div 
                      className="bg-no-repeat bg-left-top shrink-0"
                      style={{ 
                        width: thumbWidth, 
                        height: thumbHeight,
                        backgroundImage: `url(${activeScreenImageUrl || RevolutScreenshot})`,
                        backgroundSize: `${243.71 * scale}px ${544 * scale}px`,
                        backgroundPosition: `-${lastSubmittedRegion.x * scale}px -${lastSubmittedRegion.y * scale}px`
                      }}
                    />
                  </div>
                </div>
              );
            })()}
            <div className="bg-[#1e1e1e] text-white/90 px-5 py-3.5 rounded-[16px] rounded-tr-sm text-[15px] leading-relaxed border border-white/5 font-medium shadow-sm">
              {lastSubmittedPrompt}
            </div>
          </div>

          {/* AI Message */}
          <div className="flex items-start gap-5 max-w-[95%]">
            <div className={`w-8 h-8 shrink-0 mt-1 flex items-center justify-center ${isAiLoading ? '' : 'rounded-full bg-[#1e1e1e] border border-white/10'}`}>
              {isAiLoading ? (
                <ThinkingOrb state="solving" size={20} speed={1.10} />
              ) : (
                <img src={floatIcon} className="w-5 h-5" alt="AI" />
              )}
            </div>
            <div className="flex-1">
              {isAiLoading ? (
                <div className="flex items-center gap-4 text-zinc-400 py-1.5">
                  <span className="text-[15px] font-medium animate-pulse">{loadingMessage}</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none prose-p:leading-[1.7] prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-headings:text-zinc-200 prose-a:text-blue-400 text-zinc-200 text-[15px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse || ''}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Input Area */}
        <div className="p-6 bg-transparent mt-auto flex justify-center pb-8">
          <div className={`w-[425px] min-h-[104px] relative rounded-[12px] ${selectedRegion ? 'bg-gradient-to-r from-[#4E6BFF] to-[#FF8A4C] p-[1px]' : ''}`}>
            <div className={`w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col ${!selectedRegion ? 'border border-[#434343]' : ''}`}>
              <form onSubmit={onSubmit} className="flex flex-col h-full">
                <div className="flex flex-col justify-between p-3 h-full relative bg-transparent">
                  {selectedRegion && (() => {
                    const maxDim = Math.max(selectedRegion.width, selectedRegion.height);
                    const scale = 40 / maxDim;
                    const thumbWidth = selectedRegion.width * scale;
                    const thumbHeight = selectedRegion.height * scale;
                    
                    return (
                      <div className="mb-2 pb-2 border-b border-white/5 flex">
                        <div className="relative group shrink-0">
                          <div className="w-10 h-10 bg-[#1e1e1e] border border-white/10 rounded-[6px] flex items-center justify-center overflow-hidden shadow-sm">
                            <div 
                              className="bg-no-repeat bg-left-top shrink-0"
                              style={{ 
                                width: thumbWidth, 
                                height: thumbHeight,
                                backgroundImage: `url(${activeScreenImageUrl || RevolutScreenshot})`,
                                backgroundSize: `${243.71 * scale}px ${544 * scale}px`,
                                backgroundPosition: `-${selectedRegion.x * scale}px -${selectedRegion.y * scale}px`
                              }}
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={onClearRegion} 
                            className="absolute -top-1.5 -right-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center text-white"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="flex gap-2 w-full flex-1">
                    <textarea
                      value={prompt}
                      onChange={(e) => onPromptChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onSubmit(e as any);
                        }
                      }}
                      placeholder="Ask me anything"
                      className="w-full bg-transparent border-none text-white placeholder:text-[#525252] outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 resize-none flex-1 text-[14px] scrollbar-hide"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-2">
                    <div className="w-[124px]"></div>
                    <button 
                      type="submit" 
                      disabled={!prompt.trim() || isAiLoading}
                      className="shrink-0 h-[28px] w-[28px] rounded-[4.31px] bg-gradient-to-b from-[#FFFFFF] to-[#C6C6C6] shadow-[inset_0.5px_0.5px_0.5px_rgba(99,99,99,0.56)] text-black flex items-center justify-center transition-opacity opacity-50 hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      {isAiLoading ? (
                        <ThinkingOrb state="solving" size={64} speed={1.10} />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

