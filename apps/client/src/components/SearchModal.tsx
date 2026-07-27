import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, Scan } from "lucide-react";
import { useState, useEffect } from "react";

const placeholders = [
  "Search for apps..",
  "Search for flows..",
  "Search for UX patterns..",
  "Search for UI elements.."
];

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const currentWord = placeholders[placeholderIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText(currentWord.substring(0, Math.max(0, displayText.length - 1)));
        if (displayText.length <= 1) {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }, 50);
    } else {
      timer = setTimeout(() => {
        setDisplayText(currentWord.substring(0, displayText.length + 1));
        if (displayText.length === currentWord.length) {
          timer = setTimeout(() => setIsDeleting(true), 2000);
        }
      }, 80);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, placeholderIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative w-full cursor-pointer" onClick={() => setOpen(true)}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A1A1A1]" />
          <div 
            className="flex items-center w-full h-[44px] bg-[#1A1A1A] rounded-[22px] pl-[42px] pr-[42px] text-[15px] text-[#888888] hover:bg-[#222222] transition-colors border border-transparent hover:border-[#333333]"
          >
            {displayText || " "}
          </div>
          <Scan className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A1A1A1] hover:text-white transition-colors" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[700px] bg-[#161616] border-[#222222] text-white p-0 gap-0 rounded-[16px] overflow-hidden">
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-[#222222]">
          <Search className="h-[20px] w-[20px] text-[#888888] mr-3" />
          <input
            type="text"
            placeholder={displayText}
            className="flex-1 bg-transparent text-[16px] text-white placeholder-[#888888] outline-none border-none"
            autoFocus
          />
        </div>

        {/* Content Area */}
        <div className="flex p-4">
          {/* Left Column: Explore */}
          <div className="w-[200px] border-r border-[#222222] pr-4">
            <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">Explore</h3>
            <div className="flex flex-col gap-1">
              {['Flows', 'UX Patterns', 'UI Elements', 'Categories'].map((item) => (
                <button key={item} className="flex items-center justify-between px-3 py-2.5 rounded-[8px] hover:bg-[#222222] text-[14px] text-white transition-colors text-left">
                  {item}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Tags */}
          <div className="flex-1 pl-6">
            <h3 className="text-[#888888] text-[12px] font-medium mb-4 uppercase tracking-wider">Recent Searches</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222222] hover:bg-[#333333] border border-[#333333] text-[13px] text-white transition-colors">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-black font-bold text-[10px]">R</div>
                Revolut
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222222] hover:bg-[#333333] border border-[#333333] text-[13px] text-white transition-colors">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                Superlist
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222222] hover:bg-[#333333] border border-[#333333] text-[13px] text-white transition-colors">
                <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">A</div>
                Airbnb
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">New User Experience</h3>
                <div className="flex flex-wrap gap-2">
                  {['Browsing Tutorial', 'Creating Account', 'Onboarding'].map((tag) => (
                    <button key={tag} className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">Account Management</h3>
                <div className="flex flex-wrap gap-2">
                  {['Editing Profile', 'Deleting & Deactivating Account', 'Login', 'Logout', 'Resetting Password', 'Switching Account'].map((tag) => (
                    <button key={tag} className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[#888888] text-[12px] font-medium mb-3 uppercase tracking-wider">Commerce & Finance</h3>
                <div className="flex flex-wrap gap-2">
                  {['Adding to Cart & Bag', 'Booking & Reserving', 'Cancelling Order & Refunding'].map((tag) => (
                    <button key={tag} className="px-3 py-1.5 rounded-full bg-transparent hover:bg-[#222222] border border-[#333333] text-[13px] text-[#EAEAEA] transition-colors">
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
