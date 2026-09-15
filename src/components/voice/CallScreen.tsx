"use client";

import { Mic, MicOff, PhoneOff, X } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import { useCall, CallState } from "@/features/voice/useCall";

interface CallScreenProps {
  conversationId: string | null;
  onConversationIdChange: (id: string) => void;
  onExchange: (userText: string, assistantText: string) => void;
  onClose: () => void;
}

const STATE_LABEL: Record<CallState, string> = {
  idle: "Ketuk mikrofon untuk bicara",
  listening: "Mendengarkan...",
  thinking: "Naze sedang berpikir",
  speaking: "Naze berbicara...",
  error: "Ada masalah",
  disconnected: "Fitur suara tidak tersedia",
};

export default function CallScreen({
  conversationId,
  onConversationIdChange,
  onExchange,
  onClose,
}: CallScreenProps) {
  const call = useCall({ conversationId, onConversationIdChange, onExchange });

  const handleEndCall = () => {
    call.endCall();
    onClose();
  };

  const handleMicTap = () => {
    if (call.state === "idle" || call.state === "error") call.startListening();
    else if (call.state === "listening") call.stopListening();
    else if (call.state === "thinking" || call.state === "speaking") call.interrupt();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-canvas px-6 py-10">
      <button
        onClick={handleEndCall}
        aria-label="Tutup"
        className="grid h-10 w-10 shrink-0 place-items-center self-end rounded-md text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
      >
        <X size={20} />
      </button>

      <div className="flex flex-col items-center gap-6">
        <OrbAvatar state={call.state} />
        <div className="max-w-xs text-center">
          <p className="font-display text-base font-semibold text-ink">{STATE_LABEL[call.state]}</p>
          {call.state === "listening" && call.interimText && (
            <p className="mt-2 text-[14px] text-ink-muted">{call.interimText}</p>
          )}
          {call.state === "speaking" && call.replyText && (
            <p className="mt-2 text-[14px] text-ink-muted">{call.replyText}</p>
          )}
          {(call.state === "error" || call.state === "disconnected") && call.errorMessage && (
            <p className="mt-2 text-[14px] text-danger">{call.errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {call.state !== "disconnected" && (
          <>
            <button
              onClick={() => call.setMuted((m) => !m)}
              aria-label={call.muted ? "Nyalakan lanjut otomatis" : "Matikan lanjut otomatis"}
              aria-pressed={call.muted}
              className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${
                call.muted
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-border-strong text-ink-muted hover:text-ink"
              }`}
            >
              {call.muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              onClick={handleMicTap}
              aria-label={call.state === "listening" ? "Berhenti bicara" : "Mulai bicara"}
              className={`grid h-16 w-16 place-items-center rounded-full text-white transition-colors ${
                call.state === "listening" ? "bg-danger" : "bg-accent hover:bg-accent-hover"
              }`}
            >
              <Mic size={22} />
            </button>
          </>
        )}

        <button
          onClick={handleEndCall}
          aria-label="Akhiri panggilan"
          className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger transition-colors hover:bg-danger/20"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}

function OrbAvatar({ state }: { state: CallState }) {
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      {state === "listening" && (
        <span className="absolute inset-0 animate-pulse rounded-full bg-accent-soft" aria-hidden="true" />
      )}
      {state === "speaking" && (
        <span className="absolute inset-0 animate-pulse rounded-full bg-accent2/20" aria-hidden="true" />
      )}
      {state === "thinking" && (
        <span
          className="absolute -inset-1.5 animate-spin rounded-full border-2 border-transparent border-t-accent"
          aria-hidden="true"
        />
      )}
      <div
        className={`relative grid h-20 w-20 place-items-center rounded-full border bg-surface-raised ${
          state === "disconnected" ? "border-border opacity-40" : state === "error" ? "border-danger/40" : "border-border"
        }`}
      >
        <NazeMark size={40} />
      </div>
    </div>
  );
}
