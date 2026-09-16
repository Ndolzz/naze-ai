import { ChatProvider, ProviderError } from "@/lib/ai/types";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

/**
 * Everything outside src/lib/ai calls this instead of constructing a
 * provider directly. Switching the main text provider later is a one-line
 * change here, not a search-and-replace across the app.
 */
export function getChatProvider(): ChatProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ProviderError(
      "Server belum dikonfigurasi: GEMINI_API_KEY kosong.",
      500
    );
  }
  return new GeminiProvider(apiKey);
}

export * from "@/lib/ai/types";
