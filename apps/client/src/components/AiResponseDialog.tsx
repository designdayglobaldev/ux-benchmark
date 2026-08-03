import { X, Sparkles } from 'lucide-react';

interface AiResponseDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  response: string | null;
  onClose: () => void;
}

export function AiResponseDialog({ isOpen, isLoading, response, onClose }: AiResponseDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 -right-[300px] w-[280px] h-[430px] sm:h-[500px] bg-zinc-900/95 backdrop-blur-md border border-zinc-800 p-4 shadow-2xl flex flex-col z-[150] rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 text-white font-medium">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>AI Insight</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-sm text-zinc-300 leading-relaxed">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p>Analyzing UI...</p>
          </div>
        ) : response ? (
          <div className="whitespace-pre-wrap">{response}</div>
        ) : (
          <p className="text-zinc-500 italic">No response received.</p>
        )}
      </div>
    </div>
  );
}
