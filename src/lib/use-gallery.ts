import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GALLERY_ITEMS, type GalleryItem, type GalleryCategory } from "@/lib/gallery-data";

export function useGalleryImages(opts: { featuredOnly?: boolean } = {}): {
  items: GalleryItem[];
  loading: boolean;
} {
  const [items, setItems] = useState<GalleryItem[]>(() =>
    opts.featuredOnly ? GALLERY_ITEMS.filter((g) => g.featured) : GALLERY_ITEMS,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let q = supabase
          .from("gallery_images")
          .select("url,alt,caption,category,featured_on_homepage,sort_order,is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });
        if (opts.featuredOnly) q = q.eq("featured_on_homepage", true);
        const { data, error } = await q;
        if (cancelled) return;
        if (error) throw error;
        if (data && data.length > 0) {
          setItems(
            data.map((r) => ({
              src: r.url,
              alt: r.alt || "",
              cap: r.caption || "",
              category: (r.category as GalleryCategory) ?? "Ostatné",
              featured: r.featured_on_homepage ?? false,
            })),
          );
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.featuredOnly]);

  return { items, loading };
}
