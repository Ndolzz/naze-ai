export interface NazeSettings {
  theme: "dark" | "light";
  memoryEnabled: boolean;
  /** SpeechSynthesisUtterance.rate range is 0.1–10; kept to a sane band. */
  voiceRate: number;
}

export const DEFAULT_SETTINGS: NazeSettings = {
  theme: "dark",
  memoryEnabled: true,
  voiceRate: 1,
};

export function sanitizeSettings(data: unknown): Partial<NazeSettings> {
  if (typeof data !== "object" || data === null) return {};
  const d = data as Record<string, unknown>;
  const out: Partial<NazeSettings> = {};
  if (d.theme === "dark" || d.theme === "light") out.theme = d.theme;
  if (typeof d.memoryEnabled === "boolean") out.memoryEnabled = d.memoryEnabled;
  if (typeof d.voiceRate === "number" && d.voiceRate >= 0.5 && d.voiceRate <= 2) out.voiceRate = d.voiceRate;
  return out;
}
