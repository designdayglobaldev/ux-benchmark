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
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] p-0 border-none bg-transparent overflow-hidden rounded-[16px] shadow-2xl gap-0">
        <div className="flex flex-col md:flex-row w-full min-h-[500px] bg-black">
          {/* Left Side - Cyan */}
          <div className="hidden md:block w-1/2 bg-[#38bdf8]" />
          
          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
            <h2 className="text-white text-[24px] sm:text-[28px] font-semibold mb-4 leading-tight">
              Submit Product Request
            </h2>
            <p className="text-[#9CA3AF] text-[15px] sm:text-[16px] mb-8 leading-relaxed">
              We will create the UX benchmark library for the most demanded apps as per request.
            </p>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[#D6A97B] text-[14px] sm:text-[15px]">Email</label>
                <input
                  type="email"
                  placeholder="hi@example.com"
                  className="w-full bg-[#1A1A1A] border-none rounded-[12px] px-4 py-3.5 text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#D6A97B] text-[14px] sm:text-[15px]">Full Name</label>
                <input
                  type="text"
                  placeholder="Mark Mathers"
                  className="w-full bg-[#1A1A1A] border-none rounded-[12px] px-4 py-3.5 text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#D6A97B] text-[14px] sm:text-[15px]">Product link</label>
                <input
                  type="text"
                  placeholder="app.apple.com/yapp-name"
                  className="w-full bg-[#1A1A1A] border-none rounded-[12px] px-4 py-3.5 text-[#EAEAEA] placeholder:text-[#A1A1A1] outline-none"
                />
              </div>

              <button className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[15px] sm:text-[16px] font-medium rounded-[12px] py-3.5 mt-2 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
