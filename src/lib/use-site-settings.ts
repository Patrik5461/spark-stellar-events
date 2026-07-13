import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

// Module-level cache so multiple components on the same page share one fetch
// and updates in /admin/settings reflect on the next mount / route change.
let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings | null> | null = null;
const listeners = new Set<(s: SiteSettings | null) => void>();

async function fetchSettings(): Promise<SiteSettings | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      cached = (data as SiteSettings | null) ?? null;
      listeners.forEach((l) => l(cached));
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(cached);

  useEffect(() => {
    const listener = (s: SiteSettings | null) => setSettings(s);
    listeners.add(listener);
    if (!cached) {
      fetchSettings();
    } else {
      // Refresh in background so edits appear on re-navigation.
      cached = cached;
      fetchSettings();
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return settings;
}

// Utility: use value from DB if set, else fallback default.
export function pick<T extends keyof SiteSettings>(
  s: SiteSettings | null,
  key: T,
  fallback: NonNullable<SiteSettings[T]>,
): NonNullable<SiteSettings[T]> {
  const v = s?.[key];
  if (v === null || v === undefined || v === "") return fallback;
  return v as NonNullable<SiteSettings[T]>;
}
