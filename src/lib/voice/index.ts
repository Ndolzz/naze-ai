import { SpeechToTextProvider, TextToSpeechProvider } from "@/lib/voice/types";
import { WebSpeechToText } from "@/lib/voice/providers/webSpeechStt";
import { WebSpeechTextToSpeech } from "@/lib/voice/providers/webSpeechTts";

/** Everything outside this folder calls these instead of constructing a
 *  provider directly — same rule as lib/ai/index.ts and
 *  lib/ai/image/index.ts. Swapping to a cloud provider (using
 *  VOICE_API_KEY, reserved since Phase 1) later is a new file in
 *  providers/ plus a change here, not a rewrite of useCall.ts. */
export function getSpeechToText(): SpeechToTextProvider {
  return new WebSpeechToText();
}

export function getTextToSpeech(): TextToSpeechProvider {
  return new WebSpeechTextToSpeech();
}

export * from "@/lib/voice/types";
