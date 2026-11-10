export interface UserTurnBubbleProps {
  content: string;
}

export function UserTurnBubble({ content }: UserTurnBubbleProps) {
  return (
    <div className="w-full flex justify-end mb-6">
      <div
        className="flex items-center justify-center px-[18px] py-[12px] shadow-md transition-all"
        style={{
          minHeight: "40px",
          maxWidth: "600px",
          background: "#272727",
          borderRadius: "14px 14px 0px 14px",
          border: "1px solid #333333",
        }}
      >
        <span
          style={{
            fontFamily: "'Geist', 'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            letterSpacing: "-0.01em",
            color: "#FFFFFF",
            wordBreak: "break-word",
          }}
        >
          {content}
        </span>
      </div>
    </div>
  );
}
