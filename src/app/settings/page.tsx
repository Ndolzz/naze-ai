"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import { useSettings } from "@/features/settings/useSettings";

export default function SettingsPage() {
  const { settings, loading, update } = useSettings();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex max-w-thread items-center gap-3 px-4 py-4">
        <Link
          href="/"
          aria-label="Kembali ke percakapan"
          className="grid h-10 w-10 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          <ArrowLeft size={18} />
        </Link>
        <NazeMark size={22} />
        <h1 className="font-display text-[15px] font-semibold text-ink">Pengaturan</h1>
      </header>

      <main className="mx-auto max-w-thread space-y-5 px-4 pb-16">
        {loading ? (
          <p className="text-[14px] text-ink-faint">Memuat...</p>
        ) : (
          <>
            <Section title="Tampilan" description="Tema untuk seluruh aplikasi.">
              <Row
                label="Tema terang"
                description="Naze memakai tema gelap secara default."
              >
                <Toggle
                  checked={settings.theme === "light"}
                  onChange={(checked) => {
                    const theme = checked ? "light" : "dark";
                    document.documentElement.dataset.theme = theme;
                    update({ theme });
                  }}
                  label="Tema terang"
                />
              </Row>
            </Section>

            <Section title="Memori" description="Kontrol apa yang Naze boleh ingat jangka panjang.">
              <Row
                label="Aktifkan memori"
                description="Kalau dimatikan, Naze berhenti menyimpan dan membaca memori sama sekali — bukan cuma disembunyikan dari tampilan."
              >
                <Toggle
                  checked={settings.memoryEnabled}
                  onChange={(checked) => update({ memoryEnabled: checked })}
                  label="Aktifkan memori"
                />
              </Row>
              <Link
                href="/memory"
                className="block px-4 py-3 text-[13.5px] text-accent-text transition-colors hover:bg-surface-raised"
              >
                Lihat &amp; kelola memori tersimpan →
              </Link>
            </Section>

            <Section title="Suara" description="Pengaturan untuk Naze Call.">
              <div className="px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] text-ink">Kecepatan bicara Naze</span>
                  <span className="text-[13px] text-ink-faint">{settings.voiceRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={settings.voiceRate}
                  onChange={(e) => update({ voiceRate: parseFloat(e.target.value) })}
                  className="w-full accent-accent"
                  aria-label="Kecepatan bicara Naze"
                />
              </div>
              <p className="border-t border-border px-4 py-3 text-[13px] text-ink-faint">
                Naze Call memakai fitur suara bawaan browser — dukungan terbaik di Chrome/Edge.
                Firefox belum mendukung pengenalan suara sama sekali.
              </p>
            </Section>

            <Section title="Privasi" description="Bagaimana Naze mengenali kamu saat ini.">
              <p className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">
                Naze belum punya sistem akun/login — percakapan dan memori kamu terikat ke satu
                cookie anonim di browser ini, bukan ke akun. Menghapus cookie browser berarti
                riwayatnya tidak bisa diakses lagi (datanya tidak otomatis terhapus dari server,
                cuma tidak lagi tersambung ke sesi manapun).
              </p>
            </Section>

            <DataSection />

            <Section title="Tentang">
              <p className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">
                Naze AI — dibangun ulang dari nol lewat 8 fase: Foundation, Chat UI, Backend,
                Database, Memory, Image Generation, Voice/Call, dan Settings ini. Model teks:
                Mistral. Gambar: Pollinations (gratis). Suara: Web Speech API bawaan browser
                (gratis).
              </p>
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

function DataSection() {
  const [busy, setBusy] = useState<string | null>(null);

  const exportData = () => {
    window.location.href = "/api/data/export";
  };

  const deleteAllConversations = async () => {
    if (!window.confirm("Hapus semua percakapan? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy("conversations");
    try {
      await fetch("/api/conversations", { method: "DELETE" });
      window.location.href = "/";
    } finally {
      setBusy(null);
    }
  };

  const deleteAllMemories = async () => {
    if (!window.confirm("Hapus semua memori? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy("memories");
    try {
      await fetch("/api/memories", { method: "DELETE" });
    } finally {
      setBusy(null);
    }
  };

  const deleteEverything = async () => {
    if (
      !window.confirm(
        "Hapus SEMUA data — percakapan, memori, dan pengaturan? Ini akan memulai sesi baru dari nol dan tidak bisa dibatalkan."
      )
    )
      return;
    setBusy("everything");
    try {
      await fetch("/api/data", { method: "DELETE" });
      window.location.href = "/";
    } finally {
      setBusy(null);
    }
  };

  return (
    <Section title="Data" description="Ekspor atau hapus data yang tersimpan.">
      <button
        onClick={exportData}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-surface-raised"
      >
        <Download size={15} className="text-ink-faint" />
        Ekspor semua data (.json)
      </button>
      <button
        onClick={deleteAllConversations}
        disabled={busy === "conversations"}
        className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-surface-raised disabled:opacity-50"
      >
        <Trash2 size={15} className="text-ink-faint" />
        Hapus semua percakapan
      </button>
      <button
        onClick={deleteAllMemories}
        disabled={busy === "memories"}
        className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-[14px] text-ink transition-colors hover:bg-surface-raised disabled:opacity-50"
      >
        <Trash2 size={15} className="text-ink-faint" />
        Hapus semua memori
      </button>
      <div className="border-t border-border px-4 py-3">
        <Button
          variant="danger"
          size="sm"
          onClick={deleteEverything}
          disabled={busy === "everything"}
        >
          Hapus semua data pengguna
        </Button>
      </div>
    </Section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-1 px-1 font-display text-[13px] font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h2>
      {description && <p className="mb-2 px-1 text-[13px] text-ink-faint">{description}</p>}
      <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div>
        <p className="text-[14px] text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[12.5px] text-ink-faint">{description}</p>}
      </div>
      {children}
    </div>
  );
}
