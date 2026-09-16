"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import { useSettings } from "@/features/settings/useSettings";
import { AccentId } from "@/lib/settings/types";

/**
 * Preview dots for the accent picker. The hex values are only for the
 * swatches themselves; the real theming happens through the
 * [data-accent] rules in globals.css.
 */
const ACCENT_SWATCHES: { id: AccentId; label: string; color: string }[] = [
  { id: "royal", label: "Royal", color: "#6a5cff" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "sapphire", label: "Safir", color: "#3b82f6" },
  { id: "gold", label: "Emas", color: "#d4af37" },
  { id: "rose", label: "Mawar", color: "#ec6f9c" },
];

export default function SettingsPage() {
  const { settings, loading, update } = useSettings();

  return (
    <div className="min-h-dvh">
      <header className="enter mx-auto flex max-w-thread items-center gap-3 px-4 py-4">
        <Link
          href="/"
          aria-label="Kembali ke percakapan"
          className="grid h-10 w-10 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
        >
          <ArrowLeft size={18} />
        </Link>
        <NazeMark size={22} />
        <h1 className="font-display text-[17px] font-semibold text-ink">Pengaturan</h1>
      </header>

      <main className="mx-auto max-w-thread px-4 pb-16">
        {loading ? (
          <p className="text-[14px] text-ink-faint">Memuat...</p>
        ) : (
          <div className="stagger space-y-5">
            <Section title="Tampilan" description="Tema dan warna untuk seluruh aplikasi.">
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
              <div className="border-t border-border">
                <div className="px-4 pt-3">
                  <p className="text-[14px] text-ink">Warna aksen</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-faint">
                    Warna utama untuk tombol, sorotan, dan identitas Naze.
                  </p>
                </div>
                <AccentPicker
                  value={settings.accent}
                  onChange={(accent) => {
                    document.documentElement.dataset.accent = accent;
                    update({ accent });
                  }}
                />
              </div>
            </Section>

            <Section title="Memori" description="Kontrol apa yang Naze boleh ingat jangka panjang.">
              <Row
                label="Aktifkan memori"
                description="Kalau dimatikan, Naze berhenti menyimpan dan membaca memori sama sekali, bukan hanya menyembunyikannya dari tampilan."
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
                Kelola memori tersimpan
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
                Naze Call memakai fitur suara bawaan browser. Dukungan terbaik ada di Chrome
                dan Edge. Firefox belum mendukung pengenalan suara.
              </p>
            </Section>

            <Section title="Privasi" description="Bagaimana Naze mengenali kamu saat ini.">
              <p className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">
                Percakapan dan memori kamu terikat ke akun yang login (email dan password),
                bukan lagi ke satu browser. Login dari perangkat lain dengan akun yang sama
                akan menampilkan riwayat yang sama.
              </p>
            </Section>

            <DataSection />

            <Section title="Tentang">
              <p className="px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">
                Naze AI dikembangkan melalui delapan fase: Foundation, Chat UI, Backend,
                Database, Memory, Image Generation, Voice, dan Settings. Model teks:
                Gemini 3.6 Flash. Gambar: Pollinations. Suara: Web Speech API bawaan
                browser.
              </p>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function AccentPicker({
  value,
  onChange,
}: {
  value: AccentId;
  onChange: (id: AccentId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-2">
      {ACCENT_SWATCHES.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-label={"Warna aksen " + s.label}
            aria-pressed={active}
            title={s.label}
            onClick={() => onChange(s.id)}
            className="h-9 w-9 rounded-full transition-transform duration-200 hover:scale-110"
            style={{
              backgroundColor: s.color,
              boxShadow: active
                ? "0 0 0 3px var(--naze-surface), 0 0 0 5px " + s.color
                : "0 0 0 1px var(--naze-border-strong)",
            }}
          />
        );
      })}
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
        "Hapus SEMUA data: percakapan, memori, dan pengaturan? Ini akan memulai sesi baru dari nol dan tidak bisa dibatalkan."
      )
    )
      return;
    setBusy("everything");
    try {
      await fetch("/api/data", { method: "DELETE" });
      // The User row itself was just deleted, so the current session JWT
      // now points at nothing. signOut() clears it properly instead of
      // leaving the browser holding a token for an account that no
      // longer exists (which would otherwise 401 on the very next API
      // call, or worse, silently attach a new random account to it).
      await signOut({ callbackUrl: "/login" });
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
