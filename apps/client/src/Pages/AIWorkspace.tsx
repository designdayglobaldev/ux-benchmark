import { useState } from "react";
import { 
  Plus, 
  ChevronRight, 
  ArrowUp,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import leftCardImage from "../assets/leftcardimagewithsocialmedia.png";
import rightCardImage from "../assets/rightcard.png";
import { ZiboAiIcon } from "../components/ZiboAiIcon";
import { StartBenchmarkButton } from "../components/StartBenchmarkButton";
import { WatiCaseStudyModal } from "../components/WatiCaseStudyModal";
import { AIResearchResults } from "../components/AIResearchResults";

export function AIWorkspace() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [activeResearch, setActiveResearch] = useState<string | null>(null);
  const [watiModalOpen, setWatiModalOpen] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);

  const recentResearches = [
    "Why do Revolut and Cash App convert 3x more KYC onboarding than traditional banking apps?"
  ];

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setActiveResearch(trimmed);
    setConversationHistory(prev => [...prev, { role: "user", content: trimmed }]);
    setInputValue("");
  };

  const handleNewResearch = () => {
    setActiveResearch(null);
    setSubmittedQuery(null);
    setInputValue("");
    setConversationHistory([]);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full max-w-full bg-[#000000] text-white overflow-hidden font-sans">
      
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR PANEL (Exact Figma: Left 43px, Top 42px)      */}
      {/* ============================================================ */}
      <aside 
        className="shrink-0 bg-[#000000] flex flex-col justify-between z-10"
        style={{
          width: "280.62px",
          minWidth: "280.62px",
          maxWidth: "280.62px",
          paddingLeft: "43px",
          paddingTop: "42px",
          paddingRight: "38.62px",
          paddingBottom: "24px"
        }}
      >
        <div className="w-[199px] flex flex-col gap-3">
          
          {/* Top CTA: Start a Benchmark */}
          <StartBenchmarkButton onClick={() => navigate("/benchmark")} />

          {/* Secondary CTA: + New Research */}
          <button
            onClick={handleNewResearch}
            className="w-[199px] h-[38px] rounded-[8px] text-[13px] font-medium text-white transition-all flex items-center justify-center gap-[10px] cursor-pointer shrink-0 hover:bg-[#202020]"
            style={{
              backgroundColor: "#171717",
              border: "1px solid #323232",
              boxSizing: "border-box"
            }}
          >
            <Plus size={14} className="text-[#AAAAAA]" />
            <span>New Research</span>
          </button>

          {/* Recent Researches Section */}
          <div className="mt-4 flex flex-col gap-2">
            <span 
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                color: "#7E7E7E",
                paddingLeft: "4px"
              }}
            >
              Recent Researches
            </span>

            <div className="flex flex-col gap-1.5 mt-0.5">
              {recentResearches.map((item, idx) => {
                const isSelected = (submittedQuery === item) || (activeResearch === item);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(item);
                      handleSearchSubmit(item);
                    }}
                    className="w-[199px] h-[36px] px-3 rounded-[8px] text-[13px] transition-all truncate text-left cursor-pointer flex items-center"
                    style={{
                      backgroundColor: isSelected ? "#181818" : "transparent",
                      color: isSelected ? "#FFFFFF" : "#999999",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 400
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "#181818";
                        e.currentTarget.style.color = "#FFFFFF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#999999";
                      }
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </aside>

      {/* ============================================================ */}
      {/* 2. CENTER HERO STAGE & RESEARCH CANVAS (Frame 2147230977)    */}
      {/* ============================================================ */}
      <main 
        className="flex-1 flex flex-col justify-between relative px-4 sm:px-8 py-7 overflow-y-auto overflow-x-hidden my-[19px] mr-[24px] min-w-0 max-w-full"
        style={{
          backgroundColor: "#161616",
          borderRadius: "16px"
        }}
      >
        
        {/* Subtle Ambient Background Glow */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] pointer-events-none rounded-full blur-[140px] opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(142, 68, 243, 0.45) 0%, rgba(255, 46, 121, 0.25) 50%, transparent 80%)"
          }}
        />

        {/* Center Dynamic Content: Either Response Screen OR Default Recommendations */}
        {!submittedQuery ? (
          /* ================= DEFAULT RECOMMENDATIONS VIEW ================= */
          <div className="w-full max-w-[840px] mx-auto flex flex-col items-center my-auto z-10">
            
            {/* Bento Recommendations Grid */}
            <div className="flex flex-col items-center gap-3.5" style={{ width: "668px" }}>
              
              {/* Top Row (2 Cards) */}
              <div className="flex items-center justify-between w-full">
                
                {/* Card 1: Benchmark Evidence (Exact 1:1 Figma Specs) */}
                <div 
                  onClick={() => navigate("/benchmark")}
                  className="group relative cursor-pointer overflow-hidden transition-transform hover:scale-[1.01]"
                  style={{
                    boxSizing: "border-box",
                    width: "324px",
                    height: "249px",
                    background: "#131313",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  {/* Top Row: Title & Arrow Button (Frame 2147230992) */}
                  <div 
                    className="absolute flex items-center justify-between"
                    style={{
                      height: "34px",
                      left: "18px",
                      right: "18px",
                      top: "16.12px",
                      gap: "20px"
                    }}
                  >
                    <p 
                      style={{
                        width: "244px",
                        height: "34px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "17px",
                        letterSpacing: "-0.24px",
                        color: "#FFFFFF"
                      }}
                    >
                      Get a benchmark evidence for faster design approvals
                    </p>

                    <div 
                      className="flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#323238]"
                      style={{
                        width: "24px",
                        height: "24px",
                        background: "#27272A",
                        borderRadius: "17.6331px"
                      }}
                    >
                      <ChevronRight size={14} color="#FFFFFF" />
                    </div>
                  </div>

                  {/* Frame 2147231008: Left Card Preview Graphic (Connected to bottom) */}
                  <div 
                    className="absolute pointer-events-none overflow-hidden"
                    style={{
                      width: "271px",
                      bottom: "0px",
                      left: "26.5px"
                    }}
                  >
                    <img 
                      src={leftCardImage} 
                      alt="Benchmark evidence preview" 
                      className="w-full h-auto block object-contain object-bottom"
                    />
                  </div>
                </div>

                {/* Card 2: Explore UX Breakdowns (Exact Figma Specs) */}
                <div 
                  onClick={() => navigate("/apps")}
                  className="group relative cursor-pointer overflow-hidden transition-transform hover:scale-[1.01]"
                  style={{
                    boxSizing: "border-box",
                    width: "324px",
                    height: "249px",
                    background: "#131313",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                >
                  {/* Frame 2147230992: Title & Caret Button */}
                  <div 
                    className="absolute flex items-center justify-between"
                    style={{
                      height: "34px",
                      left: "18px",
                      right: "18px",
                      top: "16.12px",
                      gap: "20px"
                    }}
                  >
                    <p 
                      style={{
                        width: "244px",
                        height: "34px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "17px",
                        letterSpacing: "-0.24px",
                        color: "#FFFFFF"
                      }}
                    >
                      Explore UX breakdowns to understand &amp; convince stakeholders
                    </p>

                    <div 
                      className="flex items-center justify-center shrink-0 transition-colors group-hover:bg-[#323238]"
                      style={{
                        width: "24px",
                        height: "24px",
                        background: "#27272A",
                        borderRadius: "17.6331px"
                      }}
                    >
                      <ChevronRight size={14} color="#FFFFFF" />
                    </div>
                  </div>

                  {/* Frame 2147231008: Right Card Preview Graphic (Connected to bottom) */}
                  <div 
                    className="absolute pointer-events-none overflow-hidden"
                    style={{
                      width: "271px",
                      bottom: "0px",
                      left: "26.5px"
                    }}
                  >
                    <img 
                      src={rightCardImage} 
                      alt="UX Breakdown Preview" 
                      className="w-full h-auto block object-contain object-bottom"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Bento Section: Left aligned with first card */}
            <div className="flex flex-col items-start gap-4 mt-5" style={{ width: "668px" }}>
              
              {/* Try Benchmark Mode Link */}
              <Link 
                to="/benchmark" 
                className="inline-block transition-opacity hover:opacity-90"
                style={{
                  width: "135px",
                  height: "16px",
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "16px",
                  textAlign: "left",
                  letterSpacing: "-0.24px",
                  textDecorationLine: "underline",
                  background: "linear-gradient(92.38deg, #FFC7A2 1.05%, #A873E8 98.95%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textDecorationColor: "#A873E8"
                }}
              >
                Try Benchmark Mode
              </Link>

              {/* Group 2134283854: Wati Case Study Card */}
              <div 
                onClick={() => setWatiModalOpen(true)}
                className="group relative cursor-pointer overflow-hidden transition-transform hover:scale-[1.01]"
                style={{
                  boxSizing: "border-box",
                  width: "342px",
                  height: "116px",
                  background: "#202020",
                  borderRadius: "15.8915px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                {/* Headline */}
                <p
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: 500,
                    fontSize: "15px",
                    lineHeight: "18px",
                    color: "#FFFFFF",
                    margin: 0
                  }}
                >
                  How Wati App got 12% faster design approvals by benchmarking with industry leaders
                </p>

                {/* Bottom Row: Wati VS [Icons] */}
                <div className="flex items-center gap-[14px]">
                  <span
                    style={{
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 500,
                      fontSize: "15px",
                      lineHeight: "18px",
                      letterSpacing: "-0.277241px",
                      color: "#FFFFFF"
                    }}
                  >
                    Wati
                  </span>

                  <span
                    style={{
                      fontFamily: "'Geist', sans-serif",
                      fontWeight: 500,
                      fontSize: "15px",
                      lineHeight: "18px",
                      letterSpacing: "-0.277241px",
                      color: "rgba(255, 255, 255, 0.45)"
                    }}
                  >
                    VS
                  </span>

                  {/* Overlapping Competitor Icons */}
                  <div className="flex items-center">
                    {/* Airbnb */}
                    <div 
                      className="w-[22.78px] h-[22.78px] rounded-[16.4px] bg-[#FF5A5F] flex items-center justify-center border-[0.85px] border-white/20 shrink-0 shadow-sm"
                      style={{ margin: "0px -5.09px 0 0", zIndex: 1 }}
                    >
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>

                    {/* Coinbase */}
                    <div 
                      className="w-[22.78px] h-[22.78px] rounded-[16.4px] bg-[#0052FF] flex items-center justify-center border-[0.85px] border-white/20 shrink-0 shadow-sm font-bold text-white text-[11px]"
                      style={{ margin: "0px -5.09px 0 0", zIndex: 2 }}
                    >
                      C
                    </div>

                    {/* Duolingo */}
                    <div 
                      className="w-[22.78px] h-[22.78px] rounded-[16.4px] bg-[#58CC02] flex items-center justify-center border-[0.85px] border-white/20 shrink-0 shadow-sm font-bold text-white text-[10px]"
                      style={{ zIndex: 3 }}
                    >
                      🦉
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ================= ACTIVE AI RESPONSE SCREEN ================= */
          <AIResearchResults 
            submittedQuery={submittedQuery} 
            conversationHistory={conversationHistory}
            onSelectFollowUp={(q) => {
              handleSearchSubmit(q);
            }}
          />
        )}

        {/* ============================================================ */}
        {/* 3. FLOATING GLOWING BOTTOM AI COMMAND BAR (Exact 1:1 Figma CSS Group 2134283849) */}
        <div className="relative z-20 mt-6 mb-2 flex items-center justify-center shrink-0 self-center" style={{ width: "456px", height: "123.84px" }}>
          
          {/* Shadow (Ambient Multi-color Glow) */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: "452px",
              height: "114.47px",
              left: "2px",
              top: "9.38px",
              background: "linear-gradient(90.01deg, #FF924A 34.09%, #6396ED 67.61%, #F612A6 98.31%)",
              opacity: 0.64,
              filter: "blur(11.55px)",
              borderRadius: "20px",
              zIndex: 0
            }}
          />

          {/* Frame 2147230971 (Outer Glass Frame) */}
          <div
            className="relative"
            style={{
              width: "456px",
              height: "118px",
              background: "rgba(255, 255, 255, 0.18)",
              borderRadius: "20px",
              zIndex: 1
            }}
          >
            {/* Rectangle 1321321425 (Inner Dark Gradient Surface) */}
            <div
              className="absolute"
              style={{
                left: "3.5px",
                right: "3.5px",
                top: "3.5px",
                bottom: "3.5px",
                background: "linear-gradient(96.72deg, #2C2C2C 0.02%, #050505 99.98%)",
                borderRadius: "17px"
              }}
            >
              {/* Zibo AI Symbol SVG */}
              <div
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  width: "23px",
                  height: "23px",
                  left: "17.47px",
                  top: "13.87px"
                }}
              >
                <ZiboAiIcon size={23} />
              </div>

              {/* Input "Ask how your design is blocking you" */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    handleSearchSubmit(inputValue.trim());
                  }
                }}
                placeholder={submittedQuery ? "Ask how your design is blocking you" : "Ask how your design is blocking you"}
                className="absolute bg-transparent text-white focus:outline-none placeholder:text-[rgba(255,255,255,0.6)]"
                style={{
                  left: "53.08px",
                  top: "16.9px",
                  right: "16px",
                  height: "16px",
                  fontFamily: "'Geist', 'Inter', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "16px",
                  letterSpacing: "-0.24px"
                }}
              />

              {/* Frame 2147230972: Plus Button */}
              <button
                type="button"
                onClick={() => navigate("/benchmark")}
                className="absolute cursor-pointer flex items-center justify-center transition-colors hover:bg-[#4A4A4A]"
                style={{
                  boxSizing: "border-box",
                  width: "32px",
                  height: "32px",
                  left: "10.5px",
                  top: "68.5px",
                  background: "#3C3C3C",
                  border: "1px solid #4F4F4F",
                  borderRadius: "17px"
                }}
                title="Upload screenshot or benchmark"
              >
                <Plus size={16} color="#E3E3E3" strokeWidth={2} />
              </button>

              {/* Frame 2147230973: Research Mode Pill */}
              <div
                className="absolute flex items-center"
                style={{
                  gap: "5px",
                  left: "54.5px",
                  top: "76.5px",
                  height: "16px"
                }}
              >
                {/* Binoculars Icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="binocGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="18.7%" stopColor="#F48E4A" />
                      <stop offset="97.74%" stopColor="#A873E8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M7 6C4.79 6 3 7.79 3 10V18C3 19.1 3.9 20 5 20C6.1 20 7 19.1 7 18V6ZM17 6C14.79 6 13 7.79 13 10V18C13 19.1 13.9 20 15 20C16.1 20 17 19.1 17 18V6Z"
                    fill="url(#binocGrad)"
                  />
                  <rect x="7" y="10" width="6" height="2" rx="1" fill="url(#binocGrad)" />
                </svg>
                <span
                  style={{
                    fontFamily: "'Geist', 'Inter', sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "16px",
                    letterSpacing: "-0.24px",
                    background: "linear-gradient(92.38deg, #F98537 1.05%, #A873E8 98.95%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  Research mode
                </span>
              </div>

              {/* Button: Send / Up Button */}
              <button
                type="button"
                disabled={!inputValue.trim()}
                onClick={() => {
                  if (inputValue.trim()) {
                    handleSearchSubmit(inputValue.trim());
                  }
                }}
                className={`absolute cursor-pointer flex items-center justify-center transition-all ${
                  inputValue.trim() ? "hover:opacity-90 active:scale-95" : "opacity-80 cursor-default"
                }`}
                style={{
                  boxSizing: "border-box",
                  width: "32px",
                  height: "32px",
                  left: "406.5px",
                  top: "68.5px",
                  background: "linear-gradient(142.66deg, #FFFFFF 5.13%, #C6C6C6 94.87%)",
                  boxShadow: "inset 0.5px 0.5px 0.5px rgba(99, 99, 99, 0.56)",
                  borderRadius: "28px",
                  border: "none",
                  outline: "none"
                }}
              >
                <ArrowUp size={15} color="#1A1A1A" strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Wati Case Study Modal Popup (Exact Figma Specs) */}
      <WatiCaseStudyModal 
        open={watiModalOpen} 
        onOpenChange={setWatiModalOpen} 
      />

    </div>
  );
}
export default AIWorkspace;

