import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";
import revolutImg from "@/assets/Revolut.png";
import revolutLogo from "@/assets/Revolut_logo.png";

const categories = [
    "Latest",
    "Productivity",
    "Lifestyle",
    "Technology",
    "Entertainment",
    "Finance & Banking",
    "Travel & Transportation",
    "Communication",
    "Education"
];

export function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
    const [activeCategory, setActiveCategory] = useState("Latest");

    return (
        <main className="flex-1 w-full bg-black flex flex-col items-center pt-8 sm:pt-[50px] px-4 sm:px-6 pb-20 sm:pb-32">
            {/* Badge */}
            <div className="mb-6 rounded-full border border-[#333] bg-[#161616] px-3 py-1 text-[10px] font-medium text-[#A1A1A1]">
                Updated weekly
            </div>

            {/* Main Heading */}
            <h1 className="max-w-[700px] text-[32px] sm:text-[44px] md:text-[48px] font-medium tracking-tight leading-[1.1] mb-10 text-center text-[#EAEAEA]">
                Evidence-backed UX<br className="hidden sm:block" /> benchmarking for apps & sites
            </h1>

            {/* Subscribe Input */}
            <div className="flex w-full max-w-[420px] items-center bg-[#1A1A1A] rounded-full p-1 border border-[#2A2A2A] mb-4">
                <input
                    type="email"
                    placeholder="hi@example.com"
                    className="flex-1 bg-transparent px-4 text-[12px] outline-none placeholder:text-[#666666] text-[#EAEAEA] h-8"
                />
                <Button type="submit" className="rounded-full px-5 bg-[#2A2A2A] hover:bg-[#333333] text-[#A1A1A1] hover:text-white text-[12px] font-medium h-8 transition-colors">
                    Subscribe
                </Button>
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-[#666666] font-medium">
                Stay ahead with weekly UX benchmark updates.
            </p>

            {/* Spacer to replace mt-[100px] */}
            <div className="h-[50px] sm:h-[100px] w-full"></div>

            {/* Categories Bar */}
            <div className="sticky top-[73px] z-40 w-full bg-black pl-4 sm:pl-[30px] py-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center text-[14px] font-medium whitespace-nowrap">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`transition-colors ${activeCategory === category
                                    ? "text-white bg-[#1A1A1A] px-3 py-2 rounded-full"
                                    : "text-[#A1A1A1] hover:text-white px-3 py-2 rounded-full"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid of Boxes */}
            <div className="w-full mt-4 sm:mt-[30px] px-4 sm:pl-[30px] sm:pr-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8 w-full">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-4">
                            <div 
                                className="bg-[#161616] hover:bg-[#0E0E0E] transition-colors duration-300 rounded-[20px] border border-[#222222] aspect-[4/4.7] w-full relative overflow-hidden group cursor-pointer"
                                onClick={() => {
                                    if (i === 0 && onNavigate) onNavigate("revolut1");
                                }}
                            >
                                {i === 0 && (
                                    <>
                                        <div className="absolute top-[16px] left-[20px] flex items-center gap-2 z-10">
                                            <Sparkles className="w-4 h-4 text-[#FF5500] fill-[#FF5500]" />
                                            <span className="text-white text-[14px] font-medium tracking-wide">Staff picks</span>
                                        </div>
                                        
                                        {/* Hover Arrow Button */}
                                        <div className="absolute top-[16px] right-[16px] w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                            <ArrowUpRight className="w-4 h-4 text-[#A1A1A1]" />
                                        </div>

                                        <div className="absolute bottom-0 left-[80px] right-[80px] top-[46px] group-hover:left-[70px] group-hover:right-[70px] group-hover:top-[41px] transition-all duration-300">
                                            <img 
                                                src={revolutImg} 
                                                alt="Revolut" 
                                                className="w-full h-full object-cover object-top rounded-t-[16px]" 
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            {/* App Details Below Box */}
                            {i === 0 && (
                                <div className="flex items-center gap-3 px-1">
                                    <img 
                                        src={revolutLogo} 
                                        alt="Revolut Logo" 
                                        className="w-10 h-10 rounded-lg object-contain bg-white" 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-[#EAEAEA] text-[15px] font-medium">Revolut</span>
                                        <span className="text-[#888888] text-[13px]">Finance & Banking</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
