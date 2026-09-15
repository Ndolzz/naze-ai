"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-critical — the app works fine without it installed, just
        // without shell caching / the offline fallback page.
      });
    }
  }, []);

  return null;
}
