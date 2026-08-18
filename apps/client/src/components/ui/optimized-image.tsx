import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  optimizationWidth?: number; // Target width for CDN optimization
  quality?: number; // Target quality (0-100)
  containerClassName?: string;
}

/**
 * Parses a standard Supabase public storage URL and rewrites it to use 
 * the Supabase Image Transformation endpoint (/render/image/public/) 
 * to fetch a highly optimized WebP version.
 */
export const getSupabaseOptimizedUrl = (url: string, width?: number, quality = 80) => {
  if (!url) return url;
  
  // Only intercept valid Supabase storage URLs
  if (url.includes('/storage/v1/object/public/')) {
    const optimizedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    params.append('quality', quality.toString());
    // Force resize=contain to prevent Supabase from square-cropping the image
    params.append('resize', 'contain');
    
    return `${optimizedUrl}?${params.toString()}`;
  }
  
  return url;
};

export const OptimizedImage = ({ 
  src, 
  alt, 
  optimizationWidth, 
  quality = 80, 
  className = "", 
  containerClassName = "",
  ...props 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrc = getSupabaseOptimizedUrl(src, optimizationWidth, quality);

  return (
    <>
      {!isLoaded && (
        <Skeleton className={`absolute bg-[#2A2A2A] z-0 ${className.replace('relative', '').replace('z-10', '')}`} />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy" // Defers loading until near viewport
        decoding="async" // Decodes off the main thread
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </>
  );
};
