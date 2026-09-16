export type AccentId = "royal" | "emerald" | "sapphire" | "gold" | "rose";

export interface NazeSettings {
  theme: "dark" | "light";
  /** Accent palette, applied as data-accent on <html> (see globals.css). */
  accent: AccentId;
  memoryEnabled: boolean;
  /** SpeechSynthesisUtterance.rate, kept to a sane band. */
  voiceRate: number;
}

export const DEFAULT_SETTINGS: NazeSettings = {
  theme: "dark",
  accent: "royal",
  memoryEnabled: true,
  voiceRate: 1,
};

export const ACCENT_IDS: AccentId[] = ["royal", "emerald", "sapphire", "gold", "rose"];

export function sanitizeSettings(data: unknown): Partial<NazeSettings> {
  if (typeof data !== "object" || data === null) return {};
  const d = data as Record<string, unknown>;
  const out: Partial<NazeSettings> = {};
  if (d.theme === "dark" || d.theme === "light") out.theme = d.theme;
  if (typeof d.accent === "string" && (ACCENT_IDS as string[]).includes(d.accent)) {
    out.accent = d.accent as AccentId;
  }
  if (typeof d.memoryEnabled === "boolean") out.memoryEnabled = d.memoryEnabled;
  if (typeof d.voiceRate === "number" && d.voiceRate >= 0.5 && d.voiceRate <= 2) out.voiceRate = d.voiceRate;
  return out;
}
