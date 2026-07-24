export function Smallbox({ text, width }: { text: string; width?: string }) {
    return (
        <div
            className="h-[27px] rounded-full border border-[#323232] px-[12px] py-[6px] flex items-center justify-center box-border"
            style={{ width: width || 'fit-content' }}
        >
            <span className="font-['Inter'] font-normal text-[12px] leading-none text-white whitespace-nowrap">
                {text}
            </span>
        </div>
    );
}
