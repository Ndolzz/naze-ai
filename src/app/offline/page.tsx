import NazeMark from "@/components/ui/NazeMark";

/**
 * Shown by public/sw.js when a page navigation fails because there's no
 * network at all. Deliberately static — no data fetching, since the
 * whole point is that it has to render with zero network access.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <NazeMark size={40} />
      <p className="font-display text-lg font-semibold text-ink">Kamu sedang offline</p>
      <p className="max-w-xs text-[14px] text-ink-muted">
        Naze butuh koneksi internet untuk berpikir dan menjawab — chat, memori, gambar, dan
        suara semuanya perlu tersambung ke server. Sambungkan lagi ke internet, lalu muat ulang
        halaman ini.
      </p>
    </div>
  );
}
