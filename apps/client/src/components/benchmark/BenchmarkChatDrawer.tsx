import React from 'react';
import { X, ArrowUp, Loader2, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThinkingOrb } from 'thinking-orbs';
import floatIcon from '@/assets/floaticon.svg';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BenchmarkChatDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onChatSubmit: () => void;
  isChatting: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function BenchmarkChatDrawer({
  isOpen,
  onOpen,
  onClose,
  chatMessages,
  chatInput,
  onChatInputChange,
  onChatSubmit,
  isChatting,
  messagesEndRef,
}: BenchmarkChatDrawerProps) {
  return (
    <>
      {/* Chat Modal (Bottom Sheet) */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm px-4 pt-10">
          {/* Close Button */}
          <button 
            onClick={onClose}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Modal Input Area */}
            <div className="p-6 bg-transparent mt-auto flex justify-center pb-8">
              <div className="w-[425px] min-h-[104px] relative rounded-[12px]">
                <div className="w-full h-full bg-[#141414] rounded-[12px] overflow-hidden flex flex-col border border-[#434343]">
                  <form onSubmit={(e) => { e.preventDefault(); onChatSubmit(); }} className="flex flex-col h-full">
                    <div className="flex flex-col justify-between p-3 h-full relative bg-transparent">
                      <textarea 
                        value={chatInput}
                        onChange={(e) => onChatInputChange(e.target.value)}
                        placeholder="Ask me anything"
                        className="w-full bg-transparent text-white/90 text-[14px] resize-none outline-none placeholder:text-[#666] min-h-[40px] custom-scrollbar pb-8"
                        disabled={isChatting}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onChatSubmit();
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
      {!isOpen && (
        <div className="fixed bottom-10 left-[calc(50vw+170px)] -translate-x-1/2 z-[300] w-[600px] flex flex-col items-center pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative w-full flex flex-col items-center pointer-events-auto">
            {/* Expand Chat Button (if history exists) */}
            {chatMessages.length > 1 && (
              <button 
                onClick={onOpen}
                className="mb-3 px-4 py-1.5 bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-full text-[#0099FF] text-[12px] font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-lg"
              >
                <MessageSquare size={14} />
                View Chat History
              </button>
            )}
            
            {/* Floating Input Bar */}
            <div className="w-full bg-[#1e1e1e]/90 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-white/20 transition-colors">
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  onChatSubmit(); 
                  onOpen(); 
                }} 
                className="flex gap-2 relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]">
                  <MessageSquare size={18} />
                </div>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
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
    </>
  );
}
