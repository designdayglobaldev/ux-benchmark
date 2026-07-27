import { Bell } from "lucide-react";
import { SearchModal } from "@/components/SearchModal";

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

        {/* Center: Searchbar */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center w-[40%] max-w-[560px]">
          <SearchModal />
        </div>

        {/* Right side: Notifications & Profile */}
        <div className="flex items-center gap-5">
          <button className="text-[#A1A1A1] hover:text-white transition-colors relative">
            <Bell className="h-[22px] w-[22px]" />
          </button>
          <button className="h-[34px] w-[34px] rounded-full bg-[#1F4932] flex items-center justify-center text-[#93D7B1] text-[15px] font-medium hover:opacity-90 transition-opacity">
            S
          </button>
        </div>
      </div>
    </header>
  );
}
