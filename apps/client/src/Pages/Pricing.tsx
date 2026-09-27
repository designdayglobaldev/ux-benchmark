import { Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const PricingCheck = () => (
  <div className="w-5 h-5 rounded-full p-[1px] bg-gradient-to-br from-[#4A80FF]/45 to-[#FF924A]/45 shrink-0 mt-0.5">
    <div className="w-full h-full bg-[#242424] rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
      <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
    </div>
  </div>
);

export function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-20 px-4">
      <div className="text-center mb-16">
        <h1 className="text-[48px] font-serif font-normal mb-4 text-white leading-tight">Unlock All access</h1>
        <p className="text-[#A3A3A3] text-[20px] tracking-[-0.04em] max-w-xl mx-auto">
          Instant access to all the AI tools and huge collection of UI library updated every week
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-[#FF924A]/10 border border-[#FF924A]/20 text-[#FF924A] px-4 py-2 rounded-full text-[14px] font-medium tracking-tight">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF924A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF924A]"></span>
          </span>
          Note: This is demo pricing. We are still finalizing our plans.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mx-auto">
        {/* Free Tier */}
        <div className="p-10 border border-[#282828] rounded-2xl flex flex-col relative bg-[#171717]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <h3 className="bg-gradient-to-r from-[#FF924A] to-[#404040] bg-clip-text text-transparent font-sans font-normal text-[20px] tracking-[-0.04em] mb-4 mt-2 w-fit">HOBBY</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-[54px] font-serif text-white tracking-[-0.05em] leading-none">Free</span>
            <span className="text-[23px] text-[#757575] tracking-[-0.05em]">/forever</span>
          </div>
          <p className="text-[#6A6A6A] text-[16px] tracking-[-0.05em] min-h-[48px]">
            For exploring Baselyn and trying out the core experience.
          </p>

          <div className="w-full h-px bg-[#282828] my-6" />

          <ul className="space-y-5 mb-10 flex-1 text-[16px] text-white tracking-[-0.05em]">
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>1 benchmark / month</span>
            </li>
            <li className="flex items-start gap-4">
              <PricingCheck />
              <span>5 AI insights / month</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>Browse 10K+ screens</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>Basic comparison</span>
            </li>
          </ul>
          
          <div className="pt-6 mt-auto relative z-10">
            <Button variant="outline" className="w-full h-12 rounded-full border-transparent bg-[#1c1c1c] hover:bg-[#252525] text-white transition-colors" onClick={() => navigate('/dashboard')}>
              Current Plan
            </Button>
          </div>

          {/* Dots Pattern overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_1px,_transparent_1px)] bg-[size:10px_10px] opacity-50 mask-image:linear-gradient(to_bottom,transparent,black)" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)' }} />
        </div>

        {/* PRO Tier */}
        <div className="p-10 border border-[#282828] rounded-2xl flex flex-col relative bg-[#171717] overflow-hidden">
          {/* Bottom Left Orange Gradient */}
          <div 
            className="absolute -bottom-10 -left-16 w-[350px] h-[270px] bg-[#E6630B] rounded-full blur-[100px] opacity-60 pointer-events-none" 
            style={{ mixBlendMode: 'plus-lighter' }}
          />
          
          {/* Bottom Right Blue Gradient */}
          <div 
            className="absolute -bottom-10 -right-16 w-[350px] h-[270px] bg-[#0B5BE6] rounded-full blur-[120px] opacity-60 pointer-events-none" 
            style={{ mixBlendMode: 'plus-lighter' }}
          />
          
          <h3 className="bg-gradient-to-r from-[#FF924A] to-[#404040] bg-clip-text text-transparent font-sans font-normal text-[20px] tracking-[-0.04em] mb-4 mt-2 w-fit">PRO</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-[54px] font-serif text-white tracking-[-0.05em] leading-none">$12</span>
            <span className="text-[23px] text-[#757575] tracking-[-0.05em]">/mo</span>
          </div>
          <p className="text-[#6A6A6A] text-[16px] tracking-[-0.05em] min-h-[48px]">
            Go beyond inspiration. Benchmark your designs against relevant products.
          </p>

          <div className="w-full h-px bg-[#282828] my-6" />

          <div className="text-[18px] text-[#6A6A6A] tracking-[-0.05em] mb-5">Everything in Free &</div>
          
          <ul className="space-y-5 mb-10 flex-1 text-[16px] text-white tracking-[-0.05em] relative z-10">
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>5x AI usage</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>10 benchmarks / month</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>50 AI insights / month</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>Benchmark against 5-20 relevant apps</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>Full AI screen analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <PricingCheck />
              <span>Save unlimited screens</span>
            </li>
          </ul>

          <div className="pt-6 mt-auto relative z-10">
            <div className="rounded-full p-[1.5px] bg-gradient-to-r from-[#0B5BE6] via-[#5b576b] to-[#E6630B]">
              <Button 
                className="w-full h-12 rounded-full bg-[#171717] hover:bg-[#222] text-white transition-all shadow-[0_0_15px_rgba(224,142,85,0.05)] hover:shadow-[0_0_20px_rgba(224,142,85,0.15)]"
              >
                Start With PRO
              </Button>
            </div>
          </div>

          {/* Dots Pattern overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:10px_10px] opacity-50 mask-image:linear-gradient(to_bottom,transparent,black)" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)' }} />
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-gray-600 max-w-2xl">
        All plans may be canceled at any time and you retain access to PRO features until the end of your billing cycle.
      </div>
    </div>
  );
}
