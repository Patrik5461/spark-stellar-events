export type GalleryCategory = "Hostessing" | "Promotion" | "Helperi" | "Produkcia" | "Ostatné";

export type GalleryItem = {
  src: string;
  alt: string;
  cap: string;
  category: GalleryCategory;
  featured?: boolean;
};

export const GALLERY_ITEMS: GalleryItem[] = [];

export const GALLERY_CATEGORIES: ("Všetko" | GalleryCategory)[] = [
  "Všetko",
  "Hostessing",
  "Promotion",
  "Helperi",
  "Produkcia",
  "Ostatné",
];
