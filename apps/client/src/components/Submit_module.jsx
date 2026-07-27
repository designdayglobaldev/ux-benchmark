import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SubmitModule({ children }) {
  return (
    <Dialog>
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
              Submit Product Request
            </h2>
            <p className="text-[#9CA3AF] text-[11px] sm:text-[12px] mb-5 leading-snug">
              We will create the UX benchmark library for the most demanded apps as per request.
            </p>

            <div className="space-y-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#A1A1A1] text-[11px]">Email</label>
                <input
                  type="email"
                  placeholder="hi@example.com"
                  className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#A1A1A1] text-[11px]">Full Name</label>
                <input
                  type="text"
                  placeholder="Mark Mathers"
                  className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#A1A1A1] text-[11px]">Product link</label>
                <input
                  type="text"
                  placeholder="app.apple.com/yapp-name"
                  className="w-full bg-[#1A1A1A] border-none rounded-[6px] px-3 py-2 text-[12px] text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <button className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[12px] font-medium rounded-[6px] py-2 mt-1 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
