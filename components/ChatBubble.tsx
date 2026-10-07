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
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function ChatBubble({ sender, children }: ChatBubbleProps) {
  const isBot = sender === "bot";
  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3 animate-fade-up`}>
      {isBot && (
        <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full brand-bg text-xs font-semibold text-white ring-2 ring-[color:var(--brand-accent)]/60">
          M
        </div>
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
