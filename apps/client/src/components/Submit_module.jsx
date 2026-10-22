import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import requestAppImg from "@/assets/request-app.png";
import Logo from "@/assets/Logo.png";
import { Check, Loader2, X } from "lucide-react";

export function SubmitModule({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !fullName || !productLink) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/v1/app-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          fullName: fullName.trim(),
          productLink: productLink.trim() 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit request');
      }
      
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setEmail('');
        setFullName('');
        setProductLink('');
      }, 2200);
    } catch (err) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent 
        className="max-w-[1043px] w-[95vw] sm:w-[1043px] p-0 border-none bg-transparent overflow-visible shadow-none gap-0 [&>button:last-child]:hidden focus:outline-none"
      >
        <div className="relative w-full">
          {/* Main Modal Card (Exact 1043x693 Frame) */}
          <div className="relative w-full h-auto md:h-[693px] rounded-[24px] overflow-hidden border border-[#2A2A2A] bg-[#141414] shadow-2xl flex flex-col md:flex-row min-h-[693px]">
            
            {/* Left Side: Visual graphic container with request-app.png & bottom tagline */}
            <div className="w-full md:w-[520px] lg:w-[540px] bg-gradient-to-br from-[#1d1620] via-[#141117] to-[#0A0A0A] relative flex flex-col justify-between p-8 sm:p-10 md:p-12 overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-[#222222]">
              {/* Background isometric mockups image */}
              <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <img 
                  src={requestAppImg} 
                  alt="Request App Preview" 
                  className="w-full h-full object-cover object-center scale-105 opacity-85 select-none pointer-events-none" 
                />
                {/* Gradient fade towards the bottom so text is crystal clear */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Spacer */}
              <div className="relative z-10" />

              {/* Bottom Tagline on Left Section (matching Figma Desktop - 149) */}
              <div className="relative z-10 mt-auto pt-24">
                <h3 className="font-serif text-white text-[22px] sm:text-[24px] font-normal leading-tight tracking-tight">
                  See how it stacks up.
                </h3>
                <p className="text-[#9E9E9E] text-[13px] sm:text-[14px] mt-1.5 font-normal leading-relaxed max-w-[320px]">
                  Get it in the library and benchmark your UI against it.
                </p>
              </div>
            </div>

            {/* Right Side: Header, Form & Footer */}
            <div className="flex-1 p-8 sm:p-10 md:p-12 flex flex-col justify-between bg-[#141414] relative">
              <div>
                {/* Header */}
                <h2 className="text-white text-[26px] sm:text-[30px] font-serif font-normal leading-tight tracking-tight max-w-[396px]">
                  Missing an app? Let’s bring it in.
                </h2>
                <p className="text-[#8E8E8E] text-[13px] sm:text-[14px] mt-2.5 mb-7 font-normal leading-relaxed max-w-[396px]">
                  Request apps to explore and benchmark. Your requests shape what joins the library.
                </p>

                {/* Form Content */}
                {success ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 max-w-[396px]">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white text-base font-medium">Request submitted!</h3>
                    <p className="text-[#888888] text-xs text-center max-w-xs">
                      Thank you! We have received your request and will review it shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-[10px] w-full max-w-[396px]">
                    {error && (
                      <div className="text-red-400 text-xs py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        {error}
                      </div>
                    )}

                    {/* Field 1: Enter e-mail */}
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter e-mail"
                        required
                        className="w-full h-[42px] px-[14px] py-[8px] bg-[#252424] border border-[#313131] rounded-[8px] text-[13px] text-white placeholder-[#707070] focus:border-[#555] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Field 2: Full name */}
                    <div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full name"
                        required
                        className="w-full h-[42px] px-[14px] py-[8px] bg-[#252424] border border-[#313131] rounded-[8px] text-[13px] text-white placeholder-[#707070] focus:border-[#555] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Field 3: App link (playstore/appstore) */}
                    <div>
                      <input
                        type="text"
                        value={productLink}
                        onChange={(e) => setProductLink(e.target.value)}
                        placeholder="App link (playstore/appstore)"
                        required
                        className="w-full h-[42px] px-[14px] py-[8px] bg-[#252424] border border-[#313131] rounded-[8px] text-[13px] text-white placeholder-[#707070] focus:border-[#555] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Submit Button (Slim H: 42px) */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[42px] bg-white hover:bg-neutral-200 text-black font-semibold text-[13px] rounded-[8px] transition-all active:scale-[0.99] cursor-pointer mt-1 flex items-center justify-center shadow-lg disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          Submitting...
                        </span>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Bottom Branding */}
              <div className="flex items-center gap-3.5 mt-8 pt-2">
                <img src={Logo} alt="Zibo" className="h-[22px] w-auto object-contain" />
                <div className="h-5 w-px bg-[#2E2E2E]" />
                <div className="text-[11px] text-[#666666] leading-tight font-normal">
                  <p>Know what works.</p>
                  <p>Know why.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Outside Close Button (positioned outside the top-right corner of the modal box, matching Figma) */}
          <DialogPrimitive.Close 
            type="button"
            aria-label="Close dialog"
            className="absolute -top-3 -right-14 sm:-right-16 w-11 h-11 rounded-full bg-[#252424] hover:bg-[#313131] border border-[#383838] flex items-center justify-center text-white/80 hover:text-white transition-all shadow-2xl cursor-pointer focus:outline-none z-50"
          >
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </div>
      </DialogContent>
    </Dialog>
  );
}
