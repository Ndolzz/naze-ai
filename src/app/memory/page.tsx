"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Search, Trash2, X } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useMemories, MemoryRecord } from "@/features/memory/useMemories";

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const { memories, loading, update, remove, removeAll } = useMemories(query);

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
        <h1 className="font-display text-[15px] font-semibold text-ink">Memori Naze</h1>
      </header>

      <main className="mx-auto max-w-thread px-4 pb-16">
        <p className="mb-5 text-[13.5px] text-ink-muted">
          Ini hal-hal yang diingat Naze tentang kamu dari percakapan sebelumnya — terpisah dari
          riwayat chat. Kamu bisa lihat, ubah, atau hapus apa saja di sini.
        </p>

        <div className="mb-5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari memori..."
              className="pl-8"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {memories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Hapus semua memori yang tersimpan? Tindakan ini tidak bisa dibatalkan.")) {
                  removeAll();
                }
              }}
              className="shrink-0 text-danger hover:bg-danger/10"
            >
              Hapus semua
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-[14px] text-ink-faint">Memuat...</p>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <NazeMark size={32} />
            <p className="text-[14px] text-ink-muted">
              {query ? "Tidak ada memori yang cocok." : "Belum ada memori yang tersimpan."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} onUpdate={update} onDelete={remove} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MemoryCard({
  memory,
  onUpdate,
  onDelete,
}: {
  memory: MemoryRecord;
  onUpdate: (id: string, fields: { content: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.content);

  const save = () => {
    if (draft.trim() && draft.trim() !== memory.content) {
      onUpdate(memory.id, { content: draft.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="rounded-md border border-border bg-surface p-3.5">
      {editing ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setDraft(memory.content); setEditing(false); }}>
              Batal
            </Button>
            <Button size="sm" onClick={save}>
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {memory.category && (
              <span className="mb-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] text-accent-text">
                {memory.category}
              </span>
            )}
            <p className="text-[14px] leading-relaxed text-ink">{memory.content}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              aria-label="Ubah memori"
              onClick={() => setEditing(true)}
              className="grid h-9 w-9 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <Pencil size={14} />
            </button>
            <button
              aria-label="Hapus memori"
              onClick={() => {
                if (window.confirm("Hapus memori ini?")) onDelete(memory.id);
              }}
              className="grid h-9 w-9 place-items-center rounded-md text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
