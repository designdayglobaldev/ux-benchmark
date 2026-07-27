interface CardsProps {
    visualUiTypography?: string;
    visualUiShape?: string;
    visualUiImagery?: string;
    experienceUxSolves?: string;
    experienceUxOverall?: string;
    experienceUxTone?: string;
}

export function Cards({
    visualUiTypography,
    visualUiShape,
    visualUiImagery,
    experienceUxSolves,
    experienceUxOverall,
    experienceUxTone
}: CardsProps) {
    return (
        <div className="mt-12 flex flex-col md:flex-row gap-4 w-full">
            {/* Card 1: Visual · UI */}
            <div className="flex-1 rounded-[12px] border border-[#2B2B29] bg-[#111111] p-6 sm:p-8 flex flex-col">
                <div className="flex items-center">
                    <svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.05209 6.54282C0.982637 6.72992 0.982637 6.93572 1.05209 7.12282C1.7285 8.76294 2.87668 10.1653 4.35106 11.1521C5.82544 12.1389 7.55962 12.6656 9.33375 12.6656C11.1079 12.6656 12.8421 12.1389 14.3164 11.1521C15.7908 10.1653 16.939 8.76294 17.6154 7.12282C17.6849 6.93572 17.6849 6.72992 17.6154 6.54282C16.939 4.9027 15.7908 3.50035 14.3164 2.51357C12.8421 1.52678 11.1079 1 9.33375 1C7.55962 1 5.82544 1.52678 4.35106 2.51357C2.87668 3.50035 1.7285 4.9027 1.05209 6.54282Z" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="ml-[13.67px] font-['Inter'] font-semibold text-[20px] leading-none text-white">Visual · UI</span>
                </div>

                <span className="mt-8 font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">TYPOGRAPHY</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{visualUiTypography || 'Clean geometric sans'}</span>

                <div className="my-5 w-full h-[1px] bg-[#2B2B29]"></div>

                <span className="font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">SHAPE</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{visualUiShape || 'Soft-rounded cards'}</span>

                <div className="my-5 w-full h-[1px] bg-[#2B2B29]"></div>

                <span className="font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">IMAGERY</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{visualUiImagery || 'Data-forward, minimal photography'}</span>
            </div>

            {/* Card 2: Experience · UX */}
            <div className="flex-1 rounded-[12px] border border-[#2B2B29] bg-[#111111] p-6 sm:p-8 flex flex-col">
                <div className="flex items-center">
                    <svg width="19" height="14" viewBox="0 0 24 24" fill="none" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    <span className="ml-[13.67px] font-['Inter'] font-semibold text-[20px] leading-none text-white">Experience · UX</span>
                </div>

                <span className="mt-8 font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">WHAT IT SOLVES</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{experienceUxSolves || 'Solves borderless money'}</span>

                <div className="my-5 w-full h-[1px] bg-[#2B2B29]"></div>

                <span className="font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">OVERALL EXPERIENCE</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{experienceUxOverall || 'Hub-and-tile control panel'}</span>

                <div className="my-5 w-full h-[1px] bg-[#2B2B29]"></div>

                <span className="font-['Inter'] font-normal text-[11px] leading-none tracking-[0.12em] uppercase text-[#878787]">TONE</span>
                <span className="mt-2.5 font-['Inter'] font-normal text-[16px] leading-none text-[#E5E7EB]">{experienceUxTone || 'Confident, crisp, grown-up'}</span>
            </div>
        </div>
    );
}
