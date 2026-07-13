export type ClothingCategory =
  | "white-dresses"
  | "red-dresses"
  | "black-dresses"
  | "metallic-dresses"
  | "mix"
  | "blue-dresses"
  | "blazers-coats"
  | "formal-dresses";

export const CLOTHING_CATEGORIES: { value: ClothingCategory; label: string }[] = [
  { value: "white-dresses", label: "Biele šaty" },
  { value: "red-dresses", label: "Červené šaty" },
  { value: "black-dresses", label: "Čierne šaty" },
  { value: "metallic-dresses", label: "Metalické šaty" },
  { value: "mix", label: "Mix" },
  { value: "blue-dresses", label: "Modré šaty" },
  { value: "blazers-coats", label: "Saká a kabáty" },
  { value: "formal-dresses", label: "Spoločenské šaty" },
];

export const CLOTHING_CATEGORY_LABEL: Record<ClothingCategory, string> =
  CLOTHING_CATEGORIES.reduce((acc, c) => {
    acc[c.value] = c.label;
    return acc;
  }, {} as Record<ClothingCategory, string>);

export type Availability = "available" | "reserved" | "unavailable";

export const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "available", label: "Dostupné" },
  { value: "reserved", label: "Rezervované" },
  { value: "unavailable", label: "Nedostupné" },
];

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: "Dostupné",
  reserved: "Rezervované",
  unavailable: "Nedostupné",
};

export type ClothingItem = {
  id: string;
  src: string;
  title: string;
  description: string;
  category: ClothingCategory;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  size: string;
  color: string;
  availability: Availability;
  featuredOnHomepage: boolean;
};

export function formatPrice(item: {
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
}): string {
  if (item.priceOnRequest) return "Cena na vyžiadanie";
  if (item.price == null) return "";
  const cur = item.currency || "EUR";
  const val = new Intl.NumberFormat("sk-SK", { maximumFractionDigits: 2 }).format(item.price);
  return cur === "EUR" ? `${val} €` : `${val} ${cur}`;
}
