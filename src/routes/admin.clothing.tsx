import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Plus, Pencil, Copy, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AVAILABILITY_LABEL,
  CLOTHING_CATEGORIES,
  CLOTHING_CATEGORY_LABEL,
  MATERIAL_OPTIONS,
  availabilityFromQuantity,
  type Availability,
} from "@/lib/clothing-data";

type Row = Database["public"]["Tables"]["clothing_images"]["Row"];

const SIGN_TTL = 60 * 60 * 24 * 365 * 5;
const CURRENCIES = ["EUR", "CZK", "USD"];
const SIZE_PRESETS = ["XS", "S", "M", "L", "XL", "univerzálna"];

export const Route = createFileRoute("/admin/clothing")({
  component: ClothingAdmin,
});

async function signUrl(path: string) {
  const { data, error } = await supabase.storage.from("gallery").createSignedUrl(path, SIGN_TTL);
  if (error) throw error;
  return data.signedUrl;
}

type FormState = {
  file: File | null;
  previewUrl: string;
  keepStoragePath: string | null; // existing storage path when editing
  keepUrl: string; // existing url when editing without file change
  title: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  priceOnRequest: boolean;
  size: string;
  color: string;
  material: string;
  quantity: string;
  internalNote: string;
  sortOrder: string;
  isActive: boolean;
  featuredOnHomepage: boolean;
};

function emptyForm(): FormState {
  return {
    file: null,
    previewUrl: "",
    keepStoragePath: null,
    keepUrl: "",
    title: "",
    description: "",
    category: "mix",
    price: "",
    currency: "EUR",
    priceOnRequest: false,
    size: "",
    color: "",
    material: "",
    quantity: "0",
    internalNote: "",
    sortOrder: "0",
    isActive: true,
    featuredOnHomepage: false,
  };
}

function rowToForm(r: Row): FormState {
  return {
    file: null,
    previewUrl: r.url,
    keepStoragePath: r.storage_path,
    keepUrl: r.url,
    title: r.title ?? "",
    description: r.description ?? "",
    category: r.category ?? "mix",
    price: r.price != null ? String(r.price) : "",
    currency: r.currency || "EUR",
    priceOnRequest: r.price_on_request ?? false,
    size: r.size ?? "",
    color: r.color ?? "",
    material: (r as unknown as { material?: string }).material ?? "",
    quantity: String((r as unknown as { quantity?: number }).quantity ?? 0),
    internalNote: r.internal_note ?? "",
    sortOrder: String(r.sort_order ?? 0),
    isActive: r.is_active ?? true,
    featuredOnHomepage: r.featured_on_homepage ?? false,
  };
}

function ClothingAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clothing_images")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };
  const openEdit = (r: Row) => {
    setEditingId(r.id);
    setForm(rowToForm(r));
    setModalOpen(true);
  };
  const openDuplicate = (r: Row) => {
    setEditingId(null);
    const base = rowToForm(r);
    setForm({ ...base, title: `${base.title} (kópia)`.trim(), featuredOnHomepage: false });
    setModalOpen(true);
  };

  const deleteRow = async (row: Row) => {
    if (!confirm(`Naozaj vymazať "${row.title || "položku"}"? Táto akcia je nevratná.`)) return;
    if (row.storage_path) await supabase.storage.from("gallery").remove([row.storage_path]);
    const { error } = await supabase.from("clothing_images").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Položka vymazaná");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Prenájom oblečenia</div>
          <h1 className="font-display text-4xl text-[#383B3A]">Fotografie oblečenia</h1>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-3 text-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Pridať položku
        </button>
      </header>

      {err && <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm">{err}</div>}

      {loading ? (
        <div className="text-[#726D6A]">Načítavam…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9D2CC] p-12 text-center text-[#726D6A]">
          Zatiaľ tu nie sú žiadne položky. Pridajte prvú vyššie.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#D9D2CC] bg-[#F5F1EC]">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.15em] text-[#726D6A]">
              <tr className="border-b border-[#D9D2CC]">
                <th className="p-3">Foto</th>
                <th className="p-3">Názov</th>
                <th className="p-3">Kategória</th>
                <th className="p-3">Cena</th>
                <th className="p-3">Kusy</th>
                <th className="p-3">Dostupnosť</th>
                <th className="p-3">Stav</th>
                <th className="p-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#D9D2CC] last:border-0 align-middle">
                  <td className="p-3">
                    <img
                      src={r.url}
                      alt={r.title}
                      className="w-16 h-16 object-cover rounded-lg border border-[#D9D2CC]"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-[#383B3A]">{r.title || <span className="text-[#726D6A] italic">bez názvu</span>}</div>
                    {r.size || r.color ? (
                      <div className="text-xs text-[#726D6A]">
                        {[r.size, r.color].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-[#726D6A]">{CLOTHING_CATEGORY_LABEL[r.category as keyof typeof CLOTHING_CATEGORY_LABEL] ?? r.category}</td>
                  <td className="p-3 text-[#726D6A]">
                    {r.price_on_request
                      ? "Na vyžiadanie"
                      : r.price != null
                        ? `${r.price} ${r.currency || "EUR"}`
                        : "—"}
                  </td>
                  <td className="p-3 text-[#726D6A]">{(r as unknown as { quantity?: number }).quantity ?? 0}</td>
                  <td className="p-3 text-[#726D6A]">{AVAILABILITY_LABEL[(r.availability as Availability) || "available"]}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${r.is_active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"}`}>
                      {r.is_active ? "Aktívna" : "Skrytá"}
                    </span>
                    {r.featured_on_homepage && (
                      <span className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-[#383B3A] text-[#F5F1EC]">
                        Homepage
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-[#EBE6E2]" title="Upraviť">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDuplicate(r)} className="p-2 rounded-lg hover:bg-[#EBE6E2]" title="Duplikovať">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteRow(r)} className="p-2 rounded-lg hover:bg-red-50 text-red-700" title="Vymazať">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ItemModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false);
            await load();
          }}
        />
      )}
    </section>
  );
}

function ItemModal({
  form,
  setForm,
  editingId,
  onClose,
  onSaved,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  editingId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onFile = (f: File | null) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setForm((prev) => ({ ...prev, file: f, previewUrl: url }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!editingId && !form.file) e.file = "Vyberte fotografiu.";
    if (!form.title.trim()) e.title = "Zadajte názov položky.";
    if (!form.category) e.category = "Vyberte kategóriu.";
    if (!form.description.trim()) e.description = "Zadajte krátky popis.";
    if (!form.priceOnRequest && form.price) {
      const n = Number(form.price);
      if (Number.isNaN(n) || n < 0) e.price = "Cena musí byť číslo ≥ 0.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      let storagePath = form.keepStoragePath;
      let url = form.keepUrl;
      if (form.file) {
        const path = `clothing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${form.file.name}`;
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(path, form.file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        // remove old file if replacing
        if (editingId && form.keepStoragePath) {
          await supabase.storage.from("gallery").remove([form.keepStoragePath]);
        }
        storagePath = path;
        url = await signUrl(path);
      }

      const payload = {
        storage_path: storagePath,
        url: url!,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: form.priceOnRequest || !form.price ? null : Number(form.price),
        currency: form.currency || "EUR",
        price_on_request: form.priceOnRequest,
        size: form.size.trim(),
        color: form.color.trim(),
        material: form.material.trim(),
        quantity: Number(form.quantity) || 0,
        availability: availabilityFromQuantity(Number(form.quantity) || 0),
        internal_note: form.internalNote.trim(),
        sort_order: Number(form.sortOrder) || 0,
        is_active: form.isActive,
        featured_on_homepage: form.featuredOnHomepage,
      };

      if (editingId) {
        const { error } = await supabase.from("clothing_images").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Zmeny uložené");
      } else {
        const { error } = await supabase.from("clothing_images").insert(payload);
        if (error) throw error;
        toast.success("Položka pridaná");
      }
      onSaved();
    } catch (ex) {
      toast.error((ex as Error).message || "Uloženie zlyhalo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#383B3A]/70 backdrop-blur-sm p-4 md:p-8 flex items-start md:items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F1EC] rounded-2xl w-full max-w-3xl my-8 border border-[#D9D2CC] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-5 border-b border-[#D9D2CC]">
          <h2 className="font-display text-2xl text-[#383B3A]">
            {editingId ? "Upraviť položku" : "Pridať položku"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#EBE6E2]" aria-label="Zavrieť">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Image column */}
          <div>
            <Label required>Fotografia</Label>
            <div className="mt-2 rounded-xl border border-dashed border-[#D9D2CC] bg-white/50 aspect-[3/4] overflow-hidden grid place-items-center">
              {form.previewUrl ? (
                <img src={form.previewUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-[#726D6A] text-sm">Náhľad fotografie</div>
              )}
            </div>
            <label className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm cursor-pointer hover:bg-white">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              {form.file ? "Zmeniť fotografiu" : editingId ? "Nahradiť fotografiu" : "Vybrať fotografiu"}
            </label>
            {errors.file && <Err msg={errors.file} />}
          </div>

          {/* Fields column */}
          <div className="space-y-4">
            <Field label="Názov položky" required error={errors.title}>
              <input
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>

            <Field label="Kategória" required error={errors.category}>
              <select
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CLOTHING_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Krátky popis" required error={errors.description}>
              <textarea
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2 min-h-[80px]"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-2">
                <Field label="Cena" error={errors.price}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.priceOnRequest}
                    className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2 disabled:opacity-50"
                    value={form.priceOnRequest ? "" : form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder={form.priceOnRequest ? "Na vyžiadanie" : ""}
                  />
                </Field>
              </div>
              <Field label="Mena">
                <select
                  disabled={form.priceOnRequest}
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2 disabled:opacity-50"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.priceOnRequest}
                onChange={(e) => set("priceOnRequest", e.target.checked)}
              />
              Cena na vyžiadanie
            </label>

            <Field label="Veľkosť">
              <div className="flex flex-wrap gap-1 mb-2">
                {SIZE_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("size", s)}
                    className={`rounded-full px-3 py-1 text-xs border ${form.size === s ? "bg-[#383B3A] text-[#F5F1EC] border-[#383B3A]" : "border-[#D9D2CC] hover:bg-[#EBE6E2]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="napr. S/M alebo univerzálna"
              />
            </Field>

            <Field label="Farba">
              <input
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="napr. čierna, zlatá"
              />
            </Field>

            <Field label="Materiál">
              <select
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
              >
                <option value="">— nezadané —</option>
                {MATERIAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Počet kusov">
              <input
                type="number"
                min="0"
                step="1"
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
              <div className="mt-1 text-xs text-[#726D6A]">
                Dostupnosť: {AVAILABILITY_LABEL[availabilityFromQuantity(Number(form.quantity) || 0)]}
              </div>
            </Field>

            <Field label="Interná poznámka (nezobrazuje sa verejne)">
              <textarea
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2 min-h-[60px]"
                value={form.internalNote}
                onChange={(e) => set("internalNote", e.target.value)}
              />
            </Field>

            <Field label="Poradie">
              <input
                type="number"
                className="w-full rounded-lg border border-[#D9D2CC] bg-white/70 px-3 py-2"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
            </Field>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Aktívna (viditeľná)
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featuredOnHomepage}
                  onChange={(e) => set("featuredOnHomepage", e.target.checked)}
                />
                Zobraziť na hlavnej stránke
              </label>
            </div>
          </div>
        </div>

        <footer className="p-5 border-t border-[#D9D2CC] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-[#D9D2CC] px-5 py-2.5 text-sm hover:bg-[#EBE6E2] disabled:opacity-50"
          >
            Zrušiť
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {submitting ? "Ukladám…" : editingId ? "Uložiť zmeny" : "Uložiť položku"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs uppercase tracking-[0.2em] text-[#726D6A]">
      {children}
      {required && <span className="text-red-700 ml-1">*</span>}
    </label>
  );
}
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <Err msg={error} />}
    </div>
  );
}
function Err({ msg }: { msg: string }) {
  return <div className="mt-1 text-xs text-red-700">{msg}</div>;
}
