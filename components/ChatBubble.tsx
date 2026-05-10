interface ChatBubbleProps {
  sender: "bot" | "user";
  children: React.ReactNode;
}

export function ChatBubble({ sender, children }: ChatBubbleProps) {
  const isBot = sender === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-ink text-white text-xs font-semibold flex items-center justify-center mr-2 shrink-0 mt-1">
          M
        </div>
      )}
      <div
        className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-soft
          ${
            isBot
              ? "bg-white text-ink-dark border border-line rounded-tl-sm"
              : "bg-ink text-white rounded-tr-sm"
          }`}
      >
        {children}
      </div>
    </div>
  );
}
