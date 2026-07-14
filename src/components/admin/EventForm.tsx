import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Plus } from "lucide-react";
import {
  listEventClients,
  createEventClient,
} from "@/lib/events.functions";
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABEL,
  WORKER_TYPES,
  WORKER_TYPE_LABEL,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABEL,
  type EventStatus,
  type WorkerType,
  type PaymentType,
} from "@/lib/event-constants";

export type EventFormValues = {
  name: string;
  client_id: string | null;
  client_contact_name: string;
  client_phone: string;
  client_email: string;
  location: string;
  date_from: string;
  date_to: string;
  time_from: string;
  time_to: string;
  worker_type: WorkerType;
  required_workers: number;
  payment_amount: string; // as string for input
  payment_type: PaymentType;
  dress_code: string;
  clothing_instructions: string;
  job_description: string;
  requirements: string;
  required_languages: string;
  requires_food_certificate: boolean;
  requires_driver_license: boolean;
  requires_car: boolean;
  public_note: string;
  internal_note: string;
  status: EventStatus;
};

export const emptyEvent: EventFormValues = {
  name: "",
  client_id: null,
  client_contact_name: "",
  client_phone: "",
  client_email: "",
  location: "",
  date_from: "",
  date_to: "",
  time_from: "",
  time_to: "",
  worker_type: "hosteska",
  required_workers: 1,
  payment_amount: "",
  payment_type: "za_hodinu",
  dress_code: "",
  clothing_instructions: "",
  job_description: "",
  requirements: "",
  required_languages: "",
  requires_food_certificate: false,
  requires_driver_license: false,
  requires_car: false,
  public_note: "",
  internal_note: "",
  status: "koncept",
};

const inputCls =
  "w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm outline-none focus:border-[#383B3A]";
const labelCls = "block text-xs uppercase tracking-wider text-[#726D6A] mb-1";

export function EventForm({
  initial,
  submitLabel,
  onSubmit,
  submitting,
}: {
  initial: EventFormValues;
  submitLabel: string;
  onSubmit: (v: EventFormValues) => Promise<void>;
  submitting: boolean;
}) {
  const [v, setV] = useState<EventFormValues>(initial);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [nc, setNc] = useState({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
  });
  const clientsFn = useServerFn(listEventClients);
  const createClient = useServerFn(createEventClient);

  useEffect(() => {
    clientsFn()
      .then((rows: any) => setClients(rows))
      .catch((e: any) => toast.error(e?.message || "Nepodarilo sa načítať klientov."));
  }, [clientsFn]);

  function set<K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function addClient() {
    if (!nc.name.trim()) {
      toast.error("Zadajte názov klienta.");
      return;
    }
    try {
      const row: any = await createClient({ data: nc });
      setClients((cs) => [...cs, { id: row.id, name: row.name }].sort((a, b) => a.name.localeCompare(b.name, "sk")));
      set("client_id", row.id);
      setNewClientOpen(false);
      setNc({ name: "", contact_name: "", phone: "", email: "" });
      toast.success("Klient pridaný.");
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri pridaní klienta.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(v);
  }

  const priceRequired = v.payment_type !== "na_vyziadanie";

  return (
    <form onSubmit={submit} className="space-y-6 max-w-[1000px]">
      {/* Základné údaje */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Základné údaje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Názov eventu *</label>
            <input
              className={inputCls}
              required
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Klient *</label>
            <div className="flex gap-2">
              <select
                className={inputCls}
                value={v.client_id ?? ""}
                onChange={(e) => set("client_id", e.target.value || null)}
                required
              >
                <option value="">— Vyberte klienta —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewClientOpen((x) => !x)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white"
              >
                <Plus className="h-4 w-4" /> Nový
              </button>
            </div>
            {newClientOpen && (
              <div className="mt-3 p-3 rounded-lg bg-white border border-[#D9D2CC] space-y-2">
                <input
                  className={inputCls}
                  placeholder="Názov klienta *"
                  value={nc.name}
                  onChange={(e) => setNc({ ...nc, name: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Kontaktná osoba"
                  value={nc.contact_name}
                  onChange={(e) => setNc({ ...nc, contact_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputCls}
                    placeholder="Telefón"
                    value={nc.phone}
                    onChange={(e) => setNc({ ...nc, phone: e.target.value })}
                  />
                  <input
                    className={inputCls}
                    placeholder="Email"
                    type="email"
                    value={nc.email}
                    onChange={(e) => setNc({ ...nc, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setNewClientOpen(false)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-[#D9D2CC]"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="button"
                    onClick={addClient}
                    className="text-sm px-3 py-1.5 rounded-lg bg-[#383B3A] text-[#F5F1EC]"
                  >
                    Uložiť klienta
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Miesto výkonu *</label>
            <input
              className={inputCls}
              required
              value={v.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Kontakt klienta</label>
            <input
              className={inputCls}
              placeholder="Meno"
              value={v.client_contact_name}
              onChange={(e) => set("client_contact_name", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Telefón klienta</label>
              <input
                className={inputCls}
                value={v.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Email klienta</label>
              <input
                className={inputCls}
                type="email"
                value={v.client_email}
                onChange={(e) => set("client_email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Stav</label>
            <select
              className={inputCls}
              value={v.status}
              onChange={(e) => set("status", e.target.value as EventStatus)}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EVENT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Termín */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Termín
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>Dátum od *</label>
            <input
              type="date"
              required
              className={inputCls}
              value={v.date_from}
              onChange={(e) => set("date_from", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Dátum do *</label>
            <input
              type="date"
              required
              className={inputCls}
              value={v.date_to}
              onChange={(e) => set("date_to", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Čas od</label>
            <input
              type="time"
              className={inputCls}
              value={v.time_from}
              onChange={(e) => set("time_from", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Čas do</label>
            <input
              type="time"
              className={inputCls}
              value={v.time_to}
              onChange={(e) => set("time_to", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Pracovníci a odmena */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Pracovníci a odmena
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Typ pracovníka *</label>
            <select
              className={inputCls}
              value={v.worker_type}
              onChange={(e) => set("worker_type", e.target.value as WorkerType)}
            >
              {WORKER_TYPES.map((w) => (
                <option key={w} value={w}>
                  {WORKER_TYPE_LABEL[w]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Počet požadovaných pracovníkov *</label>
            <input
              type="number"
              min={0}
              required
              className={inputCls}
              value={v.required_workers}
              onChange={(e) =>
                set("required_workers", Number(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label className={labelCls}>Typ odmeny *</label>
            <select
              className={inputCls}
              value={v.payment_type}
              onChange={(e) => set("payment_type", e.target.value as PaymentType)}
            >
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_TYPE_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Odmena {priceRequired ? "*" : "(voliteľné)"}
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputCls}
              disabled={!priceRequired}
              required={priceRequired}
              value={v.payment_amount}
              onChange={(e) => set("payment_amount", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Dress code a popis */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Detaily práce
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Dress code</label>
            <input
              className={inputCls}
              value={v.dress_code}
              onChange={(e) => set("dress_code", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Potrebné jazyky</label>
            <input
              className={inputCls}
              placeholder="SK, EN, DE…"
              value={v.required_languages}
              onChange={(e) => set("required_languages", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Pokyny k oblečeniu</label>
            <textarea
              rows={2}
              className={inputCls}
              value={v.clothing_instructions}
              onChange={(e) => set("clothing_instructions", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Popis práce</label>
            <textarea
              rows={3}
              className={inputCls}
              value={v.job_description}
              onChange={(e) => set("job_description", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Požiadavky</label>
            <textarea
              rows={2}
              className={inputCls}
              value={v.requirements}
              onChange={(e) => set("requirements", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.requires_food_certificate}
              onChange={(e) =>
                set("requires_food_certificate", e.target.checked)
              }
            />
            Potravinársky preukaz
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.requires_driver_license}
              onChange={(e) => set("requires_driver_license", e.target.checked)}
            />
            Vodičský preukaz
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.requires_car}
              onChange={(e) => set("requires_car", e.target.checked)}
            />
            Vlastné auto
          </label>
        </div>
      </section>

      {/* Poznámky */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Poznámky
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Verejná poznámka pre pracovníkov</label>
            <textarea
              rows={3}
              className={inputCls}
              value={v.public_note}
              onChange={(e) => set("public_note", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Interná poznámka</label>
            <textarea
              rows={3}
              className={inputCls}
              value={v.internal_note}
              onChange={(e) => set("internal_note", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {submitting ? "Ukladám…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function toPayload(v: EventFormValues) {
  return {
    name: v.name,
    client_id: v.client_id,
    client_contact_name: v.client_contact_name || null,
    client_phone: v.client_phone || null,
    client_email: v.client_email || null,
    location: v.location,
    date_from: v.date_from,
    date_to: v.date_to,
    time_from: v.time_from || null,
    time_to: v.time_to || null,
    worker_type: v.worker_type,
    required_workers: Number(v.required_workers) || 0,
    payment_amount:
      v.payment_type === "na_vyziadanie" || v.payment_amount === ""
        ? null
        : Number(v.payment_amount),
    payment_type: v.payment_type,
    dress_code: v.dress_code || null,
    clothing_instructions: v.clothing_instructions || null,
    job_description: v.job_description || null,
    requirements: v.requirements || null,
    required_languages: v.required_languages || null,
    requires_food_certificate: v.requires_food_certificate,
    requires_driver_license: v.requires_driver_license,
    requires_car: v.requires_car,
    public_note: v.public_note || null,
    internal_note: v.internal_note || null,
    status: v.status,
  };
}

export function fromRow(r: any): EventFormValues {
  return {
    name: r.name ?? "",
    client_id: r.client_id ?? null,
    client_contact_name: r.client_contact_name ?? "",
    client_phone: r.client_phone ?? "",
    client_email: r.client_email ?? "",
    location: r.location ?? "",
    date_from: r.date_from ?? "",
    date_to: r.date_to ?? "",
    time_from: (r.time_from ?? "").slice(0, 5),
    time_to: (r.time_to ?? "").slice(0, 5),
    worker_type: r.worker_type ?? "hosteska",
    required_workers: r.required_workers ?? 1,
    payment_amount: r.payment_amount == null ? "" : String(r.payment_amount),
    payment_type: r.payment_type ?? "za_hodinu",
    dress_code: r.dress_code ?? "",
    clothing_instructions: r.clothing_instructions ?? "",
    job_description: r.job_description ?? "",
    requirements: r.requirements ?? "",
    required_languages: r.required_languages ?? "",
    requires_food_certificate: !!r.requires_food_certificate,
    requires_driver_license: !!r.requires_driver_license,
    requires_car: !!r.requires_car,
    public_note: r.public_note ?? "",
    internal_note: r.internal_note ?? "",
    status: r.status ?? "koncept",
  };
}
