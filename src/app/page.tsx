"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { AiMessage, UserMessage, ThinkingIndicator } from "@/components/chat/MessageBubble";
import ImageMessage from "@/components/chat/ImageMessage";
import dynamic from "next/dynamic";

// CallScreen is only needed once someone actually opens Call, and it's
// browser-API-only anyway (SpeechRecognition/speechSynthesis don't exist
// during SSR) — ssr:false keeps it out of the initial page bundle
// entirely instead of shipping it to everyone who never taps the mic.
const CallScreen = dynamic(() => import("@/components/voice/CallScreen"), { ssr: false });
import ErrorNotice from "@/components/chat/ErrorNotice";
import Composer from "@/components/chat/Composer";
import NazeMark from "@/components/ui/NazeMark";
import { useChatStream } from "@/features/chat/useChatStream";
import { useConversations } from "@/features/history/useConversations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "image";
  imageUrl?: string;
  imagePrompt?: string;
}

interface RawMessage {
  id: string;
  role: string;
  content: string;
  metadata?: { kind?: string; url?: string; prompt?: string } | null;
}

function toMessage(m: RawMessage): Message {
  if (m.metadata?.kind === "image" && m.metadata.url) {
    return {
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      kind: "image",
      imageUrl: m.metadata.url,
      imagePrompt: m.metadata.prompt ?? "",
    };
  }
  return { id: m.id, role: m.role as "user" | "assistant", content: m.content };
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lastImagePrompt, setLastImagePrompt] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const stream = useChatStream();
  const history = useConversations();

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setImageMode(false);
    setImageError(null);
    setSidebarOpen(false);
  };

  const selectConversation = async (id: string) => {
    setLoadingConversation(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages.map(toMessage));
      setImageMode(false);
      setImageError(null);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleRemove = async (id: string) => {
    await history.remove(id);
    if (id === conversationId) newChat();
  };

  const generateImage = async (prompt: string) => {
    setImageError(null);
    setImageGenerating(true);
    setLastImagePrompt(prompt);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, prompt }),
      });
      const data = await res.json();
      const newId = res.headers.get("X-Conversation-Id") ?? conversationId;
      if (newId && newId !== conversationId) setConversationId(newId);

      if (!res.ok) {
        setImageError(data.error ?? "Naze tidak bisa membuat gambar sekarang.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: prompt, kind: "image", imageUrl: data.url, imagePrompt: prompt },
      ]);
      history.refresh();
    } finally {
      setImageGenerating(false);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || stream.isStreaming || imageGenerating) return;
    setDraft("");

    if (imageMode) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
      setImageMode(false);
      generateImage(text);
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);

    stream.send({ conversationId, message: text }, ({ finalText, conversationId: newId }) => {
      if (newId && newId !== conversationId) setConversationId(newId);
      history.refresh();
      if (!finalText) return;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: finalText }]);
    });
  };

  const regenerate = () => {
    if (!conversationId || stream.isStreaming) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.role === "assistant" && last.kind !== "image" ? prev.slice(0, -1) : prev;
    });
    stream.send({ conversationId, regenerate: true }, ({ finalText }) => {
      history.refresh();
      if (!finalText) return;
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: finalText }]);
    });
  };

  return (
    <div className="flex h-dvh bg-canvas">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={newChat}
        activeConversationId={conversationId}
        onSelectConversation={selectConversation}
        conversations={history.conversations}
        rename={history.rename}
        togglePinned={history.togglePinned}
        setArchived={history.setArchived}
        remove={handleRemove}
        removeAll={async () => {
          await history.removeAll();
          newChat();
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <button
            aria-label="Buka daftar percakapan"
            onClick={() => setSidebarOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-md text-ink-muted hover:bg-surface-raised hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <NazeMark size={20} />
          <span className="font-display text-sm font-semibold text-ink">Naze</span>
        </header>

        <main className="mx-auto flex w-full max-w-thread flex-1 flex-col gap-6 overflow-y-auto px-4 py-8">
          {messages.length === 0 && !stream.isStreaming && !stream.error && !loadingConversation && !imageGenerating && (
            <div className="m-auto flex flex-col items-center gap-3 text-center">
              <NazeMark size={40} />
              <p className="font-display text-lg font-semibold text-ink">Mulai percakapan dengan Naze</p>
              <p className="max-w-xs text-[14px] text-ink-muted">
                Tanya apa saja, atau tekan ikon gambar untuk minta Naze membuatkan gambar.
              </p>
            </div>
          )}

          {messages.map((m, i) => {
            if (m.role === "user") return <UserMessage key={m.id}>{m.content}</UserMessage>;
            if (m.kind === "image" && m.imageUrl) {
              return (
                <ImageMessage
                  key={m.id}
                  url={m.imageUrl}
                  prompt={m.imagePrompt ?? ""}
                  onRegenerate={i === messages.length - 1 ? () => generateImage(m.imagePrompt ?? "") : undefined}
                />
              );
            }
            return (
              <AiMessage
                key={m.id}
                content={m.content}
                onRegenerate={i === messages.length - 1 ? regenerate : undefined}
                onFeedback={(v) => console.log("feedback", m.id, v)}
              />
            );
          })}

          {stream.isStreaming && stream.streamingText === "" && <ThinkingIndicator />}
          {stream.isStreaming && stream.streamingText !== "" && (
            <AiMessage content={stream.streamingText} streaming />
          )}
          {imageGenerating && <ThinkingIndicator label="Naze sedang membuat gambar" />}

          {stream.error && <ErrorNotice message={stream.error} onRetry={stream.retry} />}
          {imageError && (
            <ErrorNotice
              message={imageError}
              onRetry={lastImagePrompt ? () => generateImage(lastImagePrompt) : undefined}
            />
          )}
        </main>

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          isGenerating={stream.isStreaming || imageGenerating}
          onStop={stream.stop}
          imageMode={imageMode}
          onToggleImageMode={() => setImageMode((v) => !v)}
          onOpenCall={() => setCallOpen(true)}
        />
      </div>

      {callOpen && (
        <CallScreen
          conversationId={conversationId}
          onConversationIdChange={setConversationId}
          onExchange={(userText, assistantText) => {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "user", content: userText },
              { id: crypto.randomUUID(), role: "assistant", content: assistantText },
            ]);
            history.refresh();
          }}
          onClose={() => setCallOpen(false)}
        />
      )}
    </div>
  );
}
