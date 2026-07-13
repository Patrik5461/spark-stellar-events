import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClothingCategory, ClothingItem } from "@/lib/clothing-data";

export function useClothingImages(): { items: ClothingItem[]; loading: boolean } {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("clothing_images")
        .select("id,url,title,description,category,sort_order,created_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) {
        setItems(
          data.map((r) => ({
            id: r.id as string,
            src: r.url as string,
            title: (r.title as string) || "",
            description: (r.description as string) || "",
            category: ((r.category as string) || "mix") as ClothingCategory,
          })),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
