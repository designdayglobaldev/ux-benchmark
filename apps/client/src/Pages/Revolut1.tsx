import RevolutLogo from "@/assets/Revolut_logo.png";
import RevolutScreenshot from "@/assets/Revolut.png";
import { Smallbox } from "../components/Smallbox";
import { Paragraph } from "../components/Paragraph";
import { Cards } from "../components/Cards";

export function Revolut1({ onBack, onNavigate }: { onBack?: () => void; onNavigate?: (page: string) => void }) {
    return (
        <main className="flex-1 w-full bg-black relative pb-32 flex flex-col xl:flex-row xl:justify-center px-4 sm:px-8 xl:px-4 gap-8">
            {/* Left Content Column */}
            <div className="w-full max-w-[832px] flex flex-col mt-8 xl:mt-[48px] xl:ml-[60px]">
                
                {/* Main Card Container */}
                <div className="rounded-[12px] border border-[#2B2B29] bg-[#111111] w-full p-6 sm:p-8 flex flex-col relative overflow-hidden">
                    
                    {/* Header Row: Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                        <button 
                            onClick={onBack}
                            className="flex items-center justify-center rounded-full border border-[#323232] bg-white text-black transition-colors hover:bg-gray-200 px-4 py-2.5 font-['Inter'] font-normal text-[14px] leading-none"
                        >
                            Back
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => onNavigate?.("revolut2")}
                                className="flex items-center justify-center rounded-full border border-[#323232] bg-[#0099FF] text-white px-4 py-2.5 font-['Inter'] font-medium text-[14px] leading-none text-center"
                            >
                                Start Exploring
                            </button>
                            <button
                                className="flex items-center justify-center rounded-full border border-[#323232] bg-transparent text-white px-4 py-2.5 font-['Inter'] font-medium text-[14px] leading-none text-center"
                            >
                                View All Flows
                            </button>
                        </div>
                    </div>

                    {/* App Logo & Title */}
                    <div className="mt-8 flex flex-col">
                        <img 
                            src={RevolutLogo} 
                            alt="Revolut Logo"
                            className="w-[80px] h-[80px] rounded-[20px]"
                        />
                        <h1 className="mt-[40px] font-['Inter'] font-medium text-[32px] sm:text-[40px] leading-none tracking-[-0.03em] text-[#E5E7EB] m-0">
                            Revolut
                        </h1>
                        <p className="mt-[15px] font-['Inter'] font-normal text-[14px] sm:text-[16px] leading-none text-[#5E5E5E] m-0">
                            All-in-one finance app for your money
                        </p>
                    </div>

                    {/* Horizontal Divider */}
                    <div className="my-[30px] w-full border-t border-[#2B2B29]"></div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-between w-full gap-y-6">
                        <div className="flex flex-col gap-[10px]">
                            <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Category</span>
                            <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">Finance</span>
                        </div>

                        <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                        <div className="flex flex-col gap-[10px]">
                            <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Platform</span>
                            <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">iOS · Android</span>
                        </div>

                        <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                        <div className="flex flex-col gap-[10px]">
                            <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Market</span>
                            <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">Worldwide</span>
                        </div>

                        <div className="hidden md:block w-[1px] h-[40px] bg-[#2B2B29]"></div>

                        <div className="flex flex-col gap-[10px]">
                            <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Target User</span>
                            <span className="font-['Inter'] font-normal text-[13px] leading-none text-white">Busy urban, on the go</span>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="mt-10 flex flex-col gap-[10px]">
                        <span className="font-['Inter'] font-medium text-[12px] leading-none tracking-[0.12em] text-[#5E5E5E] uppercase">Tags</span>
                        <div className="flex flex-wrap gap-[10px]">
                            <Smallbox text="Finance" />
                            <Smallbox text="Management" />
                        </div>
                    </div>
                </div>

                {/* Mobile/Tablet Sidebar Container (Visible below Main Card) */}
                <div className="xl:hidden w-full relative mt-8">
                    <div className="w-full aspect-[440/611] max-h-[611px] rounded-[12px] bg-[#181818] flex items-center justify-center overflow-hidden">
                        <img 
                            src={RevolutScreenshot}
                            alt="Revolut Screenshot"
                            className="w-[193px] h-auto rounded-[8px] object-cover"
                        />
                    </div>
                </div>

                {/* "More about Revolut" Section */}
                <h2 className="mt-12 font-['Inter'] font-medium text-[16px] leading-none tracking-[-0.03em] text-[#5E5E5E] m-0">
                    More about Revolut
                </h2>

                <p className="mt-[18px] font-['Inter'] font-normal text-[20px] sm:text-[28px] leading-[1.2] tracking-[-0.015em] text-white m-0 max-w-full">
                    A dark, precise money super-app that treats your finances like a live dashboard, every currency, card, and account controllable in a tap.
                </p>

                {/* "Palette" Section */}
                <h3 className="mt-12 font-['Inter'] font-medium text-[16px] leading-none tracking-[-0.03em] text-[#5E5E5E] m-0">
                    Palette
                </h3>

                <div className="mt-4 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex flex-wrap gap-[12px]">
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[12px] border border-[#424241] bg-[#0A0A15]"></div>
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[12px] border border-[#424241] bg-[#1C14E9]"></div>
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[12px] border border-[#424241] bg-[#8E7EFE]"></div>
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[12px] border border-[#424241] bg-[#FFFFFF]"></div>
                        <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-[12px] border border-[#424241] bg-[#00E4C8]"></div>
                    </div>
                    <span className="font-['Inter'] font-normal text-[16px] sm:text-[20px] leading-[1.3] text-white flex-1">
                        Near-black canvas · electric indigo signature · cool, premium, high-contrast
                    </span>
                </div>

                {/* "Flows" Section */}
                <h3 className="mt-12 font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787] m-0">
                    Flows
                </h3>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Smallbox text="Editing profile" />
                    <Smallbox text="Deleting & Deactivating Account" />
                    <Smallbox text="Login" />
                    <Smallbox text="Logout" />
                    <Smallbox text="Resetting Password" />
                    <Smallbox text="Switching Account" />
                </div>

                {/* Cards Section */}
                <Cards />

                {/* Paragraphs Section */}
                <div className="mt-12 flex flex-col gap-12">
                    <Paragraph 
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>}
                        title="Look & feel"
                        tags={[
                            { text: "Dark by default" },
                            { text: "Numbers as hero" },
                            { text: "Indigo accents" }
                        ]}
                        description="A near-black canvas with a single electric-indigo signature makes balances and charts glow like a trading terminal. Rounded tiles, generous spacing, and restrained iconography keep a busy feature set feeling calm and premium rather than cluttered. Photography is rare, your data is the imagery."
                    />

                    <Paragraph 
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V5a2 2 0 0 1 4 0v8"></path><path d="M12 13V4a2 2 0 0 1 4 0v9"></path><path d="M16 13V6a2 2 0 0 1 4 0v11.23c0 2.21-1.34 4.23-3.37 4.96l-4.57 1.63A4.54 4.54 0 0 1 10.3 22l-4.96-5.83A2 2 0 0 1 5.48 13h2.52"></path></svg>}
                        title="Ease of use"
                        tags={[
                            { text: "Tile hub" },
                            { text: "Feature-dense" },
                            { text: "Fast core actions" }
                        ]}
                        description="A home hub of tiles routes into many sub-apps, cards, exchange, stocks, crypto, savings, kids accounts. Everyday actions (send, exchange, freeze a card) are one or two taps, but the sheer breadth means the app rewards the confident and can overwhelm the casual. It's a control panel, not a guided path."
                    />

                    <Paragraph 
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>}
                        title="Content & clarity"
                        tags={[
                            { text: "Crisp & confident" },
                            { text: "Playful edge" }
                        ]}
                        description="Copy is short, declarative, and lightly witty, grown-up fintech with a wink, never chatty. Labels favor plain money words over jargon, and spending analytics are framed as tidy summaries you can scan at a glance."
                    />
                </div>

                {/* App Store Listing Card */}
                <div className="mt-4 w-full rounded-[12px] border border-[#1F1F1F] bg-[#181818] p-6 flex flex-col justify-center">
                    <span className="font-['Inter'] font-semibold text-[12px] leading-none tracking-[0.12em] uppercase text-[#4B5563]">
                        App Store listing
                    </span>
                    <p className="mt-3.5 font-['Inter'] font-normal text-[20px] leading-none text-[#E5E7EB] m-0">
                        Make your spend, well-spent.
                    </p>
                </div>

                {/* Trust / Accessibility / Takeaway */}
                <div className="mt-16 flex flex-col gap-12">
                    <Paragraph
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
                        title="Trust"
                        tags={[
                            { text: "Licensed bank" },
                            { text: "Instant controls" },
                            { text: "Fee-visible" }
                        ]}
                        description="Real-time spend notifications, card freeze/unfreeze, single-use virtual cards, and deposit protection under EU/UK schemes build day-to-day confidence. Fees and exchange rates are shown before you commit. The caveat: support is app-and-chat only, and reviews split sharply on how disputes get resolved."
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 -mt-6">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span className="font-['Inter'] font-normal text-[13px] leading-none text-[#878787]">
                            Trustpilot 4.7 across 424k+ reviews · 75M+ customers (annual report, 2026)
                        </span>
                    </div>

                    <Paragraph
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>}
                        title="Accessibility"
                        tags={[
                            { text: "Screen-reader ready" },
                            { text: "200% dynamic type" },
                            { text: "Reduced motion" }
                        ]}
                        description="Revolut states a WCAG 2.2 AA target and the App Store lists support: VoiceOver/TalkBack, text scaling to 200%+, a first-class dark theme, contrast controls, shape-plus-text (not color alone) to convey meaning, and motion reduction. The dark-first, data-dense aesthetic is the tension to watch, high-contrast helps, but small numeric readouts demand the scaling to actually be used."
                    />

                    <a
                        href="#"
                        className="-mt-6 font-['Inter'] font-normal text-[13px] leading-none text-[#8E7EFE] underline"
                    >
                        Revolut accessibility statement ↗
                    </a>

                    <Paragraph
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9"></path><path d="M9 21V12h6v9"></path></svg>}
                        title="Takeaway"
                        tags={[]}
                        description="For the mobile-first traveler and multi-currency power user, Revolut is the most complete, most controllable money app on the phone, at the cost of a dense, terminal-like surface and human support that lives entirely behind a chat window."
                    />
                </div>

                {/* Similar apps */}
                <h2 className="mt-12 font-['Inter'] font-medium text-[24px] sm:text-[28px] leading-none tracking-[-0.03em] text-[#E5E7EB] m-0">
                    Similar apps
                </h2>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Similar App Card 1 */}
                    <div className="aspect-square w-full rounded-[11px] bg-[#181818] relative overflow-hidden flex items-center justify-center">
                        <img
                            src={RevolutScreenshot}
                            alt="Similar app screenshot"
                            className="h-[90%] w-auto object-cover max-w-none relative z-10"
                            style={{
                                maskImage: 'linear-gradient(180deg, rgba(24, 24, 24, 0) 51.54%, #181818 96.1%)',
                                WebkitMaskImage: 'linear-gradient(180deg, rgba(24, 24, 24, 0) 51.54%, #181818 96.1%)',
                            }}
                        />
                    </div>

                    {/* Similar App Card 2 */}
                    <div className="aspect-square w-full rounded-[11px] bg-[#181818] relative overflow-hidden flex items-center justify-center">
                        <img
                            src={RevolutScreenshot}
                            alt="Similar app screenshot"
                            className="h-[90%] w-auto object-cover max-w-none relative z-10"
                            style={{
                                maskImage: 'linear-gradient(180deg, rgba(24, 24, 24, 0) 51.54%, #181818 96.1%)',
                                WebkitMaskImage: 'linear-gradient(180deg, rgba(24, 24, 24, 0) 51.54%, #181818 96.1%)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sticky Sidebar Container (Desktop Only) */}
            <div className="hidden xl:block w-[440px] shrink-0 relative mt-[48px]">
                {/* Sticky Box */}
                <div className="xl:sticky xl:top-[120px] w-full aspect-[440/611] max-h-[611px] rounded-[12px] bg-[#181818] flex items-center justify-center overflow-hidden">
                    <img 
                        src={RevolutScreenshot}
                        alt="Revolut Screenshot"
                        className="w-[193px] h-auto rounded-[8px] object-cover"
                    />
                </div>
            </div>
        </main>
    );
}