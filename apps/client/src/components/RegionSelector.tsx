import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
  onSelectRegion: (region: Region | null) => void;
  selectedRegion?: Region | null;
  hideInstructions?: boolean;
}

export function RegionSelector({ onClose, onSelectRegion, selectedRegion, hideInstructions }: RegionSelectorProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<Region | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!selectedRegion && hasConfirmed) {
      setSelectionBox(null);
      setStartPoint(null);
      setCurrentPoint(null);
      setHasConfirmed(false);
    }
  }, [selectedRegion, hasConfirmed]);

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
    setHasConfirmed(false);
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
      const region = { x, y, width, height };
      setSelectionBox(region);
      // Removed auto-select here, waits for checkmark click
    } else {
      setStartPoint(null);
      setCurrentPoint(null);
      setSelectionBox(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: 'tl' | 'tr' | 'bl' | 'br') => {
    e.stopPropagation();
    if (!selectionBox) return;

    let fixedPoint: Point;
    let movingPoint: Point;

    const { x, y, width, height } = selectionBox;

    switch (handle) {
      case 'tl':
        fixedPoint = { x: x + width, y: y + height };
        movingPoint = { x, y };
        break;
      case 'tr':
        fixedPoint = { x, y: y + height };
        movingPoint = { x: x + width, y };
        break;
      case 'bl':
        fixedPoint = { x: x + width, y };
        movingPoint = { x, y: y + height };
        break;
      case 'br':
        fixedPoint = { x, y };
        movingPoint = { x: x + width, y: y + height };
        break;
    }

    setStartPoint(fixedPoint);
    setCurrentPoint(movingPoint);
    setSelectionBox(null);
    setIsDrawing(true);
    setHasConfirmed(false);
    onSelectRegion(null);
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

      {!isDrawing && !selectionBox && !hideInstructions && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white flex flex-col items-center justify-center gap-3 pointer-events-none w-[85%] max-w-[200px] text-center">
            <img src="/inspect.svg" className="w-5 h-5 text-white" alt="Inspect" />
            <span className="text-[13px] font-medium leading-snug">
                Drag an area of the screen<br/>to inspect
            </span>
        </div>
      )}
      
      {currentBox && (
        <div
          className={`absolute border-2 border-dashed border-[#4E6BFF] bg-transparent ${!isDrawing ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            left: currentBox.x,
            top: currentBox.y,
            width: currentBox.width,
            height: currentBox.height,
          }}
        >
          {/* Top Left Handle */}
          <div 
            className="absolute -top-[5px] -left-[5px] w-2.5 h-2.5 bg-white border border-[#4E6BFF] cursor-nwse-resize pointer-events-auto" 
            onMouseDown={(e) => handleResizeStart(e, 'tl')}
            onTouchStart={(e) => handleResizeStart(e, 'tl')}
          />
          {/* Top Right Handle */}
          <div 
            className="absolute -top-[5px] -right-[5px] w-2.5 h-2.5 bg-white border border-[#4E6BFF] cursor-nesw-resize pointer-events-auto"
            onMouseDown={(e) => handleResizeStart(e, 'tr')}
            onTouchStart={(e) => handleResizeStart(e, 'tr')}
          />
          {/* Bottom Left Handle */}
          <div 
            className="absolute -bottom-[5px] -left-[5px] w-2.5 h-2.5 bg-white border border-[#4E6BFF] cursor-nesw-resize pointer-events-auto"
            onMouseDown={(e) => handleResizeStart(e, 'bl')}
            onTouchStart={(e) => handleResizeStart(e, 'bl')}
          />
          {/* Bottom Right Handle */}
          <div 
            className="absolute -bottom-[5px] -right-[5px] w-2.5 h-2.5 bg-white border border-[#4E6BFF] cursor-nwse-resize pointer-events-auto"
            onMouseDown={(e) => handleResizeStart(e, 'br')}
            onTouchStart={(e) => handleResizeStart(e, 'br')}
          />
          
          {/* Checkmark Button */}
          {!isDrawing && !hasConfirmed && (
            <button
                className="absolute -bottom-[6px] -right-[6px] translate-y-full flex items-center justify-center w-6 h-6 bg-[#4E6BFF] rounded-[4px] hover:bg-[#3d55d1] transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegion(currentBox);
                    setHasConfirmed(true);
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
