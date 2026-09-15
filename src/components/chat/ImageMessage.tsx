import Image from "next/image";
import { Download, RefreshCw } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";

export default function ImageMessage({
  url,
  prompt,
  onRegenerate,
}: {
  url: string;
  prompt: string;
  onRegenerate?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 animate-rise-in">
      <div className="mt-0.5 shrink-0">
        <NazeMark size={26} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {/* Generated images are always 1024x1024 from Pollinations (see
            lib/ai/image/providers/pollinations.ts) — fixed dimensions,
            so next/image can size/lazy-load/optimize it for real instead
            of a plain <img>. */}
        <Image
          src={url}
          alt={prompt}
          width={1024}
          height={1024}
          className="max-w-full rounded-md border border-border sm:max-w-sm"
          unoptimized={false}
        />
        <div className="flex items-center gap-0.5">
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Unduh gambar"
            className="grid h-10 w-10 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <Download size={15} />
          </a>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              aria-label="Buat ulang gambar"
              className="grid h-10 w-10 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
