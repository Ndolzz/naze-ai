"use client";

import { useCallback, useEffect, useState } from "react";
import { NazeSettings, DEFAULT_SETTINGS } from "@/lib/settings/types";

export function useSettings() {
  const [settings, setSettings] = useState<NazeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = async (patch: Partial<NazeSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch })); // optimistic
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  };

  return { settings, loading, update };
}
