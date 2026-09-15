"use client";

import { useEffect, useRef, useState } from "react";
import { getSpeechToText, getTextToSpeech } from "@/lib/voice";
import { useChatStream } from "@/features/chat/useChatStream";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

export type CallState = "idle" | "listening" | "thinking" | "speaking" | "error" | "disconnected";

interface UseCallParams {
  conversationId: string | null;
  onConversationIdChange: (id: string) => void;
  onExchange: (userText: string, assistantText: string) => void;
}

/**
 * Owns the whole Call flow: user speaks → STT → the SAME /api/chat
 * pipeline as text chat (so voice replies get memory, history, and
 * persistence for free) → TTS speaks the reply → listens again
 * automatically, like an actual phone call. Every state transition maps
 * to one of the six states spec §19 asks for.
 */
export function useCall({ conversationId, onConversationIdChange, onExchange }: UseCallParams) {
  const [state, setState] = useState<CallState>("idle");
  const [interimText, setInterimText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const sttRef = useRef(getSpeechToText());
  const ttsRef = useRef(getTextToSpeech());
  const stream = useChatStream();

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const voiceRateRef = useRef(DEFAULT_SETTINGS.voiceRate);

  // Voice rate is a Settings §27 preference — fetched once per call
  // rather than threaded through props, since useCall already owns every
  // other piece of call state.
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.settings?.voiceRate === "number") {
          voiceRateRef.current = data.settings.voiceRate;
        }
      })
      .catch(() => {
        // Non-critical — falls back to normal speed.
      });
  }, []);

  // Browser doesn't support one or both APIs at all — this is permanent
  // for this session, distinct from a one-off ERROR that's worth retrying.
  useEffect(() => {
    if (!sttRef.current.isSupported || !ttsRef.current.isSupported) {
      setState("disconnected");
      setErrorMessage("Browser ini tidak mendukung fitur suara. Coba Chrome atau Edge terbaru.");
    }
  }, []);

  // useChatStream reports failures via its own `error` state rather than
  // a callback, so surface it here while we're the one waiting on it.
  useEffect(() => {
    if (stream.error && state === "thinking") {
      setErrorMessage(stream.error);
      setState("error");
    }
  }, [stream.error, state]);

  function startListening() {
    if (!sttRef.current.isSupported) return;
    setInterimText("");
    setReplyText("");
    setErrorMessage(null);
    setState("listening");
    sttRef.current.start({
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setInterimText("");
        handleFinal(text);
      },
      onError: (message) => {
        setErrorMessage(message);
        setState("error");
      },
      onEnd: () => {
        // Recognition can end without a final result (silence, manual
        // stop) — only fall back to idle if we're still in "listening";
        // don't clobber a state a final result already moved us past.
        setState((s) => (s === "listening" ? "idle" : s));
      },
    });
  }

  function handleFinal(userText: string) {
    setState("thinking");
    stream.send(
      { conversationId: conversationIdRef.current, message: userText, voiceMode: true },
      ({ finalText, conversationId: newId }) => {
        if (newId && newId !== conversationIdRef.current) onConversationIdChange(newId);
        if (!finalText) {
          setState("idle");
          return;
        }
        onExchange(userText, finalText);
        setReplyText(finalText);

        if (mutedRef.current) {
          setState("idle");
          return;
        }

        setState("speaking");
        ttsRef.current.speak(
          finalText,
          {
            onEnd: () => {
              if (mutedRef.current) setState("idle");
              else startListening(); // continuous back-and-forth, like a real call
            },
            onError: (message) => {
              setErrorMessage(message);
              setState("error");
            },
          },
          voiceRateRef.current
        );
      }
    );
  }

  function stopListening() {
    sttRef.current.stop();
    setState("idle");
  }

  /** Tapping the mic while Naze is thinking/speaking interrupts it,
   *  rather than doing nothing — matches how people actually expect a
   *  voice call to behave. */
  function interrupt() {
    ttsRef.current.stop();
    stream.stop();
    setState("idle");
  }

  function endCall() {
    sttRef.current.stop();
    ttsRef.current.stop();
    stream.stop();
  }

  return {
    state,
    interimText,
    replyText,
    errorMessage,
    muted,
    setMuted,
    startListening,
    stopListening,
    interrupt,
    endCall,
  };
}
