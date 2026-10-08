import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BoardScreenViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export function BoardScreenViewer({ imageUrl, onClose }: BoardScreenViewerProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col">
      {/* Header Bar */}
      <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-medium">Screen Viewer</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="relative flex-1 w-full h-full">
        {/* Base Image */}
        <div className="absolute inset-0 flex items-center justify-center p-10 z-0">
          <img 
            src={imageUrl} 
            alt="Screen" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
          />
        </div>
      </div>
    </div>
  );
}
