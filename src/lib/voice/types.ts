export interface SpeechToTextHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
  /** Fires whenever recognition stops, for ANY reason — a final result,
   *  silence timeout, or an error. Callers use this to know when it's
   *  safe to assume nothing more is coming without a final result. */
  onEnd: () => void;
}

export interface SpeechToTextProvider {
  readonly isSupported: boolean;
  start(handlers: SpeechToTextHandlers): void;
  stop(): void;
}

export interface TextToSpeechHandlers {
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface TextToSpeechProvider {
  readonly isSupported: boolean;
  /** `rate` mirrors SpeechSynthesisUtterance.rate (1 = normal); omitted
   *  means default speed. Wired from Settings §27 (Voice). */
  speak(text: string, handlers: TextToSpeechHandlers, rate?: number): void;
  stop(): void;
}
