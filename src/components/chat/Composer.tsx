"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  imageMode: boolean;
  onToggleImageMode: () => void;
  onOpenCall: () => void;
}

/**
 * Layout and states per spec §23. The mic button opens the full-screen
 * Call UI (spec §19) — real as of Phase 7, not a placeholder anymore.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  isGenerating,
  onStop,
  imageMode,
  onToggleImageMode,
  onOpenCall,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isGenerating) onSend();
    }
  };

  return (
    <div className="border-t border-border bg-canvas px-4 pb-[env(safe-area-inset-bottom)] pt-3 md:px-0">
      <div className="mx-auto flex max-w-thread items-end gap-2 rounded-lg border border-border-strong bg-surface p-2">
        <IconButton
          label={imageMode ? "Batalkan mode gambar" : "Buat gambar"}
          active={imageMode}
          onClick={onToggleImageMode}
        >
          <ImageIcon size={18} />
        </IconButton>

        <Textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageMode ? "Jelaskan gambar yang mau dibuat..." : "Tulis pesan untuk Naze..."}
          className="max-h-40 min-h-[40px] border-none bg-transparent px-1 py-2 focus:border-none"
        />

        <IconButton label="Bicara dengan Naze (Call)" onClick={onOpenCall}>
          <MicIcon />
        </IconButton>

        {isGenerating ? (
          <Button variant="secondary" size="sm" onClick={onStop}>
            Berhenti
          </Button>
        ) : (
          <Button size="sm" disabled={!value.trim()} onClick={onSend} aria-label="Kirim pesan">
            <SendIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

function IconButton({
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
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-md transition-colors duration-150 ${
        active ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-raised hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* Inline SVG for the one icon lucide doesn't need to cover here — kept
   consistent with spec §35 (no keyboard emoji) either way. */
function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
