import { ChatProvider, ProviderError } from "@/lib/ai/types";
import { MistralProvider } from "@/lib/ai/providers/mistral";

/**
 * Everything outside src/lib/ai calls this instead of constructing a
 * provider directly. Switching the main text provider later is a one-line
 * change here, not a search-and-replace across the app.
 */
export function getChatProvider(): ChatProvider {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new ProviderError(
      "Server belum dikonfigurasi: MISTRAL_API_KEY kosong.",
      500
    );
  }
  return new MistralProvider(apiKey);
}

export * from "@/lib/ai/types";
