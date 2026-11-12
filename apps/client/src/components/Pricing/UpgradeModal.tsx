import { useUpgradeModal } from '../../contexts/UpgradeContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export function UpgradeModal() {
  const { isUpgradeModalOpen, closeUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();

  const handleJoinNow = () => {
    closeUpgradeModal();
    navigate('/login');
  };

  const handleGetStartedWithPro = () => {
    closeUpgradeModal();
    navigate('/pricing');
  };

  return (
    <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[888px] w-[95vw] md:w-[888px] max-h-[90vh] md:h-[589px] bg-transparent border-0 p-0 overflow-visible shadow-2xl flex flex-col md:flex-row items-center rounded-[16px] outline-none z-50 [&>button:last-child]:hidden"
        aria-describedby="upgrade-modal-desc"
      >
        {/* Explicit Close (X) Button */}
        <button
          type="button"
          onClick={closeUpgradeModal}
          className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-50 w-9 h-9 rounded-full bg-[#181818] hover:bg-[#252525] border border-white/20 text-white flex items-center justify-center transition-all shadow-2xl cursor-pointer hover:scale-105"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <DialogTitle className="sr-only">Choose Plan</DialogTitle>
        <DialogDescription id="upgrade-modal-desc" className="sr-only">
          Select between Hobby and Pro subscription tiers.
        </DialogDescription>

        {/* ================= LEFT FRAME: HOBBY TIER ================= */}
        <div className="relative w-full md:w-[444px] h-[589px] bg-[#171717] border border-[#282828] md:border-r-0 rounded-[16px] md:rounded-l-[16px] md:rounded-r-0 flex flex-col p-6 sm:p-7 shrink-0 box-border overflow-hidden">
          
          {/* Header & Price Block */}
          <div className="flex flex-col gap-1.5 mb-6">
            <span 
              className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.04em] uppercase"
              style={{
                background: 'linear-gradient(116.74deg, #FFE5D4 5.37%, #404040 94.63%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HOBBY
            </span>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['Instrument_Serif'] font-normal text-[47px] leading-[61px] tracking-[-0.05em] text-white">
                Free
              </span>
              <span className="font-['Inter'] font-normal text-[23px] leading-[28px] tracking-[-0.05em] text-[#757575]">
                /forever
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#282828] mb-6" />

          {/* Feature List */}
          <div className="flex flex-col gap-[19px] mb-8">
            {/* Item 1 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                1 benchmark / month
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                5 AI insights / month
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                Browse 10K+ screens
              </span>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                Basic comparison
              </span>
            </div>
          </div>

          {/* Join Now Button */}
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={handleJoinNow}
              className="w-full h-[48px] bg-[#171717] hover:bg-[#202020] border border-[#323232] rounded-full flex items-center justify-center font-['Inter'] font-medium text-[14px] leading-[17px] text-white transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              Join Now
            </button>
          </div>
        </div>

        {/* ================= RIGHT FRAME: PRO TIER ================= */}
        <div className="relative w-full md:w-[444px] h-[589px] bg-[#171717] border border-[#282828] rounded-[16px] md:rounded-r-[16px] md:rounded-l-0 flex flex-col p-6 sm:p-7 shrink-0 box-border overflow-hidden">
          
          {/* Ambient Lighting Gradients */}
          <div 
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '348px',
              height: '268px',
              left: '-112px',
              top: '349px',
              background: '#FBAF52',
              mixBlendMode: 'plus-lighter',
              filter: 'blur(165px)',
              transform: 'rotate(-90deg)',
              opacity: 0.8
            }} 
          />
          <div 
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '348px',
              height: '268px',
              left: '232px',
              top: '375px',
              background: '#D212F0',
              mixBlendMode: 'plus-lighter',
              filter: 'blur(165px)',
              opacity: 0.8
            }} 
          />

          {/* Most Popular Badge */}
          <div 
            className="absolute right-[17px] top-[13px] h-[20px] px-2 rounded-[4px] flex items-center justify-center border border-white/[0.04] shadow-sm z-10"
            style={{
              background: 'linear-gradient(90deg, #FF924A 0%, #FF6FFA 100%)',
            }}
          >
            <span className="font-['Inter'] font-medium text-[12px] leading-[15px] tracking-[-0.03em] text-[#2A2A2A]">
              Most Popular
            </span>
          </div>

          {/* Header & Price Block */}
          <div className="flex flex-col gap-1.5 mb-6 z-10">
            <span 
              className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.04em] uppercase"
              style={{
                background: 'linear-gradient(116.74deg, #FFE5D4 5.37%, #404040 94.63%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PRO
            </span>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-['Instrument_Serif'] font-normal text-[47px] leading-[61px] tracking-[-0.05em] text-white">
                $12
              </span>
              <span className="font-['Inter'] font-normal text-[23px] leading-[28px] tracking-[-0.05em] text-[#757575]">
                /forever
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-[1px] bg-[#282828] mb-6 z-10" />

          {/* Feature List */}
          <div className="flex flex-col gap-[19px] mb-8 z-10">
            {/* Item 1 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                5x AI usage
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                10 benchmarks / month
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                50 AI insights / month
              </span>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                Benchmark against 5–20 relevant apps
              </span>
            </div>

            {/* Item 5 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                Full AI screen analysis
              </span>
            </div>

            {/* Item 6 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                Save unlimited screens
              </span>
            </div>
          </div>

          {/* Get Started With PRO Button */}
          <div className="mt-auto pt-4 relative z-10">
            <button
              type="button"
              onClick={handleGetStartedWithPro}
              className="relative w-full h-[48px] rounded-[47px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.99] overflow-hidden"
              style={{
                background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(90, 90, 90, 0.73) 84.41%)',
                boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
                backdropFilter: 'blur(7.2px)',
              }}
            >
              {/* Button Ambient Glow */}
              <div 
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: '58.76px',
                  height: '45.27px',
                  left: '-10.98px',
                  top: '-7.13px',
                  background: '#FBAF52',
                  mixBlendMode: 'plus-lighter',
                  opacity: 0.7,
                  filter: 'blur(20.5px)'
                }}
              />
              <div 
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: '50.49px',
                  height: '38.9px',
                  right: '-7.15px',
                  top: '15.5px',
                  background: '#D212F0',
                  mixBlendMode: 'plus-lighter',
                  opacity: 0.7,
                  filter: 'blur(20.5px)',
                  transform: 'rotate(-180deg)'
                }}
              />

              <span className="font-['Inter'] font-medium text-[14px] leading-[17px] text-white z-10">
                Get Started With PRO
              </span>
            </button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
