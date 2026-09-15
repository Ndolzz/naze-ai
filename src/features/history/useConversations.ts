"use client";

import { useCallback, useEffect, useState } from "react";
import { ConversationSummary } from "@/features/history/groupByDate";

async function patchConversation(id: string, body: Record<string, unknown>) {
  await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rename = async (id: string, title: string) => {
    await patchConversation(id, { title });
    await refresh();
  };

  const togglePinned = async (id: string, pinned: boolean) => {
    await patchConversation(id, { pinned });
    await refresh();
  };

  const setArchived = async (id: string, archived: boolean) => {
    await patchConversation(id, { archived });
    await refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    await refresh();
  };

  const removeAll = async () => {
    await fetch("/api/conversations", { method: "DELETE" });
    await refresh();
  };

  return { conversations, loading, refresh, rename, togglePinned, setArchived, remove, removeAll };
}
