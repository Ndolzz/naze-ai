"use client";

import { useCallback, useEffect, useState } from "react";

export interface MemoryRecord {
  id: string;
  content: string;
  category: string | null;
  importance: number;
  createdAt: string;
  updatedAt: string;
}

export function useMemories(query: string) {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(`/api/memories${qs}`);
      const data = await res.json();
      setMemories(data.memories ?? []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = async (
    id: string,
    fields: Partial<Pick<MemoryRecord, "content" | "category" | "importance">>
  ) => {
    await fetch(`/api/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    await refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    await refresh();
  };

  const removeAll = async () => {
    await fetch("/api/memories", { method: "DELETE" });
    await refresh();
  };

  return { memories, loading, refresh, update, remove, removeAll };
}
