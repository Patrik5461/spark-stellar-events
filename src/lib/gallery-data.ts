import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g3 from "@/assets/g3.jpg";
import g4 from "@/assets/g4.jpg";
import g5 from "@/assets/g5.jpg";
import g6 from "@/assets/g6.jpg";

export type GalleryCategory = "Hostessing" | "Promotion" | "Helperi" | "Produkcia" | "Ostatné";

export type GalleryItem = {
  src: string;
  alt: string;
  cap: string;
  category: GalleryCategory;
  featured?: boolean;
};

export const GALLERY_ITEMS: GalleryItem[] = [
  { src: g1, alt: "Hostesky na gala evente", cap: "Gala večer · Bratislava", category: "Hostessing", featured: true },
  { src: g2, alt: "Pódium produktového launchu", cap: "Product launch · Viedeň", category: "Produkcia", featured: true },
  { src: g6, alt: "Champagne na gala večeri", cap: "VIP recepcia", category: "Hostessing", featured: true },
  { src: g3, alt: "Promotéri na veľtrhu", cap: "Veľtrh · Praha", category: "Promotion", featured: true },
  { src: g5, alt: "Backstage produkcia", cap: "Backstage · Produkcia", category: "Helperi", featured: true },
  { src: g4, alt: "Portrét hostesky", cap: "Editorial portrét", category: "Ostatné", featured: true },
];

export const GALLERY_CATEGORIES: ("Všetko" | GalleryCategory)[] = [
  "Všetko",
  "Hostessing",
  "Promotion",
  "Helperi",
  "Produkcia",
  "Ostatné",
];
