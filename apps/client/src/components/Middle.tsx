import RevolutScreenshot from "@/assets/Revolut.png";

export function Middle() {
    return (
        <div className="w-full flex justify-center xl:sticky xl:top-[30px] mt-8 xl:mt-[30px] z-10">
            {/* Container for screenshot and buttons */}
            <div className="relative flex items-center justify-center w-full max-w-[460px]">
                
                {/* Left Navigation Button */}
                <button className="absolute left-0 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2A2A2A] border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-[#3A3A3A] shrink-0">
                    <svg width="14" height="24" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-5 sm:w-[14px] sm:h-[24px]">
                        <path d="M12 2L2 12L12 22" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Screenshot */}
                <img
                    src={RevolutScreenshot}
                    alt="App Screenshot"
                    className="w-[240px] sm:w-[284px] h-auto rounded-[16px] object-cover mx-auto"
                />

                {/* Right Navigation Button */}
                <button className="absolute right-0 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2A2A2A] border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-[#3A3A3A] shrink-0">
                    <svg width="14" height="24" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3 h-5 sm:w-[14px] sm:h-[24px]">
                        <path d="M2 2L12 12L2 22" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}