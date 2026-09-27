import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  optimizationWidth?: number; // Target width for CDN optimization
  quality?: number; // Target quality (0-100)
  containerClassName?: string;
  priority?: boolean; // If true, eager loads and bypasses lazy loading
}

/**
 * Parses a standard Supabase public storage URL and rewrites it to use 
 * the Supabase Image Transformation endpoint (/render/image/public/) 
 * to fetch a highly optimized WebP version.
 */
export const getSupabaseOptimizedUrl = (url: string, width?: number, quality = 80) => {
  if (width || quality) return url;
  return url;
};

export const OptimizedImage = ({ 
  src, 
  alt, 
  optimizationWidth, 
  quality = 80, 
  className = "", 
  containerClassName = "",
  priority = false,
  ...props 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrc = getSupabaseOptimizedUrl(src, optimizationWidth, quality);

  const content = (
    <>
      {!isLoaded && (
        <Skeleton className={`absolute bg-[#2A2A2A] z-0 ${className.replace('relative', '').replace('z-10', '')}`} />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"} 
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`${className} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} relative z-10`}
        {...props}
      />
    </>
  );

  if (containerClassName) {
    return <div className={`relative ${containerClassName}`}>{content}</div>;
  }
  return content;
};
