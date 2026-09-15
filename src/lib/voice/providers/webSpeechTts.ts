"use client";

import { TextToSpeechHandlers, TextToSpeechProvider } from "@/lib/voice/types";

/**
 * Wraps the browser's built-in speechSynthesis — same reasoning as
 * WebSpeechToText: free, no key, works today. Voice mode responses are
 * kept short/conversational in the persona prompt (spec §22) partly
 * because this reads them aloud exactly as written, with no SSML
 * shaping — a long, list-heavy chat answer would sound flat spoken verbatim.
 */
export class WebSpeechTextToSpeech implements TextToSpeechProvider {
  get isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, handlers: TextToSpeechHandlers, rate?: number): void {
    if (!this.isSupported) {
      handlers.onError("Browser ini tidak mendukung text-to-speech.");
      return;
    }
    // Cancel anything already queued/speaking before starting a new
    // utterance — otherwise overlapping replies queue up audibly.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    if (rate) utterance.rate = rate;
    utterance.onend = () => handlers.onEnd();
    utterance.onerror = () => handlers.onError("Naze gagal berbicara.");

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}
