import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Availability, ClothingCategory, ClothingItem } from "@/lib/clothing-data";

export function useClothingImages(): { items: ClothingItem[]; loading: boolean } {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("clothing_images")
        .select(
          "id,url,title,description,category,price,currency,price_on_request,size,color,material,availability,featured_on_homepage,sort_order,created_at",
        )
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
            price: (r.price as number | null) ?? null,
            currency: (r.currency as string) || "EUR",
            priceOnRequest: (r.price_on_request as boolean) ?? false,
            size: (r.size as string) || "",
            color: (r.color as string) || "",
            material: (r.material as string) || "",
            availability: ((r.availability as string) || "available") as Availability,
            featuredOnHomepage: (r.featured_on_homepage as boolean) ?? false,
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
