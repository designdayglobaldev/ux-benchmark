import { useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  createSubscription,
  verifyPaymentSignature,
  pollSubscriptionUntilActive,
} from '../lib/billing';

export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FAQ open/close accordion state (default first item open)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const planCode = billingCycle === 'yearly' ? 'PRO_ANNUAL' : 'PRO_MONTHLY';
      const sub = await createSubscription(planCode);

      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please refresh the page.');
      }

      const options = {
        key: sub.keyId,
        subscription_id: sub.razorpaySubscriptionId,
        name: 'Zibo UX Library',
        description: `${sub.planName} AutoPay Subscription`,
        image: '/zibo-logo.png',
        handler: async function (response: any) {
          setPollingStatus('Confirming subscription with payment network...');
          try {
            await verifyPaymentSignature({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });

            pollSubscriptionUntilActive(
              (_finalStatus) => {
                setPollingStatus(null);
                setIsLoading(false);
                alert('🎉 Welcome to Zibo PRO! Your subscription and 1,000 monthly credits are active.');
                navigate('/apps');
              },
              () => {
                setPollingStatus(null);
                setIsLoading(false);
                alert('Your payment was received and is processing. Your PRO features will activate in a few moments.');
                navigate('/apps');
              }
            );
          } catch (e: any) {
            console.error('Signature verification error:', e);
            setPollingStatus(null);
            setIsLoading(false);
            setErrorMessage('Payment received but verification timed out. It will activate automatically shortly.');
          }
        },
        prefill: {
          email: user.email || '',
        },
        theme: {
          color: '#FF924A',
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            setPollingStatus(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setIsLoading(false);
        setPollingStatus(null);
        setErrorMessage(resp.error?.description || 'Payment was declined or failed.');
      });
      rzp.open();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setErrorMessage(err.message || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const proPriceDisplay = billingCycle === 'yearly' ? '$9.60' : '$12';
  const proSubDisplay = billingCycle === 'yearly' ? '/month' : '/month';

  const faqItems = [
    {
      q: 'Is Zibo actually free to start?',
      a: 'Yes, absolutely. The Hobby tier provides free access forever to browse screens, preview flows, and experiment with AI tools using complimentary monthly quota.',
    },
    {
      q: 'Can I cancel or pause my subscription anytime?',
      a: 'All plans may be canceled at any time. When you cancel, you retain full access to all PRO benefits and credits until the end of your current billing period.',
    },
    {
      q: 'What payment methods and currencies are supported?',
      a: 'We support international and domestic credit/debit cards, UPI AutoPay, NetBanking, and all major wallets with automatic billing and invoice generation.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center relative overflow-x-hidden selection:bg-[#FF924A]/30">
      {/* Status Banners */}
      {errorMessage && (
        <div className="fixed top-20 z-50 max-w-md w-full px-4">
          <div className="text-sm text-red-300 bg-red-950/80 backdrop-blur-md border border-red-700/60 rounded-xl p-3.5 shadow-2xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {pollingStatus && (
        <div className="fixed top-20 z-50 max-w-md w-full px-4">
          <div className="text-sm text-amber-200 bg-amber-950/80 backdrop-blur-md border border-amber-600/60 rounded-xl p-3.5 shadow-2xl flex items-center justify-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>{pollingStatus}</span>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
      <section className="w-full flex flex-col items-center pt-[84px] px-4 max-w-[1440px]">
        {/* Title & Subtitle Frame (Frame 2147228007) */}
        <div className="w-full max-w-[758px] flex flex-col items-center gap-[9px] text-center">
          <h1 className="font-['Instrument_Serif'] font-normal text-[48px] sm:text-[54px] md:text-[60px] leading-[62px] text-white">
            Unlock All access
          </h1>
          <p className="font-['Inter'] font-normal text-[18px] sm:text-[20px] leading-[24px] tracking-[-0.04em] text-[#A3A3A3] max-w-[758px]">
            Instant access to all the AI tools and huge collection of UI library updated every week
          </p>
        </div>

        {/* Billing Toggle Frame (Frame 2147230722) */}
        <div className="relative mt-[45px] w-[300px] h-[43px] bg-[#1D1D1D] rounded-[31px] p-[3px] flex items-center justify-between shadow-[0px_4px_6.7px_#000000,inset_0px_5px_13.1px_rgba(0,0,0,0.59)]">
          {/* Monthly Button (Frame 2147230723) */}
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`w-[142px] h-[37px] rounded-[47px] flex items-center justify-center font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] cursor-pointer transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-[rgba(31,31,31,0.73)] to-[rgba(90,90,90,0.73)] text-white shadow-[0px_4px_6.8px_rgba(0,0,0,0.25),inset_-1px_-0.5px_0.5px_rgba(156,156,156,0.63),inset_1px_0.5px_0.5px_rgba(83,83,83,0.63)] backdrop-blur-[7.2px]'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            Monthly
          </button>

          {/* Yearly Button with 40% OFF tag (Frame 2147230725 & 2147230726) */}
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`w-[142px] h-[37px] rounded-[47px] flex items-center justify-center gap-[8px] font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] cursor-pointer transition-all duration-200 ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-[rgba(31,31,31,0.73)] to-[rgba(90,90,90,0.73)] text-white shadow-[0px_4px_6.8px_rgba(0,0,0,0.25),inset_-1px_-0.5px_0.5px_rgba(156,156,156,0.63),inset_1px_0.5px_0.5px_rgba(83,83,83,0.63)] backdrop-blur-[7.2px]'
                : 'text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>Yearly</span>
            <span className="w-[49px] h-[18px] bg-[rgba(56,214,93,0.15)] rounded-[15px] flex items-center justify-center font-['Inter'] font-normal text-[10px] leading-[12px] tracking-[-0.04em] text-[#38D65D]">
              40% OFF
            </span>
          </button>
        </div>
      </section>

      {/* ================= PRICING CARDS SECTION (Frame 2147230730) ================= */}
      <section className="w-full flex justify-center mt-[51px] px-4">
        <div className="w-full max-w-[888px] flex flex-col md:flex-row items-stretch rounded-[16px] shadow-2xl">
          
          {/* ================= LEFT TIER: HOBBY (Frame 2147230727) ================= */}
          <div className="relative w-full md:w-[444px] min-h-[589px] bg-[#171717] border border-[#282828] md:border-r-0 rounded-[16px] md:rounded-l-[16px] md:rounded-r-0 p-[20px] flex flex-col">
            {/* Header: HOBBY + Free /forever (Frame 2147230731) */}
            <div className="flex flex-col gap-[6px] mt-[8px]">
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

              <div className="flex items-baseline gap-[4px] mt-[6px]">
                <span className="font-['Instrument_Serif'] font-normal text-[47px] leading-[61px] tracking-[-0.05em] text-white">
                  Free
                </span>
                <span className="font-['Inter'] font-normal text-[23px] leading-[28px] tracking-[-0.05em] text-[#757575]">
                  /forever
                </span>
              </div>
            </div>

            {/* Divider (Vector 12812) */}
            <div className="w-full h-[1px] bg-[#282828] my-[28px]" />

            {/* Feature List (Frame 2147230493) */}
            <div className="flex flex-col gap-[19px] mb-8">
              {/* Item 1 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  1 benchmark / month
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  5 AI insights / month
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  Browse 10K+ screens
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  Basic comparison
                </span>
              </div>
            </div>

            {/* Current Plan Button (Frame 2147227860) */}
            <div className="mt-auto pt-6 pb-2">
              <button
                type="button"
                onClick={() => navigate('/apps')}
                className="w-full h-[48px] bg-[#171717] hover:bg-[#202020] border border-[#323232] rounded-[9999px] flex items-center justify-center font-['Inter'] font-medium text-[14px] leading-[17px] text-white transition-colors cursor-pointer"
              >
                Current Plan
              </button>
            </div>
          </div>

          {/* ================= RIGHT TIER: PRO (Frame 2147230728) ================= */}
          <div className="relative w-full md:w-[444px] min-h-[589px] bg-[#171717] border border-[#282828] rounded-[16px] md:rounded-r-[16px] md:rounded-l-0 p-[20px] flex flex-col overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div 
              className="absolute pointer-events-none rounded-full"
              style={{
                width: '348.06px',
                height: '268.14px',
                left: '-112.13px',
                top: '349.24px',
                background: '#FBAF52',
                mixBlendMode: 'plus-lighter',
                filter: 'blur(165.6px)',
                transform: 'rotate(-90deg)',
              }}
            />
            <div 
              className="absolute pointer-events-none rounded-full"
              style={{
                width: '348.06px',
                height: '268.14px',
                left: '232.06px',
                top: '375.68px',
                background: '#D212F0',
                mixBlendMode: 'plus-lighter',
                filter: 'blur(165.6px)',
              }}
            />

            {/* Most Popular Badge (Frame 2147228045) */}
            <div 
              className="absolute right-[16.85px] top-[13px] h-[20px] px-[8px] rounded-[4px] flex items-center justify-center border border-white/[0.04] shadow-sm z-10"
              style={{
                background: 'linear-gradient(90deg, #FF924A 0%, #FF6FFA 100%)',
              }}
            >
              <span className="font-['Inter'] font-medium text-[12px] leading-[15px] tracking-[-0.03em] text-[#2A2A2A]">
                Most Popular
              </span>
            </div>

            {/* Header: PRO + $12 /forever (Frame 2147230731) */}
            <div className="flex flex-col gap-[6px] mt-[8px]">
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

              <div className="flex items-baseline gap-[4px] mt-[6px]">
                <span className="font-['Instrument_Serif'] font-normal text-[47px] leading-[61px] tracking-[-0.05em] text-white">
                  {proPriceDisplay}
                </span>
                <span className="font-['Inter'] font-normal text-[23px] leading-[28px] tracking-[-0.05em] text-[#757575]">
                  {proSubDisplay}
                </span>
              </div>
            </div>

            {/* Divider (Vector 12812) */}
            <div className="w-full h-[1px] bg-[#282828] my-[28px]" />

            {/* Feature List (Frame 2147230493) */}
            <div className="flex flex-col gap-[19px] mb-8 relative z-10">
              {/* Item 1 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  5x AI usage
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  10 benchmarks / month
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  50 AI insights / month
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  Benchmark against 5–20 relevant apps
                </span>
              </div>

              {/* Item 5 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  Full AI screen analysis
                </span>
              </div>

              {/* Item 6 */}
              <div className="flex items-center gap-[12px]">
                <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-['Inter'] font-normal text-[16px] leading-[19px] tracking-[-0.05em] text-white">
                  Save unlimited screens
                </span>
              </div>
            </div>

            {/* Start With PRO Button (Frame 2147230723) */}
            <div className="mt-auto pt-6 pb-2 relative z-10">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSubscribe}
                className="relative w-full h-[48px] rounded-[47px] flex items-center justify-center cursor-pointer transition-all active:scale-[0.99] overflow-hidden"
                style={{
                  background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(90, 90, 90, 0.73) 84.41%)',
                  boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
                  backdropFilter: 'blur(7.2px)',
                }}
              >
                {/* Button Ambient Glows */}
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

                {isLoading ? (
                  <div className="flex items-center gap-2 text-white font-['Inter'] font-medium text-[14px] z-10">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span className="font-['Inter'] font-medium text-[14px] leading-[17px] text-white z-10">
                    Start With PRO
                  </span>
                )}
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ================= DISCLAIMER ================= */}
      <p className="mt-[32px] font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] text-[#6A6A6A] text-center px-4">
        All plans may be canceled at any time and you retain access to download until expired.
      </p>

      {/* ================= ENTERPRISE SOLUTION CARD (Frame 2147230733) ================= */}
      <section className="w-full flex justify-center mt-[48px] px-4">
        <div 
          className="relative w-full max-w-[888px] min-h-[107px] rounded-[16px] p-6 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden"
          style={{
            background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(16, 16, 16, 0.73) 84.41%)',
            boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
            backdropFilter: 'blur(7.2px)',
          }}
        >
          {/* Subtle Ambient Orbs */}
          <div 
            className="absolute pointer-events-none rounded-full"
            style={{
              width: '140.95px',
              height: '108.59px',
              left: '-31.81px',
              top: 'calc(50% - 54px)',
              background: '#FBAF52',
              mixBlendMode: 'plus-lighter',
              opacity: 0.2,
              filter: 'blur(55px)',
            }}
          />

          {/* Left Text */}
          <div className="flex flex-col gap-[5px] z-10 text-left">
            <h3 className="font-['Inter'] font-normal text-[20px] leading-[24px] tracking-[-0.06em] text-white">
              Need an enterprise solution?
            </h3>
            <p className="font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] text-[#979797]">
              More security and support options. Steeper discounts over $3k/month.
            </p>
          </div>

          {/* Right Button (Frame 2147230708) */}
          <button
            type="button"
            onClick={() => window.location.href = 'mailto:support@zibo.design?subject=Enterprise%20Inquiry'}
            className="relative h-[36px] px-6 rounded-[33px] flex items-center justify-center font-['Inter'] font-medium text-[14px] leading-[17px] text-white cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0 overflow-hidden shadow-lg z-10"
            style={{
              background: 'linear-gradient(96.75deg, #FF7213 0.78%, #EF27A3 99.22%)',
            }}
          >
            Talk to us
          </button>
        </div>
      </section>

      {/* ================= COMPARISON TABLE SECTION (Group 2134283782) ================= */}
      <section className="w-full max-w-[1052px] flex flex-col items-center mt-[120px] px-4">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-[14px] text-center mb-[40px]">
          <div 
            className="h-[24px] px-[12px] rounded-[47px] flex items-center justify-center font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] text-white"
            style={{
              background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(90, 90, 90, 0.73) 84.41%)',
              boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
              backdropFilter: 'blur(7.2px)',
            }}
          >
            Compare plans
          </div>

          <h2 className="font-['Instrument_Serif'] font-normal text-[44px] leading-[57px] text-white">
            Find the plan that fits your workflow.
          </h2>
        </div>

        {/* Feature Comparison Table */}
        <div className="w-full border border-[#242424] rounded-[8px] overflow-hidden bg-[#111111]">
          {/* Table Header */}
          <div className="grid grid-cols-12 border-b border-[#242424] bg-[#141414]">
            <div className="col-span-4 p-4 md:p-5 flex items-center font-['Inter'] font-medium text-[15px] text-[#A3A3A3]">
              Feature
            </div>
            <div className="col-span-4 p-4 md:p-5 border-l border-[#242424] flex flex-col justify-center items-center text-center">
              <span 
                className="font-['Inter'] font-normal text-[14px] leading-[17px] uppercase"
                style={{
                  background: 'linear-gradient(116.74deg, #FFE5D4 5.37%, #404040 94.63%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Hobby
              </span>
              <span className="font-['Instrument_Serif'] text-[24px] text-white mt-1">Free</span>
            </div>
            <div className="col-span-4 p-4 md:p-5 border-l border-[#242424] flex flex-col justify-center items-center text-center bg-white/[0.02]">
              <span 
                className="font-['Inter'] font-normal text-[14px] leading-[17px] uppercase"
                style={{
                  background: 'linear-gradient(116.74deg, #FFE5D4 5.37%, #404040 94.63%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                PRO
              </span>
              <span className="font-['Instrument_Serif'] text-[24px] text-white mt-1">{proPriceDisplay}</span>
            </div>
          </div>

          {/* Row 1: UX library access */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              UX library access
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* Row 2: Screen-level UX insights */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Screen-level UX insights
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* Row 3: Benchmarks per month */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Benchmarks per month
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white">
              1
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white bg-white/[0.02]">
              10
            </div>
          </div>

          {/* Row 4: Benchmark reports */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Benchmark reports
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white">
              Basic
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white bg-white/[0.02]">
              Full
            </div>
          </div>

          {/* Row 5: AI hotspots */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              AI hotspots
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white">
              Limited
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* Row 6: Ask AI */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Ask AI
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 font-['Inter'] font-normal text-[14px] text-white">
              Limited
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* Row 7: Confidence scores */}
          <div className="grid grid-cols-12 border-b border-[#242424] min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Confidence scores
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* Row 8: Saved reports */}
          <div className="grid grid-cols-12 min-h-[61px] items-center">
            <div className="col-span-4 px-4 md:px-5 font-['Inter'] font-medium text-[14px] text-white">
              Saved reports
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4">
              <div className="w-[15px] h-[1px] bg-white/40" />
            </div>
            <div className="col-span-4 border-l border-[#242424] flex justify-center items-center py-4 bg-white/[0.02]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shadow-[inset_2px_2px_1.5px_rgba(255,255,255,0.06)] border border-white/20">
                <svg width="12" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 3.8L3.5 6.3L9 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing fine print */}
        <p className="mt-[20px] font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] text-[#6A6A6A] text-center max-w-[758px]">
          All prices are monthly and billed according to the billing cycle selected at checkout. Any applicable sales tax will be added at checkout based on your location.
        </p>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="w-full max-w-[1052px] flex flex-col md:flex-row items-start justify-between gap-12 mt-[120px] mb-[120px] px-4">
        {/* Left Column: Heading & Contact Card */}
        <div className="flex flex-col gap-8 w-full md:w-[280px] shrink-0">
          <div>
            <div 
              className="inline-flex h-[24px] px-[12px] rounded-[47px] items-center justify-center font-['Inter'] font-normal text-[14px] leading-[17px] tracking-[-0.04em] text-white mb-3"
              style={{
                background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(90, 90, 90, 0.73) 84.41%)',
                boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
                backdropFilter: 'blur(7.2px)',
              }}
            >
              Things worth knowing
            </div>
            <h2 className="font-['Instrument_Serif'] font-normal text-[44px] leading-[57px] text-white">
              Frequently Asked Questions
            </h2>
          </div>

          {/* Need Help Card (Frame 2147230868) */}
          <div 
            className="w-full h-[250px] rounded-[20px] p-6 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(16, 16, 16, 0.73) 84.41%)',
              boxShadow: '0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)',
              backdropFilter: 'blur(7.2px)',
            }}
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>

            <div>
              <h4 className="font-['Inter'] font-medium text-[18px] text-white mb-1">Need help?</h4>
              <p className="font-['Inter'] font-normal text-[14px] text-[#BABABA] leading-relaxed">
                Please don't hesitate to reach out to our design and support team.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = 'mailto:support@zibo.design'}
              className="w-full h-[44px] bg-[#171717] hover:bg-[#222222] border border-[#323232] rounded-[9999px] flex items-center justify-center font-['Inter'] font-medium text-[14px] text-white transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Right Column: Accordions */}
        <div className="flex-1 w-full flex flex-col gap-4">
          {faqItems.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index}
                className="w-full border-b border-[#282828] pb-4 transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left py-3 cursor-pointer group"
                >
                  <span className="font-['Inter'] font-medium text-[18px] text-white group-hover:text-[#FF924A] transition-colors">
                    {item.q}
                  </span>
                  <div className="w-[30px] h-[30px] flex items-center justify-center text-white/70 group-hover:text-white">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <p className="font-['Inter'] font-normal text-[16px] leading-[22px] text-[#BABABA] pt-2 pb-2">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
