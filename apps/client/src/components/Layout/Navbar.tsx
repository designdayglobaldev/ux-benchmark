import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Bell, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Layers, 
  Sparkles, 
  FolderKanban,
  Bookmark,
  Globe
} from "lucide-react";
import { SearchModal } from "@/components/SearchModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUpgradeModal } from "@/contexts/UpgradeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Logo from "@/assets/Logo.png";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Derive initial for avatar (matching design letter or user initial)
  const userInitial = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "S";

  const isFlowsActive = location.pathname.startsWith("/flows");
  const isBenchmarkActive = location.pathname.startsWith("/benchmark");
  const isLibraryActive = 
    location.pathname === "/" || 
    location.pathname === "/browse" ||
    location.pathname.startsWith("/app/");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black text-white h-[64px]">
      <div className="flex h-full items-center px-4 sm:px-6 md:px-8 justify-between w-full mx-auto gap-4">
        
        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-5 lg:gap-7 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={Logo} alt="Logo" className="h-7 sm:h-8 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 lg:gap-6 h-[64px]">
            {/* App Library */}
            <Link
              to="/"
              className={`h-full flex items-center relative text-[14px] font-medium transition-colors ${
                isLibraryActive
                  ? "text-white"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              App Library
              {isLibraryActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}
            </Link>

            {/* Flows */}
            <Link
              to="/flows"
              className={`h-full flex items-center relative text-[14px] font-medium transition-colors ${
                isFlowsActive
                  ? "text-white"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              Flows
              {isFlowsActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}
            </Link>

            {/* Benchmark */}
            <Link
              to="/benchmark"
              className={`h-full flex items-center relative text-[14px] font-medium transition-colors ${
                isBenchmarkActive
                  ? "text-white"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              Benchmark
              {isBenchmarkActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}
            </Link>

            {/* Design Agent */}
            <button
              type="button"
              onClick={openUpgradeModal}
              className="h-full flex items-center gap-1.5 text-[14px] font-medium text-[#888888] hover:text-[#CCCCCC] transition-colors cursor-pointer"
            >
              <span>Design Agent</span>
              <span className="bg-gradient-to-r from-[#FF3366] to-[#9933FF] text-white px-1.5 py-[2px] rounded-full text-[8px] font-bold tracking-wider uppercase shadow-md shadow-purple-500/25 border border-white/10 leading-none shrink-0 -translate-y-[1px]">
                SOON
              </span>
            </button>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-[380px] lg:max-w-[460px] mx-2 lg:mx-6 min-w-[180px]">
          <SearchModal />
        </div>

        {/* Right Side: Bookmark, Globe, Bell, Upgrade Button & Profile Dropdown */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Bookmark / Collections */}
          <button 
            type="button"
            onClick={() => navigate("/collections")}
            aria-label="Collections"
            className={cn(
              "text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer",
              (location.pathname === "/collections" || location.pathname === "/workspaces") && "text-white"
            )}
          >
            <Bookmark className="w-[18px] h-[18px]" />
          </button>

          {/* Globe */}
          <button 
            type="button"
            aria-label="Language / Global"
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer hidden sm:block"
          >
            <Globe className="w-[18px] h-[18px]" />
          </button>

          {/* Notification Bell */}
          <button 
            type="button"
            aria-label="Notifications"
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer"
          >
            <Bell className="w-[19px] h-[19px]" />
          </button>

          {/* Upgrade Button */}
          <button
            type="button"
            onClick={openUpgradeModal}
            className="flex items-center justify-center bg-gradient-to-r from-[#443627] via-[#2d252f] to-[#2b2236] border border-white/10 hover:border-white/20 text-white font-medium text-[13px] px-5 py-1.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Upgrade
          </button>

          {/* Profile Icon Dropdown */}
          <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="User Profile Menu"
                className="w-[34px] h-[34px] rounded-full bg-[#3d2b1f] border border-[#6b4c37]/50 text-[#d4a373] flex items-center justify-center font-medium text-[14px] hover:opacity-90 transition-opacity cursor-pointer shadow-sm focus:outline-none"
              >
                {userInitial}
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-[230px] p-2 bg-[#141414] border border-[#262626] rounded-xl text-white shadow-2xl z-50"
            >
              {/* User Info Header */}
              <div className="px-3 py-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3d2b1f] text-[#d4a373] flex items-center justify-center font-medium text-xs border border-[#6b4c37]/50 shrink-0">
                  {userInitial}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">
                    {user?.email || "Guest User"}
                  </p>
                  <span className="text-[11px] text-[#888888]">
                    {user ? "Free Plan" : "Not signed in"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#222222] my-1" />

              {/* Navigation Items */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate("/workspaces");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#CCCCCC] hover:text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                >
                  <Layers className="w-4 h-4 text-[#888888]" />
                  <span>Workspaces</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate("/workspaces");
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#CCCCCC] hover:text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                >
                  <FolderKanban className="w-4 h-4 text-[#888888]" />
                  <span>Saved Boards</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    openUpgradeModal();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#CCCCCC] hover:text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                >
                  <Sparkles className="w-4 h-4 text-[#d4a373]" />
                  <span>Upgrade to PRO</span>
                </button>
              </div>

              <div className="h-px bg-[#222222] my-1" />

              {/* Auth Action */}
              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await signOut();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#FF5555] hover:bg-[#261515] transition-colors text-left cursor-pointer w-full"
                >
                  <LogOut className="w-4 h-4 text-[#FF5555]" />
                  <span>Sign out</span>
                </button>
              ) : (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/login");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                  >
                    <LogIn className="w-4 h-4 text-[#888888]" />
                    <span>Log in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/register");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#888888] hover:text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                  >
                    <UserPlus className="w-4 h-4 text-[#888888]" />
                    <span>Create account</span>
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
