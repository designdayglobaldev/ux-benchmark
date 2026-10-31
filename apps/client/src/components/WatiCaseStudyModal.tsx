import React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from "./ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Play } from "lucide-react";
import vsIconsGroup from "../assets/vs.png";

interface WatiCaseStudyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WatiCaseStudyModal: React.FC<WatiCaseStudyModalProps> = ({
  open,
  onOpenChange,
}) => {
  const repeatedText =
    "Welcome back a country-code phone field with a disabled Continue, an account-recovery link. Welcome back a country-code phone field with a disabled Continue, an account-recovery link.Welcome back a country-code phone field with a disabled Continue, an account-recovery link.Welcome back a country-code phone field with a disabled Continue, an account-recovery link.Welcome back a country-code phone field with a disabled Continue, an account-recovery link.Welcome back a country-code phone field with a disabled Continue, an account-recovery link.Welcome back a country-code phone field with a disabled Continue, an account-recovery link.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Backdrop Overlay */}
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-dialog-overlay" />

        {/* Modal Outer Container: Group 2134283882 (1148px x 768px centered) */}
        <DialogPrimitive.Content 
          className="fixed left-[50%] top-[50%] z-50 outline-none focus:outline-none animate-dialog-content will-change-transform"
          style={{
            width: "1148px",
            height: "768px"
          }}
        >
          {/* Circular Close Button: Frame 2147227829 (48px x 48px, top right) */}
          <DialogPrimitive.Close
            className="absolute top-0 right-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 outline-none z-50"
            style={{
              width: "48px",
              height: "48px",
              background: "#27272A",
              borderRadius: "35.2663px",
              border: "none"
            }}
            title="Close"
          >
            <X size={16} color="#FFFFFF" strokeWidth={1.5} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Modal Card Surface: Frame 2147227987 (1091px x 768px, radius 12px, background #141414) */}
          <div
            className="absolute left-0 bottom-0 top-0 overflow-y-auto no-scrollbar"
            style={{
              width: "1091px",
              height: "768px",
              background: "#141414",
              borderRadius: "12px",
              padding: "60px 60px 60px 60px",
              boxSizing: "border-box"
            }}
          >
            {/* Header: 5 minute read + Title (Frame 2147231010) */}
            <div 
              className="flex flex-col items-start"
              style={{
                width: "782.22px",
                height: "84px",
                gap: "9px"
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "17px",
                  letterSpacing: "-0.24px",
                  color: "#B6B6B6"
                }}
              >
                5 minute read
              </span>

              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: "24px",
                  lineHeight: "29px",
                  color: "#FFFFFF",
                  margin: 0
                }}
              >
                How Wati App got 12% faster design approvals by benchmarking with industry leaders
              </h2>
            </div>

            {/* Tag / Comparison Pill: Frame 2147230996 (WATI VS [Icons]) */}
            <div 
              className="flex items-center"
              style={{
                gap: "7.41px",
                height: "14.83px",
                marginTop: "20px"
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "11.52px",
                  lineHeight: "14px",
                  letterSpacing: "2.67px",
                  color: "#858585"
                }}
              >
                WATI
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "11.52px",
                  lineHeight: "14px",
                  letterSpacing: "-0.63px",
                  color: "#858585"
                }}
              >
                VS
              </span>

              <img 
                src={vsIconsGroup} 
                alt="Competitor apps" 
                className="h-[14.83px] w-auto object-contain"
              />
            </div>

            {/* Video / UI Preview Player: Frame 2147231012 (971px x 459px) */}
            <div 
              className="flex flex-col items-start"
              style={{
                width: "971px",
                height: "459px",
                gap: "12px",
                marginTop: "30px"
              }}
            >
              {/* Frame 2147231011: Video player screen (971px x 430px) */}
              <div
                className="w-full relative flex items-center justify-center cursor-pointer group transition-colors hover:bg-[#222222]"
                style={{
                  height: "430px",
                  background: "#1D1D1D",
                  borderRadius: "12px"
                }}
              >
                {/* Play Button Icon: Polygon 2 (43px x 43px, #D9D9D9, radius 5px) */}
                <div
                  className="flex items-center justify-center transition-transform group-hover:scale-110 active:scale-95 shadow-lg"
                  style={{
                    width: "43px",
                    height: "43px",
                    background: "#D9D9D9",
                    borderRadius: "5px"
                  }}
                >
                  <Play size={20} fill="#1D1D1D" color="#1D1D1D" className="ml-1" />
                </div>
              </div>

              {/* Caption: UI example : Transfer flow */}
              <span
                style={{
                  width: "971px",
                  height: "17px",
                  fontFamily: "'Inter', sans-serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "17px",
                  letterSpacing: "-0.24px",
                  color: "#B6B6B6"
                }}
              >
                UI example : Transfer flow
              </span>
            </div>

            {/* Section 1: The Problem (Frame 2147231013) */}
            <div 
              className="flex flex-col items-start"
              style={{
                width: "971px",
                gap: "13px",
                marginTop: "36px"
              }}
            >
              <h3
                style={{
                  width: "971px",
                  height: "24px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  lineHeight: "24px",
                  color: "#FFFFFF",
                  margin: 0
                }}
              >
                The Problem
              </h3>
              <p
                style={{
                  width: "971px",
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "18px",
                  textAlign: "justify",
                  color: "#989898",
                  margin: 0
                }}
              >
                {repeatedText}
              </p>
            </div>

            {/* Section 2: The Solution (Frame 2147231014) */}
            <div 
              className="flex flex-col items-start"
              style={{
                width: "971px",
                gap: "13px",
                marginTop: "28px"
              }}
            >
              <h3
                style={{
                  width: "971px",
                  height: "24px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  lineHeight: "24px",
                  color: "#FFFFFF",
                  margin: 0
                }}
              >
                The Solution
              </h3>
              <p
                style={{
                  width: "971px",
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "18px",
                  textAlign: "justify",
                  color: "#989898",
                  margin: 0
                }}
              >
                {repeatedText}
              </p>
            </div>

            {/* Section 3: Usecases (Frame 2147231015) */}
            <div 
              className="flex flex-col items-start"
              style={{
                width: "971px",
                gap: "13px",
                marginTop: "28px",
                paddingBottom: "30px"
              }}
            >
              <h3
                style={{
                  width: "971px",
                  height: "24px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: "20px",
                  lineHeight: "24px",
                  color: "#FFFFFF",
                  margin: 0
                }}
              >
                Usecases
              </h3>
              <p
                style={{
                  width: "971px",
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 300,
                  fontSize: "14px",
                  lineHeight: "18px",
                  textAlign: "justify",
                  color: "#989898",
                  margin: 0
                }}
              >
                {repeatedText}
              </p>
            </div>

          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
