import { useUpgradeModal } from '../../contexts/UpgradeContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UpgradeModal() {
  const { isUpgradeModalOpen, closeUpgradeModal } = useUpgradeModal();
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    closeUpgradeModal();
    // In the future, this would integrate with Stripe Checkout.
    // For now, we'll navigate to the pricing page or just show a message.
    navigate('/pricing');
  };

  return (
    <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent className="sm:max-w-[800px] bg-[#0c0c0c] border-[#222] text-white p-0 overflow-hidden">
        <div className="p-8 text-center border-b border-[#222]">
          <DialogTitle className="text-3xl font-serif font-normal mb-2">Unlock All access</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm max-w-md mx-auto">
            Instant access to all the AI tools and huge collection of UI library updated every week
          </DialogDescription>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Free Tier */}
          <div className="p-8 border-r border-[#222] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <h3 className="text-[#a07c5a] font-medium tracking-widest text-xs uppercase mb-4">Hobby</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-serif">Free</span>
              <span className="text-gray-500 text-sm">/forever</span>
            </div>
            <p className="text-gray-400 text-xs mb-8">
              For exploring the library and trying out the core experience.
            </p>

            <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span>1 benchmark / month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span>5 AI insights / month</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span>Browse 10K+ screens</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                <span>Basic comparison</span>
              </li>
            </ul>
            
            <div className="pt-4 mt-auto">
              <Button variant="outline" className="w-full border-[#333] hover:bg-[#222] text-white bg-transparent" onClick={closeUpgradeModal}>
                Current Plan
              </Button>
            </div>
          </div>

          {/* PRO Tier */}
          <div className="p-8 flex flex-col relative overflow-hidden bg-gradient-to-b from-[#1a1310] to-[#0c0c0c]">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#e08e55] rounded-full blur-[80px] opacity-30 pointer-events-none" />
            
            <h3 className="text-[#e08e55] font-medium tracking-widest text-xs uppercase mb-4">PRO</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-serif">$12</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <p className="text-gray-400 text-xs mb-8">
              Go beyond inspiration. Benchmark your designs against relevant products.
            </p>

            <div className="text-xs text-gray-500 mb-4 font-medium">Everything in Free &</div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-200">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#e08e55] mt-0.5 shrink-0" />
                <span>Unlimited AI usage</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#e08e55] mt-0.5 shrink-0" />
                <span>Unlimited benchmarks</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#e08e55] mt-0.5 shrink-0" />
                <span>Full AI screen analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#e08e55] mt-0.5 shrink-0" />
                <span>Save unlimited screens</span>
              </li>
            </ul>

            <div className="pt-4 mt-auto">
              <Button 
                className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333] transition-all hover:border-[#e08e55]/50 shadow-[0_0_15px_rgba(224,142,85,0.1)] hover:shadow-[0_0_20px_rgba(224,142,85,0.2)]"
                onClick={handleUpgradeClick}
              >
                Upgrade to PRO
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-center text-[10px] text-gray-600 bg-black/40">
          All plans may be canceled at any time and you retain access until expired.
        </div>
      </DialogContent>
    </Dialog>
  );
}
