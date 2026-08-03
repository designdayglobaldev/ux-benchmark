import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RegionSelectorProps {
  onClose: () => void;
  onSubmit: (region: Region, prompt: string) => void;
}

export function RegionSelector({ onClose, onSubmit }: RegionSelectorProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<Region | null>(null);
  const [prompt, setPrompt] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!overlayRef.current) {
      if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
    const rect = overlayRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (selectionBox) return;
    setIsDrawing(true);
    const pos = getCoordinates(e);
    setStartPoint(pos);
    setCurrentPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setCurrentPoint(getCoordinates(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) return;
    setIsDrawing(false);

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    if (width > 20 && height > 20) {
      setSelectionBox({ x, y, width, height });
    } else {
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectionBox && prompt.trim()) {
      onSubmit(selectionBox, prompt);
      setSelectionBox(null);
      setStartPoint(null);
      setCurrentPoint(null);
      setPrompt('');
      onClose();
    }
  };

  const currentBox = isDrawing && startPoint && currentPoint
    ? {
        x: Math.min(startPoint.x, currentPoint.x),
        y: Math.min(startPoint.y, currentPoint.y),
        width: Math.abs(currentPoint.x - startPoint.x),
        height: Math.abs(currentPoint.y - startPoint.y),
      }
    : selectionBox;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-50 cursor-crosshair bg-black/40 select-none rounded-[16px] overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <Button
        variant="outline"
        size="icon"
        className="absolute top-3 right-3 z-[100] bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700 rounded-full h-8 w-8 shadow-2xl pointer-events-auto"
        onClick={(e) => {
            e.stopPropagation();
            onClose();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <X className="h-4 w-4" />
      </Button>

      {!isDrawing && !selectionBox && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-zinc-900/90 border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl flex flex-col items-center justify-center gap-2 pointer-events-none animate-pulse w-[85%] max-w-[200px] text-center text-sm">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span className="font-medium">Inspect Mode</span>
          </div>
          <span className="text-zinc-300 text-xs">Click & drag anywhere</span>
        </div>
      )}
      
      {currentBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: currentBox.x,
            top: currentBox.y,
            width: currentBox.width,
            height: currentBox.height,
          }}
        />
      )}

      {selectionBox && (
        <form 
          onSubmit={handleSubmit}
          className="absolute bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl flex items-center gap-2 pointer-events-auto z-[90]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: Math.min(selectionBox.y + selectionBox.height + 12, (overlayRef.current?.clientHeight || 500) - 60),
            width: '90%',
            maxWidth: '280px'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Input
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI about this area..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus-visible:ring-blue-500 h-10 min-w-0"
          />
          <Button type="submit" size="icon" className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white" disabled={!prompt.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
