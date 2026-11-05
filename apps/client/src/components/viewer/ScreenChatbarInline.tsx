import React from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import type { Region } from '@/components/RegionSelector';
import RevolutScreenshot from "@/assets/Revolut.png";

interface ScreenChatbarInlineProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isInspectMode: boolean;
  onToggleInspect: () => void;
  selectedRegion: Region | null;
  onClearRegion: () => void;
  isAiLoading: boolean;
  activeScreenImageUrl?: string;
}

export function ScreenChatbarInline({
  prompt,
  onPromptChange,
  onSubmit,
  isInspectMode,
  onToggleInspect,
  selectedRegion,
  onClearRegion,
  isAiLoading,
  activeScreenImageUrl
}: ScreenChatbarInlineProps) {
  return (
    <div className={`w-[425px] min-h-[104px] mt-[15px] relative rounded-[12px] ${(isInspectMode || selectedRegion) ? 'bg-gradient-to-r from-[#4E6BFF] to-[#FF8A4C] p-[1px] z-50' : 'z-50'}`}>
      <div className={`w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col ${!(isInspectMode || selectedRegion) ? 'border border-[#434343]' : ''}`}>
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
              <button 
                type="button"
                onClick={onToggleInspect}
                className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-[6px] border transition-colors ${
                  (isInspectMode || selectedRegion) ? 'bg-[#1a224a] border-[#2b3a8b] text-white' : 'bg-transparent border-[#323232] text-[#BDBDBD] hover:text-white hover:bg-white/5'
                } text-[13px] font-medium`}
              >
                <img src="/inspect.svg" alt="Inspect" className="w-3.5 h-3.5" />
                Inspect Screen
              </button>

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
  );
}

