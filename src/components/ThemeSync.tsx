"use client";

import { useEffect } from "react";

/**
 * `layout.tsx` renders with `data-theme="dark"` on the server (so there's
 * no unstyled flash for the common case). This just corrects it to
 * "light" after mount if that's what's actually stored — a brief flash
 * of dark-before-light for light-theme users on first load is an
 * accepted trade-off rather than adding cookie-based SSR theme reading
 * for one settings field.
 */
export default function ThemeSync() {
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.theme === "light") {
          document.documentElement.dataset.theme = "light";
        }
      })
      .catch(() => {
        // Non-critical — worst case the page just stays on the default theme.
      });
  }, []);

  return null;
}
