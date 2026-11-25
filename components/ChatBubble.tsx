import { FirmAvatar } from "./FirmAvatar";

interface ChatBubbleProps {
  sender: "bot" | "user";
  children: React.ReactNode;
}

export function TypingDots() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 align-middle" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-typing rounded-full bg-muted/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function ChatBubble({ sender, children }: ChatBubbleProps) {
  const isBot = sender === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3 animate-bubble-in`}>
      {isBot && (
        <FirmAvatar size="sm" className="mr-2 mt-1" />
      )}
      <div
        className={`max-w-[82%] sm:max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-soft
          ${
            isBot
              ? "bg-white text-ink-dark border border-line rounded-tl-sm"
              : "brand-bg text-white rounded-tr-sm shadow-card"
          }`}
      >
        {children}
      </div>
    </div>
  );
}
