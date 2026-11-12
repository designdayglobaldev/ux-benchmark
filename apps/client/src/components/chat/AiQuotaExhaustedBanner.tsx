import React from "react";

interface AiQuotaExhaustedBannerProps {
  onUpgradeClick?: () => void;
  className?: string;
}

export const AiQuotaExhaustedBanner: React.FC<AiQuotaExhaustedBannerProps> = ({
  onUpgradeClick,
  className = "",
}) => {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-between transition-all select-none ${className}`}
      style={{
        boxSizing: "border-box",
        width: "456px",
        height: "65px",
        background: "linear-gradient(96.72deg, #2C2C2C 0.02%, #050505 99.98%)",
        borderRadius: "14px",
        padding: "0 12px 0 17px",
      }}
    >
      {/* Background Ambient Glow (Group 2134283850) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "130.77px",
          height: "89.24px",
          right: "0px",
          top: "-7.73px",
          opacity: 0.78,
          zIndex: 0,
        }}
      >
        {/* Vector 401: Amber Glow */}
        <div
          className="absolute"
          style={{
            width: "104.68px",
            height: "40.98px",
            left: "0px",
            top: "0px",
            background: "#FBAF52",
            mixBlendMode: "plus-lighter",
            opacity: 0.7,
            filter: "blur(19.8px)",
          }}
        />
        {/* Vector 402: Purple/Magenta Glow */}
        <div
          className="absolute"
          style={{
            width: "130.77px",
            height: "62.03px",
            right: "0px",
            top: "19.48px",
            background: "#D212F0",
            mixBlendMode: "plus-lighter",
            opacity: 0.7,
            filter: "blur(27.25px)",
            transform: "rotate(-180deg)",
          }}
        />
      </div>

      {/* Frame 2147230985: Left Text Column */}
      <div
        className="flex flex-col items-start gap-1 z-10"
        style={{
          width: "331.95px",
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "16px",
            letterSpacing: "-0.24px",
            color: "#FFFFFF",
          }}
        >
          You have reached your daily limit
        </span>

        {/* Subtitle */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "16px",
            letterSpacing: "-0.24px",
            color: "#6A6A6A",
          }}
        >
          Upgrade your plan to unlock full access and keep using Zibo.
        </span>
      </div>

      {/* Frame 2147227860: Right Pill Upgrade Button */}
      <button
        type="button"
        onClick={onUpgradeClick}
        className="relative cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shrink-0 z-10 overflow-hidden"
        style={{
          boxSizing: "border-box",
          width: "115px",
          height: "36px",
          background:
            "linear-gradient(222.07deg, rgba(31, 31, 31, 0.73) 15.12%, rgba(90, 90, 90, 0.73) 84.41%)",
          boxShadow:
            "0px 4px 6.8px rgba(0, 0, 0, 0.25), inset -1px -0.5px 0.5px rgba(156, 156, 156, 0.63), inset 1px 0.5px 0.5px rgba(83, 83, 83, 0.63)",
          backdropFilter: "blur(7.2px)",
          WebkitBackdropFilter: "blur(7.2px)",
          borderRadius: "47px",
          border: "none",
          outline: "none",
        }}
      >
        {/* Vector 401 Glow inside Button */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "29.17px",
            height: "22.47px",
            left: "-3.77px",
            top: "-1.73px",
            background: "#FBAF52",
            mixBlendMode: "plus-lighter",
            opacity: 0.7,
            filter: "blur(10.5px)",
            zIndex: 1,
          }}
        />

        {/* Vector 402 Glow inside Button */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "23.58px",
            height: "18.16px",
            right: "0px",
            top: "20.73px",
            background: "#D212F0",
            mixBlendMode: "plus-lighter",
            opacity: 0.7,
            filter: "blur(10.55px)",
            transform: "rotate(-180deg)",
            zIndex: 2,
          }}
        />

        {/* Upgrade Button Text */}
        <span
          className="relative z-10"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: "17px",
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          Upgrade
        </span>
      </button>
    </div>
  );
};

