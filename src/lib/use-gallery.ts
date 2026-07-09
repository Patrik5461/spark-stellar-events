import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { GalleryItem, GalleryCategory } from "@/lib/gallery-data";

export function useGalleryImages(opts: { featuredOnly?: boolean; limit?: number } = {}): {
  items: GalleryItem[];
  loading: boolean;
} {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const map = (rows: Record<string, unknown>[]): GalleryItem[] =>
      rows.map((r) => ({
        src: r.url as string,
        alt: (r.alt as string) || "",
        cap: (r.caption as string) || "",
        category: (r.category as GalleryCategory) ?? "Ostatné",
        featured: (r.featured_on_homepage as boolean) ?? false,
      }));

    (async () => {
      try {
        const select = "url,alt,caption,category,featured_on_homepage,sort_order,is_active,created_at";
        if (opts.featuredOnly) {
          // 1) featured + active, ordered by sort_order
          let q = supabase
            .from("gallery_images")
            .select(select)
            .eq("is_active", true)
            .eq("featured_on_homepage", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          if (opts.limit) q = q.limit(opts.limit);
          const { data, error } = await q;
          if (cancelled) return;
          if (error) throw error;
          if ((data ?? []).length > 0) {
            setItems(map(data as Record<string, unknown>[]));
            return;
          }
          // 2) fallback: latest active
          let fq = supabase
            .from("gallery_images")
            .select(select)
            .eq("is_active", true)
            .order("created_at", { ascending: false });
          if (opts.limit) fq = fq.limit(opts.limit);
          const { data: fData, error: fErr } = await fq;
          if (cancelled) return;
          if (fErr) throw fErr;
          setItems(map((fData ?? []) as Record<string, unknown>[]));
          return;
        }

        let q = supabase
          .from("gallery_images")
          .select(select)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (opts.limit) q = q.limit(opts.limit);
        const { data, error } = await q;
        if (cancelled) return;
        if (error) throw error;
        setItems(map((data ?? []) as Record<string, unknown>[]));
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.featuredOnly, opts.limit]);

  return { items, loading };
}

