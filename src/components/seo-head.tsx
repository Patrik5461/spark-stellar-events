import { useEffect } from "react";
import { useSiteSettings } from "@/lib/use-site-settings";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Applies SEO values configured in Admin → Nastavenia → SEO
 * on top of the route's static head defaults.
 */
export function SeoHead() {
  const s = useSiteSettings();

  useEffect(() => {
    if (!s) return;
    if (s.seo_title) {
      document.title = s.seo_title;
      setMeta("property", "og:title", s.seo_title);
      setMeta("name", "twitter:title", s.seo_title);
    }
    if (s.seo_description) {
      setMeta("name", "description", s.seo_description);
      setMeta("property", "og:description", s.seo_description);
      setMeta("name", "twitter:description", s.seo_description);
    }
    if (s.seo_keywords) setMeta("name", "keywords", s.seo_keywords);
    if (s.seo_og_image_url) {
      setMeta("property", "og:image", s.seo_og_image_url);
      setMeta("name", "twitter:image", s.seo_og_image_url);
      setMeta("name", "twitter:card", "summary_large_image");
    }
  }, [s]);

  return null;
}
