import { useState, useEffect } from 'react';
import { authCarouselSlides } from '@/assets/auth/slides';
import authFrame from '@/assets/auth/authframe.png';

export function AuthCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Preload frame and slide images
  useEffect(() => {
    [authFrame, ...authCarouselSlides.map((s) => s.image)].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Timer for cycling slides
  useEffect(() => {
    if (authCarouselSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % authCarouselSlides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentSlide = authCarouselSlides[currentIndex] || authCarouselSlides[0];

  return (
    <div className="relative hidden lg:block h-full w-full overflow-hidden select-none">
      {/* 1. authframe.png as the Entire Background Frame */}
      <img
        src={authFrame}
        alt="Auth Frame"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      {/* 2. Top Slide Text - Lowered & Perfectly Balanced Left Space */}
      <div className="relative z-20 pt-20 xl:pt-24 pl-30 xl:pl-36 pr-8 max-w-[600px]">
        <h2 className="text-[26px] xl:text-[30px] font-normal text-[#F3EFE0] tracking-[-0.03em] leading-[1.2] font-serif mb-2.5 transition-all duration-500 ease-in-out">
          {currentSlide.title}
        </h2>
        <p className="text-[#A89F9E] text-[13.5px] xl:text-[14px] leading-relaxed font-normal transition-all duration-500 ease-in-out max-w-[420px]">
          {currentSlide.description}
        </p>
      </div>

      {/* 3. The 4 Images cycling cleanly inside the frame */}
      <div className="absolute inset-x-0 bottom-14 top-40 z-10 flex items-end justify-center px-8 pointer-events-none">
        <div className="relative w-full max-w-[560px] h-full flex items-end justify-center">
          {authCarouselSlides.map((slide, idx) => (
            <img
              key={slide.id}
              src={slide.image}
              alt={slide.title}
              className={`max-w-full max-h-full object-contain object-bottom transition-all duration-700 ease-in-out ${
                slide.imageClassName || ''
              } ${
                idx === currentIndex
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none absolute'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4. Bottom Carousel Indicator Dots */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2">
        {authCarouselSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer shadow-sm ${
              idx === currentIndex
                ? 'w-6 bg-white'
                : 'w-1.5 bg-white/35 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
