/**
 * Mirrors lib/ai/types.ts but for image generation, kept as its own
 * abstraction because spec §17 is explicit that text AI and image AI
 * must be separated architecturally — a chat provider swap should never
 * touch image generation and vice versa.
 */
export interface ImageProvider {
  /** Recorded on the Message row (spec §31), not shown in the UI. */
  readonly name: string;
  generate(prompt: string): Promise<{ url: string }>;
}

export class ImageProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502
  ) {
    super(message);
    this.name = "ImageProviderError";
  }
}
