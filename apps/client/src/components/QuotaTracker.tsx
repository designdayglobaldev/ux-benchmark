import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { useUpgradeModal } from "@/contexts/UpgradeContext";

export function QuotaTracker() {
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgradeModal();
  const [quota, setQuota] = useState<{ tier: string; limit: number; usage: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // In a real app, you would pass the auth token.
    // Here we simulate auth by passing the user ID in the header for our mock endpoint.
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/quota/me`, {
      headers: {
        'x-user-id': user.id
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => setQuota(data))
      .catch(console.error);
  }, [user]);

  if (!quota || typeof quota.limit !== 'number') return null;

  const { tier, limit, usage } = quota;
  const isPremium = tier === 'PREMIUM';
  const percentage = Math.min((usage / limit) * 100, 100);

  return (
    <div className="flex items-center gap-3 bg-[#111111] border border-[#333] rounded-full px-4 py-1.5 shadow-sm text-sm">
      <div className="flex items-center gap-1.5">
        <Sparkles className={`w-4 h-4 ${isPremium ? 'text-amber-400' : 'text-blue-400'}`} />
        <span className="font-medium text-white">{isPremium ? 'Premium' : 'Free'}</span>
      </div>
      
      <div className="h-4 w-[1px] bg-[#333]" />
      
      <div className="flex items-center gap-2">
        <div className="w-20">
          <Progress value={percentage} className="h-1.5" />
        </div>
        <span className="text-[#A1A1A1] text-xs font-medium w-12 text-right">
          {usage} / {limit}
        </span>
      </div>

      {!isPremium && (
        <>
          <div className="h-4 w-[1px] bg-[#333]" />
          <button 
            onClick={openUpgradeModal}
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors text-xs uppercase tracking-wider"
          >
            Upgrade
          </button>
        </>
      )}
    </div>
  );
}
