export interface ConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * "Hari ini / Kemarin / 7 Hari Terakhir / 30 Hari Terakhir / Lebih Lama"
 * (spec §14). Pinned conversations are pulled into their own bucket at
 * the top regardless of date, since a pin is a stronger signal than
 * recency.
 */
export function groupConversationsByDate(conversations: ConversationSummary[]) {
  const today = startOfDay(new Date());
  const pinned: ConversationSummary[] = [];
  const buckets: Record<string, ConversationSummary[]> = {
    "Hari ini": [],
    Kemarin: [],
    "7 hari terakhir": [],
    "30 hari terakhir": [],
    "Lebih lama": [],
  };

  for (const c of conversations) {
    if (c.pinned) {
      pinned.push(c);
      continue;
    }
    const day = startOfDay(new Date(c.updatedAt));
    const diffDays = Math.round((today - day) / DAY_MS);

    if (diffDays <= 0) buckets["Hari ini"].push(c);
    else if (diffDays === 1) buckets["Kemarin"].push(c);
    else if (diffDays <= 7) buckets["7 hari terakhir"].push(c);
    else if (diffDays <= 30) buckets["30 hari terakhir"].push(c);
    else buckets["Lebih lama"].push(c);
  }

  const groups = Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));

  return pinned.length > 0 ? [{ label: "Disematkan", items: pinned }, ...groups] : groups;
}
