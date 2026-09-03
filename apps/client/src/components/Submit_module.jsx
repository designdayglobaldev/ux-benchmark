import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SubmitModule({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [productLink, setProductLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email || !fullName || !productLink) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/app-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fullName, productLink }),
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
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] md:max-w-[560px] p-0 border-none bg-transparent overflow-hidden rounded-[16px] shadow-2xl gap-0">
        <div className="flex flex-col md:flex-row w-full min-h-[340px] bg-black">
          {/* Left Side - Cyan */}
          <div className="hidden md:block w-[240px] bg-[#38bdf8]" />
          
          {/* Right Side - Form */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
            <h2 className="text-white text-[16px] sm:text-[18px] font-semibold mb-2 leading-tight">
              Request App
            </h2>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mb-5 leading-snug">
              We will create the UX benchmark library for the most demanded apps as per request.
            </p>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-sm">Request submitted successfully!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {error && <p className="text-red-500 text-[11px]">{error}</p>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#A1A1A1] text-[11px]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hi@example.com"
                    className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#A1A1A1] text-[11px]">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mark Mathers"
                    className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#A1A1A1] text-[11px]">Product link</label>
                  <input
                    type="text"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    placeholder="app.apple.com/yapp-name"
                    className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                  />
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[12px] font-medium rounded-[6px] py-2 mt-1 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
