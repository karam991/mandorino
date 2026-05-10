"use client";

interface QuickReplyChipsProps {
  options: readonly string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function QuickReplyChips({ options, onSelect, disabled }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="chip disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface MultiChipsProps {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}

export function MultiChips({ options, selected, onToggle, disabled }: MultiChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(opt)}
            className={`chip disabled:opacity-50 disabled:cursor-not-allowed ${
              isOn ? "bg-ink text-white border-ink" : ""
            }`}
            aria-pressed={isOn}
          >
            {isOn ? "✓ " : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
