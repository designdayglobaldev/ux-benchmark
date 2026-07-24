import { Smallbox } from "./Smallbox";

export function Rightside() {
    return (
        <div className="w-full flex flex-col gap-2 mt-8 xl:mt-[30px] xl:sticky xl:top-[30px]">
            
            {/* Box 1: App Info */}
            <div className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] p-5 sm:p-6">
                <div className="flex flex-row gap-3">
                    <span className="font-['Inter'] font-medium text-[13px] leading-none text-[#878787]">Tinder</span>
                    <span className="font-['Inter'] font-medium text-[13px] leading-none text-[#878787]">Lifestyle</span>
                </div>
                <h2 className="mt-3.5 font-['Inter'] font-semibold text-[18px] sm:text-[20px] leading-none text-white m-0">
                    App launch / Splash screen
                </h2>
                <p className="mt-3.5 font-['Inter'] font-normal text-[13px] sm:text-[14px] leading-[20px] sm:leading-[22px] text-[#9CA3AF] m-0">
                    The app's launch / welcome screen that gates entry into either account creation or sign-in, with a consent-by-action legal notice.
                </p>
            </div>

            {/* Box 2: UI Elements */}
            <div className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] p-5 sm:p-6">
                <span className="font-['Inter'] font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-[#878787]">
                    UI Elements
                </span>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    <Smallbox text="Icon" />
                    <Smallbox text="Button" />
                </div>
            </div>

            {/* Box 3: Patterns */}
            <div className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] p-5 sm:p-6">
                <span className="font-['Inter'] font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-[#878787]">
                    Patterns
                </span>
                <div className="mt-4 flex flex-wrap gap-2.5">
                    <Smallbox text="Splash / Launch" />
                    <Smallbox text="Consent / Cookie Notice" />
                    <Smallbox text="Account Recovery" />
                </div>
            </div>

            {/* Box 4: Flow */}
            <div className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] p-5 sm:p-6">
                <span className="font-['Inter'] font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-[#878787]">
                    Flow
                </span>
                <div className="mt-4 flex flex-col gap-2.5 items-start">
                    <Smallbox text="Login" />
                    <Smallbox text="Creating Account" />
                </div>
            </div>

            {/* Box 5: Flow Position */}
            <div className="w-full rounded-[12px] bg-[#111111] border border-[#1F1F1F] p-5 sm:p-6">
                <span className="font-['Inter'] font-medium text-[13px] leading-none tracking-[0.1em] uppercase text-[#878787]">
                    Flow Position
                </span>
                <p className="mt-4 font-['Inter'] font-semibold text-[24px] leading-none text-white m-0">
                    1
                </p>
                <p className="mt-2.5 font-['Inter'] font-normal text-[12px] leading-none text-[#5E5E5E] m-0">
                    Of 08 Screens
                </p>
            </div>
        </div>
    );
}