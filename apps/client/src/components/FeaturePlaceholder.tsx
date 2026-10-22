import { Sparkles, Wrench, ArrowLeft } from 'lucide-react';
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
    ? 'This feature is currently undergoing maintenance. We are tuning things up and will be back shortly!'
    : 'We are working hard to bring this feature to you. Stay tuned!';

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-64px)] bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div
        className={`absolute w-[450px] h-[450px] rounded-full blur-[140px] opacity-25 pointer-events-none -translate-y-12 ${
          isMaintenance ? 'bg-amber-500' : 'bg-purple-600'
        }`}
      />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center p-8 rounded-2xl border border-white/10 bg-[#111111]/80 backdrop-blur-xl shadow-2xl shadow-black/80">
        {/* Animated Badge Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
            isMaintenance
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}
        >
          {isMaintenance ? (
            <Wrench className="w-7 h-7 animate-pulse" />
          ) : (
            <Sparkles className="w-7 h-7 animate-bounce" />
          )}
        </div>

        {/* Tag */}
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-4 border ${
            isMaintenance
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
          }`}
        >
          {isMaintenance ? 'Under Maintenance' : 'Coming Soon'}
        </span>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          {title}
        </h1>

        {/* Custom Message from Admin */}
        <p className="text-sm text-[#A1A1A1] leading-relaxed mb-8 max-w-md">
          {customMessage || defaultMsg}
        </p>

        {/* Actions */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>
      </div>
    </div>
  );
}
