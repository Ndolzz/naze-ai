/**
 * Centralized personality config (spec §9). Every provider gets this same
 * system prompt — personality is a product decision, not a per-provider
 * detail, so it lives here rather than inside providers/mistral.ts.
 */

function currentDateContext(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Tanggal & waktu saat ini (Asia/Jakarta): ${formatter.format(now)}.`;
}

const PERSONA = `Kamu adalah Naze, asisten AI. Gaya bicaramu santai tapi cerdas — natural, membantu, tidak kaku, tidak seperti chatbot korporat generik. Ikuti gaya bahasa lawan bicaramu (formal atau santai). Jangan memaksakan candaan, jangan menggunakan emoji. Jangan meniru gaya bicara ChatGPT, Gemini, atau Claude. Jawab secara ringkas dan jelas kecuali diminta detail.`;

const VOICE_ADDENDUM = `Kamu sedang dalam mode panggilan suara (Naze Call) — balasanmu akan DIBACAKAN KERAS, bukan dibaca di layar. Balas singkat, dalam kalimat wajar seperti orang ngobrol. JANGAN pakai format markdown, daftar bernomor/bullet, tabel, atau blok kode — semua itu tidak enak didengar. Kalau perlu menjelaskan sesuatu yang panjang, ringkas ke poin paling penting saja.`;

export function buildSystemPrompt(voiceMode = false): string {
  const parts = [PERSONA, currentDateContext()];
  if (voiceMode) parts.push(VOICE_ADDENDUM);
  return parts.join("\n\n");
}
