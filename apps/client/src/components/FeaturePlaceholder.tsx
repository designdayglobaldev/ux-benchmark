import { ArrowLeft, Clock, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeaturePlaceholderProps {
  title?: string;
  behavior: 'maintenance' | 'coming_soon' | 'hide';
  customMessage?: string;
}

export function FeaturePlaceholder({
  title = 'Feature',
  behavior,
  customMessage,
}: FeaturePlaceholderProps) {
  const navigate = useNavigate();
  const isMaintenance = behavior === 'maintenance';

  const defaultMsg = isMaintenance
    ? 'This tool is temporarily undergoing maintenance while we upgrade our systems. We will be back online shortly.'
    : 'We are putting the final touches on this experience. Early access is rolling out soon.';

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-64px)] bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Precision Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Atmospheric ambient lighting */}
      <div
        className={`absolute w-[600px] h-[350px] rounded-full blur-[160px] opacity-20 pointer-events-none -translate-y-16 ${
          isMaintenance ? 'bg-amber-600' : 'bg-gradient-to-r from-purple-700 via-indigo-600 to-pink-600'
        }`}
      />

      {/* Main Container Card */}
      <div className="relative z-10 max-w-[460px] w-full flex flex-col items-center text-center p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-[#121212]/90 backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.9)]">
        
        {/* Status Indicator Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isMaintenance ? 'bg-amber-400' : 'bg-purple-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isMaintenance ? 'bg-amber-500' : 'bg-purple-500'
              }`}
            />
          </span>
          <span className="text-[11px] font-mono tracking-wide uppercase text-[#A1A1A1]">
            {isMaintenance ? 'Maintenance Mode' : 'In Development'}
          </span>
        </div>

        {/* Feature Icon Header */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5 text-white/90 shadow-inner">
          {isMaintenance ? (
            <Wrench className="w-5 h-5 text-amber-400/90" />
          ) : (
            <Clock className="w-5 h-5 text-purple-400/90" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-2.5">
          {title}
        </h1>

        {/* Message */}
        <p className="text-[13px] sm:text-[14px] text-[#888888] font-normal leading-relaxed mb-8 max-w-sm">
          {customMessage || defaultMsg}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-white/[0.06] mb-6" />

        {/* Action Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-medium text-[#CCCCCC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-[#888888]" />
          <span>Return to App Library</span>
        </button>
      </div>

      {/* Discreet footer brand notice */}
      <span className="relative z-10 mt-6 text-[11px] font-mono text-white/20">
        ZIBO PLATFORM &bull; SYSTEM RELEASE CONTROL
      </span>
    </div>
  );
}
