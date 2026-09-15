"use client";

import { SpeechToTextHandlers, SpeechToTextProvider } from "@/lib/voice/types";

/** Not in the standard lib.dom.d.ts yet in every TS target, so this stays
 *  loosely typed at the boundary rather than fighting the ambient types. */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak. Aktifkan izin mikrofon untuk browser ini di pengaturan.",
  "no-speech": "Tidak ada suara yang terdengar. Coba lagi.",
  "audio-capture": "Mikrofon tidak ditemukan.",
  network: "Koneksi bermasalah saat mengenali suara.",
};

/**
 * Wraps the browser's built-in SpeechRecognition — free, no API key, no
 * server round-trip. This is genuinely the point of choosing it (spec
 * ask: Naze harus bisa bicara, dan gratis). Trade-off, stated plainly:
 * browser support varies (solid on Chrome/Edge, absent on Firefox,
 * partial on Safari) — VOICE_API_KEY stays reserved if a cloud STT
 * provider is ever worth the cost for broader/more reliable coverage.
 */
export class WebSpeechToText implements SpeechToTextProvider {
  private recognition: SpeechRecognitionLike | null = null;

  get isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  start(handlers: SpeechToTextHandlers): void {
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;

    if (!Ctor) {
      handlers.onError("Browser ini tidak mendukung pengenalan suara.");
      handlers.onEnd();
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript as string;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) handlers.onInterim(interim);
      if (final) handlers.onFinal(final);
    };

    recognition.onerror = (event) => {
      handlers.onError(ERROR_MESSAGES[event.error] ?? `Pengenalan suara gagal (${event.error}).`);
    };

    recognition.onend = () => handlers.onEnd();

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      handlers.onError("Tidak bisa memulai mikrofon.");
      handlers.onEnd();
    }
  }

  stop(): void {
    this.recognition?.stop();
  }
}
