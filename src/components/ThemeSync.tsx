"use client";

import { useEffect } from "react";

/**
 * `layout.tsx` renders with `data-theme="dark"` and `data-accent="royal"`
 * on the server (so there's no unstyled flash for the common case). This
 * corrects both after mount to whatever is actually stored for the
 * account. A brief flash of the default look for users who changed either
 * is an accepted trade-off rather than adding cookie-based SSR reading
 * for two settings fields.
 */
export default function ThemeSync() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.theme === "light") {
          document.documentElement.dataset.theme = "light";
        }
        if (typeof data?.settings?.accent === "string") {
          document.documentElement.dataset.accent = data.settings.accent;
        }
      })
      .catch(() => {
        // Non-critical. Worst case the page stays on the default look.
      });
  }, []);

  return null;
}
