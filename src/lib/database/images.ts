import { prisma } from "@/lib/database/prisma";

export async function createGeneratedImage(conversationId: string, prompt: string, url: string) {
  return prisma.generatedImage.create({ data: { conversationId, prompt, url } });
}
