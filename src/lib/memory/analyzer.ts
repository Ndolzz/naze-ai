import { getChatProvider } from "@/lib/ai";
import { ChatMessage } from "@/lib/ai/types";
import { getMemoryPool, createMemory, updateMemory, deleteMemory, clampImportance } from "@/lib/database/memories";

interface AnalyzerDecision {
  action: "create" | "update" | "delete" | "ignore";
  content?: string;
  category?: string;
  importance?: number;
  memoryId?: string;
}

const VALID_ACTIONS = new Set(["create", "update", "delete", "ignore"]);

const ANALYZER_SYSTEM_PROMPT = `Kamu adalah Memory Analyzer, bagian dari sistem Naze. Tugasmu: putuskan apakah satu pertukaran pesan (user + balasan Naze) mengandung informasi yang layak diingat jangka panjang tentang pengguna — preferensi, proyek yang sedang dikerjakan, tujuan berulang, gaya komunikasi, fakta stabil tentang mereka.

JANGAN simpan: obrolan basa-basi, pertanyaan satu kali yang tidak akan relevan lagi, informasi sensitif (kesehatan, data pribadi sensitif), atau apa pun yang sifatnya sementara.

Kamu akan diberi daftar memori yang sudah tersimpan. Jika salah satu memori itu sekarang salah/usang karena pertukaran terbaru, pilih "update" (dengan memoryId dan content baru) atau "delete" jika sudah tidak relevan sama sekali. Jika informasi baru dan belum ada yang serupa, pilih "create". Jika tidak ada yang layak disimpan/diubah, pilih "ignore".

Balas HANYA dengan JSON valid, tanpa teks lain, dengan bentuk persis:
{"action": "create|update|delete|ignore", "content": "...", "category": "...", "importance": 1-5, "memoryId": "..."}
Field yang tidak relevan untuk action tersebut boleh dihilangkan.`;

/**
 * Runs after an assistant reply is saved (spec §10 pipeline: Percakapan →
 * Memory Analyzer → Create/Update/Ignore/Delete → Database). Failures
 * here are swallowed by the caller — a broken analyzer must never break
 * the chat response that already reached the user.
 */
export async function runMemoryAnalyzer(
  userId: string,
  sourceConversationId: string,
  userMessage: string,
  assistantMessage: string
) {
  const existing = await getMemoryPool(userId, 30);
  const existingList =
    existing.length > 0
      ? existing.map((m) => `- [${m.id}] ${m.content}`).join("\n")
      : "(belum ada memori tersimpan)";

  const messages: ChatMessage[] = [
    { role: "system", content: ANALYZER_SYSTEM_PROMPT },
    {
      role: "user",
      content: `Memori yang sudah tersimpan:\n${existingList}\n\nPertukaran terbaru:\nUser: ${userMessage}\nNaze: ${assistantMessage}\n\nKeputusanmu (JSON saja):`,
    },
  ];

  const decision = await getDecision(messages);
  if (!decision) return;

  switch (decision.action) {
    case "create":
      if (decision.content?.trim()) {
        await createMemory(
          userId,
          decision.content.trim(),
          decision.category?.trim() || null,
          clampImportance(decision.importance),
          sourceConversationId
        );
      }
      break;
    case "update":
      if (decision.memoryId && decision.content?.trim()) {
        await updateMemory(userId, decision.memoryId, {
          content: decision.content.trim(),
          category: decision.category?.trim(),
          importance: clampImportance(decision.importance),
        });
      }
      break;
    case "delete":
      if (decision.memoryId) {
        await deleteMemory(userId, decision.memoryId);
      }
      break;
    case "ignore":
    default:
      break;
  }
}

async function getDecision(messages: ChatMessage[]): Promise<AnalyzerDecision | null> {
  try {
    const provider = getChatProvider();
    const raw = await provider.complete(messages);
    const jsonText = extractJson(raw);
    const parsed = JSON.parse(jsonText);
    if (!VALID_ACTIONS.has(parsed.action)) return null;
    return parsed as AnalyzerDecision;
  } catch {
    // Malformed JSON, provider error, whatever — the analyzer is a
    // best-effort side effect, not something worth surfacing to the user.
    return null;
  }
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in analyzer response.");
  }
  return text.slice(start, end + 1);
}
