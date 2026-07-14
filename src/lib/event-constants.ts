export const EVENT_STATUSES = [
  "koncept",
  "otvoreny_nabor",
  "obsadene",
  "prebieha",
  "dokoncene",
  "zrusene",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  koncept: "Koncept",
  otvoreny_nabor: "Otvorený nábor",
  obsadene: "Obsadené",
  prebieha: "Prebieha",
  dokoncene: "Dokončené",
  zrusene: "Zrušené",
};

export const EVENT_STATUS_COLOR: Record<EventStatus, string> = {
  koncept: "bg-[#D9D2CC] text-[#383B3A]",
  otvoreny_nabor: "bg-blue-100 text-blue-800",
  obsadene: "bg-emerald-100 text-emerald-800",
  prebieha: "bg-amber-100 text-amber-800",
  dokoncene: "bg-[#383B3A] text-[#F5F1EC]",
  zrusene: "bg-red-100 text-red-800",
};

export const WORKER_TYPES = [
  "hosteska",
  "promoter",
  "helper",
  "produkcia",
  "ine",
] as const;
export type WorkerType = (typeof WORKER_TYPES)[number];

export const WORKER_TYPE_LABEL: Record<WorkerType, string> = {
  hosteska: "Hosteska",
  promoter: "Promotér",
  helper: "Helper",
  produkcia: "Produkcia",
  ine: "Iné",
};

export const PAYMENT_TYPES = [
  "za_hodinu",
  "za_den",
  "jednorazova",
  "na_vyziadanie",
] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  za_hodinu: "Za hodinu",
  za_den: "Za deň",
  jednorazova: "Jednorazová odmena",
  na_vyziadanie: "Cena na vyžiadanie",
};

export const ASSIGNMENT_STATUSES = [
  "navrhnuta",
  "kontaktovana",
  "potvrdena",
  "odmietnutna",
  "nahradnicka",
  "zucastnila_sa",
  "neprisla",
  "zrusena",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  navrhnuta: "Navrhnutá",
  kontaktovana: "Kontaktovaná",
  potvrdena: "Potvrdená",
  odmietnutna: "Odmietnutá",
  nahradnicka: "Náhradníčka",
  zucastnila_sa: "Zúčastnila sa",
  neprisla: "Neprišla",
  zrusena: "Zrušená",
};

export const ATTENDANCE_STATUSES = [
  "nevyplnene",
  "ok",
  "meskala",
  "odisla_skor",
  "neprisla",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  nevyplnene: "Nevyplnené",
  ok: "OK",
  meskala: "Meškala",
  odisla_skor: "Odišla skôr",
  neprisla: "Neprišla",
};
