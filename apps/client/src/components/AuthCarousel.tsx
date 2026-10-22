import { useState, useEffect } from 'react';
import { authCarouselSlides } from '@/assets/auth/slides';

export function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Preload all slide images so browser doesn't flash or fail loading slide 4
  useEffect(() => {
    authCarouselSlides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  // Timer resets whenever user clicks or slide changes
  useEffect(() => {
    if (authCarouselSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % authCarouselSlides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentSlide = authCarouselSlides[currentIndex] || authCarouselSlides[0];

  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full w-full bg-[#160b13] overflow-hidden select-none">
      {/* Background radial and gradient tones matching Figma */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 15% 20%, rgba(94, 25, 60, 0.45) 0%, rgba(20, 10, 18, 0.95) 70%, #0d060a 100%)'
        }}
      />

      {/* Top Slide Text - Lowered & Indented further from Left */}
      <div className="relative z-10 pt-20 xl:pt-24 pl-20 xl:pl-28 pr-8 max-w-[620px] mx-auto w-full text-left flex flex-col items-start">
        <h2 className="text-[30px] xl:text-[35px] font-normal text-[#F3EFE0] tracking-[-0.03em] leading-[1.2] font-serif mb-2.5 transition-all duration-500 ease-in-out">
          {currentSlide.title}
        </h2>
        <p className="text-[#A89F9E] text-[14px] xl:text-[15px] leading-relaxed font-normal text-left transition-all duration-500 ease-in-out max-w-[440px]">
          {currentSlide.description}
        </p>
      </div>

      {/* Center Image Canvas / Stacked Crossfade */}
      <div className="relative z-10 flex-1 flex items-end justify-center px-6 overflow-hidden mt-6">
        <div className="relative w-full max-w-[560px] h-[520px] flex items-end justify-center">
          {authCarouselSlides.map((slide, idx) => (
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.title}
              className={`absolute bottom-0 max-w-full max-h-full object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] transition-all duration-700 ease-in-out ${
                idx === currentIndex
                  ? 'opacity-100 scale-100 pointer-events-auto z-10'
                  : 'opacity-0 scale-95 pointer-events-none z-0'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Carousel Indicator Dots */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-10 pt-4">
        {authCarouselSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
              idx === currentIndex
                ? 'w-6 bg-white'
                : 'w-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
