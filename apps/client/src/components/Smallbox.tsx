export function Smallbox({ text, width }: { text: string; width?: string }) {
    return (
        <div
            className="h-[33px] rounded-[18px] border border-[#323232] px-[9px] flex items-center justify-center box-border"
            style={{ width: width || 'fit-content' }}
        >
            <span className="font-['Inter'] font-normal text-[13px] leading-none text-[#C2C2C2] whitespace-nowrap">
                {text}
            </span>
        </div>
    );
}
