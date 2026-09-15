"use client";

import { useRef, useState } from "react";

interface SendParams {
  conversationId: string | null;
  message?: string;
  regenerate?: boolean;
  voiceMode?: boolean;
}

interface SettleResult {
  finalText: string;
  conversationId: string;
}

interface UseChatStreamResult {
  streamingText: string;
  isStreaming: boolean;
  error: string | null;
  send: (params: SendParams, onSettle: (result: SettleResult) => void) => void;
  stop: () => void;
  retry: () => void;
}

/**
 * Owns the fetch to /api/chat and turns the response into incremental
 * text. Since Phase 4, the server is the source of truth for history —
 * this hook sends only the one new message plus which conversation it
 * belongs to (or null for "start a new one"), and reads back which
 * conversation it ended up in via the X-Conversation-Id response header.
 */
export function useChatStream(): UseChatStreamResult {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ params: SendParams; onSettle: (r: SettleResult) => void } | null>(null);

  const run = async (params: SendParams, onSettle: (result: SettleResult) => void) => {
    setError(null);
    setStreamingText("");
    setIsStreaming(true);
    lastRequestRef.current = { params, onSettle };

    const controller = new AbortController();
    controllerRef.current = controller;
    let acc = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      const conversationId = res.headers.get("X-Conversation-Id") ?? params.conversationId ?? "";

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Naze tidak bisa menjawab sekarang.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamingText(acc);
      }

      setIsStreaming(false);
      onSettle({ finalText: acc, conversationId });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User pressed stop — the server's `cancel()` handler already
        // persists whatever streamed so far (spec §7), so just reflect
        // that here instead of treating it as a failure.
        setIsStreaming(false);
        onSettle({ finalText: acc, conversationId: params.conversationId ?? "" });
        return;
      }
      setIsStreaming(false);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  return {
    streamingText,
    isStreaming,
    error,
    send: (params, onSettle) => run(params, onSettle),
    stop: () => controllerRef.current?.abort(),
    retry: () => {
      if (lastRequestRef.current) {
        const { params, onSettle } = lastRequestRef.current;
        run(params, onSettle);
      }
    },
  };
}
