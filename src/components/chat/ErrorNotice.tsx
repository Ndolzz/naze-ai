import { AlertCircle, RefreshCw } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";

/**
 * Shown in place of an AI message when a request fails (network, rate
 * limit, provider error). Naze's own error component per spec §33 — never
 * a raw stack trace, always a plain-language reason plus a retry action.
 */
export default function ErrorNotice({
  message = "Naze tidak bisa menjawab sekarang. Coba lagi sebentar lagi.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 animate-rise-in">
      <div className="mt-0.5 shrink-0 opacity-50">
        <NazeMark size={26} />
      </div>
      <div className="flex flex-1 items-center gap-2 rounded-md border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-[14px] text-ink-muted">
        <AlertCircle size={16} className="shrink-0 text-danger" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <RefreshCw size={13} />
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
