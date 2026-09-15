import { ImageProvider, ImageProviderError } from "@/lib/ai/image/types";

const BASE_URL = "https://image.pollinations.ai/prompt";

/**
 * Pollinations' legacy image endpoint: a plain GET request, no API key,
 * no account, returns the image directly. Chosen as the default provider
 * specifically because it's genuinely free — Phase 6 works with zero
 * extra signup or billing setup. IMAGE_API_KEY (declared in .env.example
 * since Phase 1) stays reserved for swapping in a paid provider later
 * (Stability, etc.) if quality/reliability needs outgrow this — that
 * swap is a new file in providers/ plus one line in index.ts, same
 * pattern as the text provider.
 *
 * The URL itself IS the image resource (Pollinations serves/caches it at
 * that exact URL), so we fetch it once here just to confirm generation
 * actually succeeded — spec §17: never show a fake image if the provider
 * failed — then hand the same URL back for the <img> tag to load.
 */
export class PollinationsProvider implements ImageProvider {
  readonly name = "pollinations";

  async generate(prompt: string): Promise<{ url: string }> {
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const params = new URLSearchParams({
      width: "1024",
      height: "1024",
      seed: String(seed),
      nologo: "true",
      model: "flux",
    });
    const url = `${BASE_URL}/${encodeURIComponent(prompt)}?${params.toString()}`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new ImageProviderError("Tidak bisa menghubungi layanan gambar sekarang.", 502);
    }

    if (!res.ok) {
      throw new ImageProviderError(
        `Layanan gambar merespons dengan status ${res.status}.`,
        res.status === 429 ? 429 : 502
      );
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new ImageProviderError("Layanan gambar tidak mengembalikan gambar yang valid.", 502);
    }

    return { url };
  }
}
