import NazeMark from "@/components/ui/NazeMark";
import Markdown from "@/components/chat/Markdown";
import MessageActions from "@/components/chat/MessageActions";

/**
 * Naze's two message shapes (spec §5-6). Positions are fixed by product
 * rule: AI always left with the identity mark, user always right in a
 * quiet filled bubble.
 */

interface AiMessageProps {
  content: string;
  streaming?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (value: "up" | "down") => void;
}

export function AiMessage({
  content,
  streaming,
  onRegenerate,
  onFeedback,
}: AiMessageProps) {
  return (
    <div className="flex items-start gap-3 animate-rise-in">
      <div className="mt-0.5 shrink-0">
        <NazeMark size={26} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-[15px] leading-relaxed text-ink">
          <Markdown content={content} />
          {streaming && (
            <span
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-ink-muted"
              aria-hidden="true"
            />
          )}
        </div>
        {!streaming && (
          <MessageActions
            content={content}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  );
}

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end animate-rise-in">
      <div className="max-w-[85%] rounded-lg bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed text-ink">
        {children}
      </div>
    </div>
  );
}

export function ThinkingIndicator({
  label = "Naze sedang berpikir",
}: {
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <NazeMark size={26} />
      <span className="bg-gradient-to-r from-ink-muted via-ink to-ink-muted bg-[length:200%_100%] bg-clip-text text-[15px] text-transparent animate-shimmer">
        {label}
      </span>
    </div>
  );
}
