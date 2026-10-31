import React from "react";

interface StartBenchmarkButtonProps {
  onClick?: () => void;
  className?: string;
}

export const StartBenchmarkButton: React.FC<StartBenchmarkButtonProps> = ({
  onClick,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 p-0 m-0 border-0 cursor-pointer transition-transform hover:opacity-95 active:scale-[0.98] flex items-center justify-center outline-none relative overflow-hidden ${className}`}
      title="Start a Benchmark"
      style={{
        width: "199px",
        height: "37px",
        borderRadius: "8px",
        backgroundColor: "#1A1A1A",
        isolation: "isolate",
        padding: "10px",
        gap: "5px"
      }}
    >
      {/* Rectangle 1321321309: Linear Gradient Base */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "199px",
          height: "48px",
          left: "0px",
          top: "0px",
          background: "linear-gradient(96.75deg, #FF7213 0.78%, #EF27A3 99.22%)",
          zIndex: 0
        }}
      />

      {/* Rectangle 1321321310: Blur 1 (#B545BA) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60px",
          height: "60px",
          left: "-40px",
          top: "-6px",
          background: "#B545BA",
          filter: "blur(19.5px)",
          borderRadius: "47px",
          zIndex: 1
        }}
      />

      {/* Rectangle 1321321311: Blur 2 (#F0AC23) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60px",
          height: "60px",
          left: "23.75px",
          top: "31px",
          background: "#F0AC23",
          filter: "blur(19.5px)",
          borderRadius: "30px",
          zIndex: 2
        }}
      />

      {/* Rectangle 1321321312: Blur 3 (#B545B9) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60px",
          height: "60px",
          left: "73.98px",
          top: "-38.98px",
          background: "#B545B9",
          filter: "blur(19.5px)",
          borderRadius: "47px",
          zIndex: 3
        }}
      />

      {/* Rectangle 1321321313: Blur 4 (#FC3070) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60px",
          height: "60px",
          left: "129px",
          top: "24px",
          background: "#FC3070",
          filter: "blur(19.5px)",
          borderRadius: "47px",
          zIndex: 4
        }}
      />

      {/* Frame Inner Shadow Overlay (Dual inner highlights from Figma) */}
      <div
        className="absolute inset-0 rounded-[8px] pointer-events-none"
        style={{
          boxShadow: "inset 1px 2px 2px rgba(255, 255, 255, 0.38), inset 0px -2px 1px rgba(255, 255, 255, 0.36)",
          zIndex: 5
        }}
      />

      {/* Start a Benchmark Text */}
      <span
        className="relative font-medium text-white select-none pointer-events-none flex items-center justify-center"
        style={{
          width: "125px",
          height: "17px",
          fontFamily: "'Inter', sans-serif",
          fontStyle: "normal",
          fontWeight: 500,
          fontSize: "14px",
          lineHeight: "17px",
          textAlign: "center",
          color: "#FFFFFF",
          zIndex: 6
        }}
      >
        Start a Benchmark
      </span>
    </button>
  );
};

