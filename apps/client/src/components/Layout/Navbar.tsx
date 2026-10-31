import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Bell, 
  LogOut, 
  Sparkles, 
  FolderKanban,
  Bookmark,
  MessageSquare,
  Search
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Derive initial for avatar (matching design letter or user initial)
  const userInitial = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "J";

  const isWorkspaceActive = location.pathname === "/" || location.pathname.startsWith("/ai-workspace");
  const isAppsActive = 
    location.pathname === "/apps" || 
    location.pathname === "/browse" ||
    location.pathname.startsWith("/app/");
  const isFlowsActive = location.pathname.startsWith("/flows");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-black text-white h-[64px]">
      <div className="flex h-full items-center px-4 sm:px-6 md:px-8 justify-between w-full mx-auto gap-4">
        
        {/* Left Side: Logo & Main Navigation */}
        <div className="flex items-center gap-7 lg:gap-8 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={Logo} alt="Logo" className="h-7 sm:h-8 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-6 lg:gap-7 h-[64px]">
            {/* Workspace (Home) */}
            <Link
              to="/"
              className={`h-full flex items-center relative text-[14px] font-medium transition-colors ${
                isWorkspaceActive
                  ? "text-white"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              Workspace
              {isWorkspaceActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}
            </Link>

            {/* Apps */}
            <Link
              to="/apps"
              className={`h-full flex items-center relative text-[14px] font-medium transition-colors ${
                isAppsActive
                  ? "text-white"
                  : "text-[#888888] hover:text-[#CCCCCC]"
              }`}
            >
              Apps
              {isAppsActive && (
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
          </nav>
        </div>

        {/* Search Modal Dialog Controller */}
        <SearchModal 
          isOpenControlled={isSearchOpen} 
          onOpenChangeControlled={setIsSearchOpen}
          hideTrigger={true}
        />

        {/* Right Side: Search Icon, Bookmark, Chat/Feedback, Notification Bell, User Avatar */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Search trigger icon */}
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Bookmark / Saved Collections */}
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

          {/* Chat / Feedback icon */}
          <button 
            type="button"
            aria-label="Messages / Feedback"
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
          </button>

          {/* Notification Bell */}
          <button 
            type="button"
            aria-label="Notifications"
            className="text-[#888888] hover:text-white transition-colors p-1.5 rounded-full hover:bg-[#1A1A1A] cursor-pointer"
          >
            <Bell className="w-[18px] h-[18px]" />
          </button>

          {/* User Profile Avatar / Dropdown */}
          {user ? (
            <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="User Profile Menu"
                  className="w-[32px] h-[32px] rounded-full bg-[#3d2b1f] border border-[#6b4c37]/60 text-[#d4a373] flex items-center justify-center font-medium text-[13px] hover:opacity-90 transition-opacity cursor-pointer shadow-sm focus:outline-none"
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
                      {user.email}
                    </p>
                    <span className="text-[11px] text-[#888888]">
                      Free Plan
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
                      navigate("/collections");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#CCCCCC] hover:text-white hover:bg-[#202020] transition-colors text-left cursor-pointer w-full"
                  >
                    <FolderKanban className="w-4 h-4 text-[#888888]" />
                    <span>Collections</span>
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

                {/* Sign out */}
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
              </PopoverContent>
            </Popover>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center justify-center bg-white text-black hover:bg-[#EBEBEB] font-medium text-[13px] px-5 py-1.5 rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
