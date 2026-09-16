"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Archive, Brain, LogOut, Pin, PinOff, Plus, Search, Settings, Trash2, X } from "lucide-react";
import NazeMark from "@/components/ui/NazeMark";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConversationSearch } from "@/features/history/useConversationSearch";
import { groupConversationsByDate, ConversationSummary } from "@/features/history/groupByDate";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  conversations: ConversationSummary[];
  rename: (id: string, title: string) => void;
  togglePinned: (id: string, pinned: boolean) => void;
  setArchived: (id: string, archived: boolean) => void;
  remove: (id: string) => void;
  removeAll: () => void;
}

/**
 * Real conversation history (spec §14/§15): search, grouped-by-date
 * list, rename/pin/archive/delete per item. On desktop this is a fixed
 * 280px panel; on mobile it's an off-canvas drawer with a scrim. The list
 * itself is owned by the parent page (useConversations) so a send/refresh
 * there can update what's shown here without two independent fetches.
 */
export default function Sidebar({
  open,
  onClose,
  onNewChat,
  activeConversationId,
  onSelectConversation,
  conversations,
  rename,
  togglePinned,
  setArchived,
  remove,
  removeAll,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const { data: session } = useSession();
  const { results, searching } = useConversationSearch(query);
  const groups = groupConversationsByDate(conversations);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onClose();
  };

  const handleRename = (id: string, currentTitle: string) => {
    const next = window.prompt("Ganti nama percakapan", currentTitle);
    if (next && next.trim()) rename(id, next.trim());
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="enter flex items-center gap-2 px-4 py-4">
          <NazeMark size={24} />
          <span className="font-display text-[16px] font-semibold text-ink">Naze</span>
        </div>

        <div className="enter space-y-2 px-3" style={{ animationDelay: "100ms" }}>
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={onNewChat}>
            <Plus size={16} />
            Percakapan baru
          </Button>
          <Link
            href="/memory"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <Brain size={15} />
            Memori Naze
          </Link>
          <Link
            href="/settings"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <Settings size={15} />
            Pengaturan
          </Link>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari percakapan"
              className="pl-8 text-[13px]"
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
        </div>

        <nav
          className="enter mt-3 flex-1 overflow-y-auto px-3 pb-3"
          style={{ animationDelay: "180ms" }}
        >
          {query ? (
            <SearchResults
              query={query}
              results={results}
              searching={searching}
              activeId={activeConversationId}
              onSelect={handleSelect}
            />
          ) : conversations.length === 0 ? (
            <p className="px-2 py-4 text-[13px] text-ink-faint">Belum ada percakapan tersimpan.</p>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                {group.items.map((c) => (
                  <SidebarConversationItem
                    key={c.id}
                    title={c.title}
                    active={c.id === activeConversationId}
                    pinned={c.pinned}
                    onSelect={() => handleSelect(c.id)}
                    onRename={() => handleRename(c.id, c.title)}
                    onTogglePin={() => togglePinned(c.id, !c.pinned)}
                    onArchive={() => setArchived(c.id, true)}
                    onDelete={() => {
                      if (window.confirm('Hapus "' + c.title + '"?')) remove(c.id);
                    }}
                  />
                ))}
              </div>
            ))
          )}
        </nav>

        {conversations.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={() => {
                if (window.confirm("Hapus semua riwayat percakapan? Tindakan ini tidak bisa dibatalkan.")) {
                  removeAll();
                }
              }}
              className="w-full rounded-md px-2.5 py-2 text-left text-[13px] text-ink-faint transition-colors hover:bg-surface-raised hover:text-danger"
            >
              Hapus semua riwayat
            </button>
          </div>
        )}

        {session?.user && (
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3">
            <span className="truncate text-[13px] text-ink-muted" title={session.user.email ?? undefined}>
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Keluar"
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function SearchResults({
  results,
  searching,
  activeId,
  onSelect,
}: {
  query: string;
  results: { id: string; title: string; updatedAt: string }[];
  searching: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (searching) return <p className="px-2 py-4 text-[13px] text-ink-faint">Mencari...</p>;
  if (results.length === 0) return <p className="px-2 py-4 text-[13px] text-ink-faint">Tidak ada hasil.</p>;
  return (
    <div>
      <SidebarGroupLabel>Hasil pencarian</SidebarGroupLabel>
      {results.map((r) => (
        <SidebarItem key={r.id} active={r.id === activeId} onClick={() => onSelect(r.id)}>
          {r.title}
        </SidebarItem>
      ))}
    </div>
  );
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 mt-4 px-2 text-[12.5px] text-ink-faint first:mt-0">{children}</p>;
}

export function SidebarItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full truncate rounded-md px-2.5 py-2 text-left text-[14px] transition-colors duration-150 " +
        (active ? "bg-accent-soft text-ink" : "text-ink-muted hover:bg-surface-raised hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function SidebarConversationItem({
  title,
  active,
  pinned,
  onSelect,
  onRename,
  onTogglePin,
  onArchive,
  onDelete,
}: {
  title: string;
  active: boolean;
  pinned: boolean;
  onSelect: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={
        "group flex items-center rounded-md " + (active ? "bg-accent-soft" : "hover:bg-surface-raised")
      }
    >
      <button
        onClick={onSelect}
        onDoubleClick={onRename}
        title="Klik dua kali untuk ganti nama"
        className={
          "min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[14px] " +
          (active ? "text-ink" : "text-ink-muted group-hover:text-ink")
        }
      >
        {title}
      </button>
      <div className="flex shrink-0 items-center gap-0.5 pr-1.5 md:hidden md:group-hover:flex">
        <RowIcon label={pinned ? "Lepas sematan" : "Sematkan"} onClick={onTogglePin}>
          {pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </RowIcon>
        <RowIcon label="Arsipkan" onClick={onArchive}>
          <Archive size={13} />
        </RowIcon>
        <RowIcon label="Hapus" onClick={onDelete} danger>
          <Trash2 size={13} />
        </RowIcon>
      </div>
    </div>
  );
}

function RowIcon({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        "grid h-8 w-8 place-items-center rounded transition-colors " +
        (danger
          ? "text-ink-faint hover:bg-danger/10 hover:text-danger"
          : "text-ink-faint hover:bg-surface hover:text-ink")
      }
    >
      {children}
    </button>
  );
}
