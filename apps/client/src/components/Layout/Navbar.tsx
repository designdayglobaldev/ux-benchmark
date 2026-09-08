import { Bell, LogOut } from "lucide-react";
import { SearchModal } from "@/components/SearchModal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "@/assets/Logo.png";

export function Navbar() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black text-white">
      <div className="flex h-[72px] items-center px-6 md:px-12 justify-between w-full relative">
        {/* Left side: Logo */}
        <div className="flex items-center gap-12">
          <a href="/" className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-10 w-auto object-contain" />
          </a>
        </div>

        {/* Center: Nav Links */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-8">
          <a 
            href="/" 
            className={location.pathname === '/' ? "text-black bg-white px-5 py-1.5 rounded-full text-[14px] font-medium transition-colors" : "text-[#A1A1A1] hover:text-white text-[14px] font-medium transition-colors"}
          >
            Library
          </a>
          <a 
            href="/flows" 
            className={location.pathname === '/flows' ? "text-black bg-white px-5 py-1.5 rounded-full text-[14px] font-medium transition-colors" : "text-[#A1A1A1] hover:text-white text-[14px] font-medium transition-colors"}
          >
            Flows
          </a>
          <a 
            href="/benchmark" 
            className={location.pathname === '/benchmark' ? "text-black bg-white px-5 py-1.5 rounded-full text-[14px] font-medium transition-colors" : "text-[#A1A1A1] hover:text-white text-[14px] font-medium transition-colors"}
          >
            Benchmark
          </a>
        </div>

        {/* Right side: Search and User Actions */}
        <div className="flex items-center gap-5">
          <div className="hidden lg:block w-[240px]">
            <SearchModal />
          </div>
          {!isLoading && user ? (
            <div className="flex items-center gap-3">
              <button className="text-[#A1A1A1] hover:text-white transition-colors relative">
                <Bell className="h-[22px] w-[22px]" />
              </button>
              <button className="h-[34px] w-[34px] rounded-full bg-[#1F4932] flex items-center justify-center text-[#93D7B1] text-[15px] font-medium hover:opacity-90 transition-opacity">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </button>
              <button onClick={signOut} className="text-[#A1A1A1] hover:text-white transition-colors" title="Sign Out">
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <Button 
              variant="default" 
              className="bg-[#4084F4] text-white hover:bg-[#3070D0] rounded-full px-8 h-10 font-medium"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
