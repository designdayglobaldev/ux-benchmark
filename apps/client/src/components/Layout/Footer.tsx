import designdayLogo from "@/assets/Designday_logo1.png";
import { useLocation } from "react-router-dom";

export function Footer() {
  const location = useLocation();
  const isScreensPage = location.pathname.includes('/screens');

  if (isScreensPage) {
    return null;
  }

  return (
    <footer className="w-full bg-[#161616] text-[#EAEAEA] py-6 pl-[72px] pr-6 md:pl-[144px] md:pr-12 border-t border-[#222222]">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Column 1: Branding & Description */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-2.5">
              {/* Designday Logo */}
              <img src={designdayLogo} alt="Designday" className="h-6 object-contain" />
            </div>
            
            <p className="text-[#888888] text-[14px] leading-[1.6] max-w-[360px]">
              Built by Designday — A suite of AI-powered tools,
              frameworks, and strategic solutions helping businesses
              make smarter product decisions, build better digital
              experiences, and accelerate growth.
            </p>
          </div>

          {/* Column 2: Solutions */}
          <div className="md:col-span-3 flex flex-col gap-5 mt-3">
            <h4 className="text-[#666666] text-[13px] font-medium tracking-wider">SOLUTIONS</h4>
            <div className="flex flex-col gap-3.5">
              <a href="#" className="text-[#A1A1A1] hover:text-white transition-colors text-[14px]">UX ROI Calculator</a>
              <a href="#" className="text-[#A1A1A1] hover:text-white transition-colors text-[14px]">UX Benchmark Library</a>
              <a href="#" className="text-[#A1A1A1] hover:text-white transition-colors text-[14px]">AI Design System</a>
            </div>
          </div>

          {/* Column 3: Information */}
          <div className="md:col-span-4 flex flex-col gap-5 mt-3">
            <h4 className="text-[#666666] text-[13px] font-medium tracking-wider">INFORMATION</h4>
            <div className="flex flex-col gap-3.5">
              <a href="#" className="text-[#A1A1A1] hover:text-white transition-colors text-[14px]">Terms of Service</a>
              <a href="#" className="text-[#A1A1A1] hover:text-white transition-colors text-[14px]">Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 flex items-center justify-between w-full">
          <div className="w-1/3 text-left">
            <p className="text-[#888888] text-[13px]">
              © 2026 Designday Software Solutions Pvt Ltd
            </p>
          </div>
          
          <div className="w-1/3 flex justify-center">
          </div>

          <div className="w-1/3"></div>
        </div>
      </div>
    </footer>
  );
}
