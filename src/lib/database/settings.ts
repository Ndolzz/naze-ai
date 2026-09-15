import { prisma } from "@/lib/database/prisma";
import { NazeSettings, DEFAULT_SETTINGS, sanitizeSettings } from "@/lib/settings/types";

export type { NazeSettings };

export async function getSettings(userId: string): Promise<NazeSettings> {
  const row = await prisma.setting.findUnique({ where: { userId } });
  return { ...DEFAULT_SETTINGS, ...sanitizeSettings(row?.data) };
}

export async function updateSettings(userId: string, patch: unknown): Promise<NazeSettings> {
  const current = await getSettings(userId);
  const next = { ...current, ...sanitizeSettings(patch) };
  await prisma.setting.upsert({
    where: { userId },
    create: { userId, data: next },
    update: { data: next },
  });
  return next;
}
