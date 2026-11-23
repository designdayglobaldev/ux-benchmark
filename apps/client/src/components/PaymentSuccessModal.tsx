import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function PaymentSuccessModal({ isOpen, onClose }: PaymentSuccessModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleStartExploring = () => {
    if (onClose) onClose();
    navigate('/apps');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/90 backdrop-blur-md px-4 overflow-hidden select-none animate-in fade-in duration-300">
      {/* Container matching Desktop - 105 Figma frame */}
      <div className="relative w-full max-w-[645px] h-[645px] flex flex-col items-center justify-center">
        
        {/* Ambient Radial Glowing Aura / Ellipse stack (Figma: Group 1171278907) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="w-[566px] h-[566px] rounded-full opacity-40 blur-3xl"
            style={{
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(203, 245, 196, 0.45) 0%, rgba(203, 245, 196, 0) 100%)',
              transform: 'rotate(8.57deg)',
            }}
          />
        </div>

        {/* Success Icon (CheckCircle) */}
        <div className="relative z-10 mb-8 flex items-center justify-center">
          <div className="w-[120px] h-[120px] sm:w-[148px] sm:h-[148px] rounded-full bg-[#1A2E1A] border-2 border-[#3ADF3A]/40 flex items-center justify-center shadow-[0_0_50px_rgba(58,223,58,0.25)]">
            <CheckCircle2 className="w-[80px] h-[80px] sm:w-[98px] sm:h-[98px] text-[#3ADF3A] stroke-[1.8]" />
          </div>
        </div>

        {/* Title & Subtitle (Frame 2147228007) */}
        <div className="relative z-10 w-full max-w-[476px] flex flex-col items-center gap-[12px] text-center px-4">
          <h2 className="font-['Instrument_Serif'] font-normal text-[42px] sm:text-[48px] leading-[54px] sm:leading-[62px] text-white tracking-wide">
            You are all set!
          </h2>
          <p className="font-['Inter'] font-normal text-[17px] sm:text-[19px] leading-[24px] sm:leading-[26px] text-[#A3A3A3] tracking-tight">
            Payment confirmed! Your Zibo subscription is now active. Happy designing! 🎨
          </p>
        </div>

        {/* Primary CTA Button (Frame 2147228012) */}
        <div className="relative z-10 w-full max-w-[562px] px-4 mt-10">
          <button
            type="button"
            onClick={handleStartExploring}
            className="w-full h-[58px] bg-white hover:bg-[#F2F2F2] active:scale-[0.99] text-[#1A1A1A] font-['Inter'] font-medium text-[16px] leading-[19px] tracking-[-0.02em] rounded-[8px] border border-[#313131] transition-all flex items-center justify-center shadow-xl cursor-pointer"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
