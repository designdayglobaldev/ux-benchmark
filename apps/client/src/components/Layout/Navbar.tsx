import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black text-white">
      <div className="flex h-[72px] items-center px-6 md:px-12 justify-between w-full relative">
        {/* Left side: Logo */}
        <div className="flex items-center gap-12">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#132A60] via-[#2453B2] to-[#4084F4] shadow-inner overflow-hidden relative">
              {/* Approximate logo shape */}
              <div className="absolute bottom-0 w-full h-[55%] bg-white rounded-t-[40%] flex items-start justify-center">
                <div className="w-2 h-2 bg-black rounded-full mt-1 opacity-0"></div>
              </div>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white absolute top-[25%] z-10" fill="currentColor">
                <path d="M12 2C12 2 12 10 20 10C12 10 12 18 12 18C12 18 12 10 4 10C12 10 12 2 12 2Z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[22px] font-light tracking-wide text-[#EAEAEA] leading-none">Benchmar<span className="font-normal">X</span></span>
              <span className="text-[13px] text-[#888888] font-light leading-tight mt-0.5">by Designday</span>
            </div>
          </a>
        </div>

        {/* Center: Nav links */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-8 text-[15px] font-medium">
          <a href="#" className="text-[#EAEAEA] hover:text-white transition-colors">Benchmark library</a>
          <a href="#" className="text-[#EAEAEA] hover:text-white transition-colors">UX ROI calculator</a>
          <a href="#" className="text-[#EAEAEA] hover:text-white transition-colors">AI design system</a>
        </nav>

        {/* Right side: About & Button */}
        <div className="flex items-center gap-8">
          <a href="#" className="text-[15px] font-medium text-[#EAEAEA] hover:text-white transition-colors">About</a>
          <Button variant="outline" className="rounded-full bg-transparent border-[#333333] text-[#EAEAEA] hover:bg-[#222222] hover:text-white h-10 px-5 text-[15px] font-medium">
            <Calendar className="mr-2 h-4 w-4" />
            Book a Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
