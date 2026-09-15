import { ImageProvider } from "@/lib/ai/image/types";
import { PollinationsProvider } from "@/lib/ai/image/providers/pollinations";

/** Everything outside this folder calls this instead of constructing a
 *  provider directly — the same rule as lib/ai/index.ts for chat. */
export function getImageProvider(): ImageProvider {
  return new PollinationsProvider();
}

export * from "@/lib/ai/image/types";
