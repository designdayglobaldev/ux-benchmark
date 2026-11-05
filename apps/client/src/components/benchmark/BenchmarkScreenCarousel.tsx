import { OptimizedImage } from '@/components/ui/optimized-image';
import { ScreenActionOverlay } from '@/components/ScreenActionOverlay';

export interface BenchmarkScreenItem {
  id?: string;
  name: string;
  imageUrl: string;
  opacity?: string;
}

interface BenchmarkScreenCarouselProps {
  screens: BenchmarkScreenItem[];
}

export function BenchmarkScreenCarousel({ screens }: BenchmarkScreenCarouselProps) {
  if (!screens || screens.length === 0) return null;

  return (
    <div className="w-full pb-8 mb-8 border-b border-[#2a2a2a] overflow-x-auto custom-scrollbar flex gap-6">
      {screens.map((app, idx) => (
        <div key={idx} className="flex flex-col gap-3 shrink-0">
          <span className="text-[#888] text-[13px] font-medium tracking-wide px-1">
            {app.name}
          </span>
          <div className="h-[400px] aspect-[230/500] rounded-[16px] overflow-hidden border border-[#333] shadow-lg relative bg-black flex items-center justify-center group">
            <OptimizedImage
              src={app.imageUrl}
              className={`w-full h-full object-cover grayscale ${app.opacity || 'opacity-50'} group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300`}
              alt={app.name}
              optimizationWidth={400}
              priority={idx < 2}
            />
            {/* Top-Right Action Overlay (Save to Collection & Copy) */}
            <ScreenActionOverlay
              screenId={app.id || `bench-${idx}`}
              imageUrl={app.imageUrl}
              screenName={app.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
