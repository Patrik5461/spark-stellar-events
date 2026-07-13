export const CONTRACT_TYPES = [
  { value: "nepriradene", label: "Zatiaľ nepriradené" },
  { value: "prikazna_zmluva", label: "Príkazná zmluva" },
  { value: "dohoda_o_vykonani_prace", label: "Dohoda o vykonaní práce" },
  { value: "brigada_bez_zmluvy", label: "Brigáda bez zmluvy" },
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];
export const DEFAULT_CONTRACT_TYPE: ContractType = "nepriradene";

export const HOSTESS_STATUSES = [
  { value: "nova", label: "Nová" },
  { value: "skontrolovana", label: "Skontrolovaná" },
  { value: "schvalena", label: "Schválená" },
  { value: "zamietnuta", label: "Zamietnutá" },
  { value: "zmluva_pripravena", label: "Zmluva pripravená" },
  { value: "zmluva_podpisana", label: "Zmluva podpísaná" },
] as const;
export type HostessStatus = (typeof HOSTESS_STATUSES)[number]["value"];

export const PHOTO_TYPES = [
  { value: "portret", label: "Portrét", required: true },
  { value: "cela_postava", label: "Celá postava", required: true },
  { value: "profil", label: "Profil", required: true },
  { value: "dalsia", label: "Ďalšia fotografia", required: false },
] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number]["value"];

export const CONSENTS = [
  { value: "osobne_udaje", label: "Súhlasím so spracovaním osobných údajov." },
  { value: "pravdivost", label: "Potvrdzujem, že uvedené údaje sú pravdivé." },
  { value: "fotografie", label: "Súhlasím s použitím fotografií na interné účely agentúry." },
  { value: "elektronicke_dokumenty", label: "Súhlasím s elektronickým vyhotovením dokumentov." },
] as const;
export type ConsentType = (typeof CONSENTS)[number]["value"];

export const ACCEPT_MIME = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
export const ACCEPT_EXT = ".jpg,.jpeg,.png,.heic,.heif";
export const MAX_PHOTO_BYTES = 12 * 1024 * 1024; // 12MB per photo

export function statusLabel(v: string) {
  return HOSTESS_STATUSES.find((s) => s.value === v)?.label ?? v;
}
export function contractLabel(v: string) {
  return CONTRACT_TYPES.find((s) => s.value === v)?.label ?? v;
}
export function photoLabel(v: string) {
  return PHOTO_TYPES.find((s) => s.value === v)?.label ?? v;
}
