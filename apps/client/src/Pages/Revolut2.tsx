import { Leftside } from "../components/Leftside";
import { Middle } from "../components/Middle";
import { Rightside } from "../components/Rightside";

export function Revolut2({ onBack }: { onBack?: () => void }) {
    return (
        <main className="flex-1 w-full bg-black relative min-h-screen pb-[65px]">
            {/* Main container: stack on mobile, side-by-side on desktop */}
            <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start pt-8 xl:pt-4 px-4 sm:px-8 gap-8 xl:gap-4 max-w-[1400px] mx-auto">
                
                {/* Left Panel */}
                <div className="w-full xl:w-[384px] shrink-0">
                    <Leftside />
                </div>

                {/* Middle Panel (Screenshot & Controls) */}
                <div className="w-full flex-1 flex justify-center order-first xl:order-none">
                    <Middle />
                </div>

                {/* Right Panel */}
                <div className="w-full xl:w-[384px] shrink-0">
                    <Rightside />
                </div>
            </div>
        </main>
    );
}
