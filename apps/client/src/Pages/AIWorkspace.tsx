import { useState, useEffect, useMemo } from "react";
import { 
  Plus,
  ChevronRight, 
  Trash2
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import leftCardImage from "../assets/leftcardimagewithsocialmedia.png";
import rightCardImage from "../assets/rightcard.png";
import { StartBenchmarkButton } from "../components/StartBenchmarkButton";
import { WatiCaseStudyModal } from "../components/WatiCaseStudyModal";
import { AIResearchResults } from "../components/AIResearchResults";
import { StickyChatInput } from "../components/chat/StickyChatInput";
import { useAuth } from "../contexts/AuthContext";
import { groupSessionsByDate } from "../utils/groupSessionsByDate";
import { useAIChatStore } from "../stores/useAIChatStore";

export function AIWorkspace() {
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  
  // Clean REST Route: /aiworkspace/c/:id
  const activeSessionId = params.id || null;
  const [watiModalOpen, setWatiModalOpen] = useState(false);

  // Single Source of Truth: Zustand Store
  const sessions = useAIChatStore((state) => state.sessions);
  const fetchSessions = useAIChatStore((state) => state.fetchSessions);
  const setActiveSession = useAIChatStore((state) => state.setActiveSession);
  const clearActiveSession = useAIChatStore((state) => state.clearActiveSession);
  const createAndSendPrompt = useAIChatStore((state) => state.createAndSendPrompt);
  const deleteSession = useAIChatStore((state) => state.deleteSession);

  const demoResearch = "Why do Revolut and Cash App convert 3x more KYC onboarding than traditional banking apps?";

  // Fetch past user sessions on mount
  const userId = user?.id;
  useEffect(() => {
    fetchSessions(userId);
  }, [userId, fetchSessions]);

  // Sync active session with route parameter
  useEffect(() => {
    if (activeSessionId) {
      setActiveSession(activeSessionId);
    } else {
      clearActiveSession();
    }
  }, [activeSessionId, setActiveSession, clearActiveSession]);

  // Deduplicate and group sessions (Twenty CRM pattern)
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(sessions);
  }, [sessions]);

  const handleSelectSession = (sessionId: string) => {
    navigate(`/aiworkspace/c/${sessionId}`);
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    createAndSendPrompt(query, navigate, user?.id);
  };

  const handleNewResearch = () => {
    clearActiveSession();
    navigate("/aiworkspace");
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await deleteSession(sessionId);
    if (activeSessionId === sessionId) {
      handleNewResearch();
    }
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

          {/* Recent Researches Section with Twenty CRM Date Grouping */}
          <div className="mt-4 flex flex-col gap-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
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
              {/* 1. Permanent Curated Demo Benchmark (Untouched & Always Pinned) */}
              <button
                onClick={() => {
                  navigate("/aiworkspace/c/demo-kyc-benchmark-revolut-cashapp");
                }}
                className="w-[199px] h-[36px] px-3 rounded-[8px] text-[13px] transition-all truncate text-left cursor-pointer flex items-center"
                style={{
                  backgroundColor: activeSessionId === "demo-kyc-benchmark-revolut-cashapp" ? "#181818" : "transparent",
                  color: activeSessionId === "demo-kyc-benchmark-revolut-cashapp" ? "#FFFFFF" : "#999999",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400
                }}
                title={demoResearch}
              >
                <span className="truncate">{demoResearch}</span>
              </button>

              {/* 2. Twenty CRM Date-Grouped User Sessions (Today, Yesterday, Previous 7 Days, Older) */}
              {groupedSessions.map((group) => {
                const userSessionsOnly = group.sessions.filter(
                  (s) => s.id !== "demo-kyc-benchmark-revolut-cashapp" && !s.title.toLowerCase().includes("why do revolut")
                );
                if (userSessionsOnly.length === 0) return null;

                return (
                  <div key={group.id} className="flex flex-col gap-1 mt-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#555555] px-2 py-0.5">
                      {group.title}
                    </span>
                    {userSessionsOnly.map((session) => {
                      const isSelected = activeSessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSelectSession(session.id)}
                          className={`group relative w-[199px] h-[36px] px-3 rounded-[8px] text-[13px] transition-all cursor-pointer flex items-center justify-between ${
                            isSelected ? "bg-[#181818] text-white" : "text-[#999999] hover:bg-[#141414] hover:text-white"
                          }`}
                          title={session.title}
                        >
                          <span className="truncate pr-2">{session.title}</span>
                          {/* Hover Delete Action (Twenty CRM / Claude pattern) */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-[#777777] transition-all rounded"
                            title="Delete chat"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
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
        className={`flex-1 flex flex-col justify-between relative my-[19px] mr-[24px] min-w-0 max-w-full h-[calc(100vh-64px-38px)] ${
          activeSessionId ? "overflow-hidden px-4 sm:px-8 pt-7 pb-0" : "overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-7"
        }`}
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

        {/* Center Dynamic Content: Either Active Response Canvas OR Default Recommendations */}
        {!activeSessionId ? (
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
            sessionId={activeSessionId}
          />
        )}

        {/* ============================================================ */}
        {/* 3. FLOATING GLOWING BOTTOM AI COMMAND BAR (Shown ONLY on initial empty state) */}
        {!activeSessionId && (
          <div className="relative z-20 mt-6 mb-2 flex items-center justify-center shrink-0 self-center">
            <StickyChatInput
              onSendMessage={(query: string) => handleSearchSubmit(query)}
              placeholder="Ask how your design is blocking you"
            />
          </div>
        )}

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

