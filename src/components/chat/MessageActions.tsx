"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onFeedback?: (value: "up" | "down") => void;
}

/**
 * Copy actually copies (real, works today). Regenerate/feedback are real
 * buttons wired to callback props — they'll call into src/lib/ai once
 * Phase 3 exists, but the component itself doesn't fake a result in the
 * meantime (spec §44): if no handler is passed, the button simply does
 * nothing rather than pretending to regenerate.
 */
export default function MessageActions({
  content,
  onRegenerate,
  onFeedback,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore — clipboard permission or insecure-context failure.
    }
  };

  const handleFeedback = (value: "up" | "down") => {
    const next = feedback === value ? null : value;
    setFeedback(next);
    if (next) onFeedback?.(next);
  };

  return (
    <div className="flex items-center gap-0.5">
      <IconAction label={copied ? "Disalin" : "Salin"} onClick={handleCopy}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </IconAction>

      <IconAction label="Buat ulang jawaban" onClick={onRegenerate}>
        <RefreshCw size={15} />
      </IconAction>

      <IconAction
        label="Jawaban ini membantu"
        onClick={() => handleFeedback("up")}
        active={feedback === "up"}
      >
        <ThumbsUp size={15} />
      </IconAction>

      <IconAction
        label="Jawaban ini kurang tepat"
        onClick={() => handleFeedback("down")}
        active={feedback === "down"}
      >
        <ThumbsDown size={15} />
      </IconAction>
    </div>
  );
}

function IconAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-md transition-colors duration-150 ${
        active ? "bg-accent-soft text-accent" : "text-ink-faint hover:bg-surface-raised hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
