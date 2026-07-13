import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { submitHostessApplication } from "@/lib/hostess.functions";
import {
  CONTRACT_TYPES,
  CONSENTS,
  PHOTO_TYPES,
  ACCEPT_EXT,
  ACCEPT_MIME,
  MAX_PHOTO_BYTES,
  type ContractType,
  type PhotoType,
  type ConsentType,
} from "@/lib/hostess-data";

export const Route = createFileRoute("/hostess-form")({
  head: () => ({
    meta: [
      { title: "Registračný formulár — NU-U" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
  }),
  component: HostessFormPage,
});

type PhotoState = { file: File; previewUrl: string; type: PhotoType };

const DRAFT_KEY = "hostess-draft";
const RECENT_SUBMIT_KEY = "hostess-recent-submit";

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      res(s.split(",")[1] || "");
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  birth_date: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  national_id: "",
  identity_card_number: "",
  iban: "",
  nationality: "",
  height: "",
  clothing_size: "",
  shoe_size: "",
  hair_color: "",
  languages: "",
  experience: "",
  availability: "",
  note: "",
  contract_type: "bez_zmluvy" as ContractType,
};
const EMPTY_CONSENTS: Record<ConsentType, boolean> = {
  osobne_udaje: false,
  pravdivost: false,
  fotografie: false,
  elektronicke_dokumenty: false,
};

function HostessFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<Record<string, PhotoState[]>>({
    portret: [],
    cela_postava: [],
    profil: [],
    dalsia: [],
  });
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>(EMPTY_CONSENTS);
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const submit = useServerFn(submitHostessApplication);

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.form) setForm((f) => ({ ...f, ...parsed.form }));
        if (parsed.consents) setConsents((c) => ({ ...c, ...parsed.consents }));
      }
    } catch {}
  }, []);
  // Save draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, consents }));
    } catch {}
  }, [form, consents]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addPhotos(type: PhotoType, list: FileList | null) {
    if (!list) return;
    const additions: PhotoState[] = [];
    for (const file of Array.from(list)) {
      if (!ACCEPT_MIME.includes(file.type) && !/\.(heic|heif|jpe?g|png)$/i.test(file.name)) {
        toast.error(`${file.name}: nepodporovaný formát`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`${file.name}: súbor je väčší ako 12MB`);
        continue;
      }
      additions.push({
        file,
        previewUrl: URL.createObjectURL(file),
        type,
      });
    }
    setPhotos((p) => ({
      ...p,
      [type]: type === "dalsia" ? [...p[type], ...additions] : additions.slice(0, 1),
    }));
  }

  function removePhoto(type: PhotoType, idx: number) {
    setPhotos((p) => {
      const arr = [...p[type]];
      const [rm] = arr.splice(idx, 1);
      if (rm) URL.revokeObjectURL(rm.previewUrl);
      return { ...p, [type]: arr };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // accidental duplicate protection (same browser session, within 30s)
    try {
      const last = sessionStorage.getItem(RECENT_SUBMIT_KEY);
      if (last && Date.now() - Number(last) < 30_000) {
        toast.error("Prihláška bola práve odoslaná. Skúste to prosím o chvíľu.");
        return;
      }
    } catch {}

    // required checks
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Vyplňte meno a priezvisko.");
      return;
    }
    for (const p of PHOTO_TYPES) {
      if (p.required && photos[p.value].length === 0) {
        toast.error(`Nahrajte fotografiu: ${p.label}`);
        return;
      }
    }
    for (const c of CONSENTS) {
      if (!consents[c.value]) {
        toast.error("Musíte potvrdiť všetky súhlasy.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const allPhotos: PhotoState[] = [];
      for (const t of Object.keys(photos) as PhotoType[]) allPhotos.push(...photos[t]);
      const encoded = await Promise.all(
        allPhotos.map(async (p) => ({
          type: p.type,
          base64: await fileToBase64(p.file),
          filename: p.file.name,
          mime: p.file.type || "application/octet-stream",
          size: p.file.size,
        })),
      );
      const result = await submit({
        data: {
          profile: form,
          photos: encoded,
          consents: CONSENTS.map((c) => ({ type: c.value, accepted: consents[c.value] })),
        },
      });
      setSuccessCode(result.applicationCode);
      try {
        sessionStorage.setItem(RECENT_SUBMIT_KEY, String(Date.now()));
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      // Clear the form
      setForm(EMPTY_FORM);
      setConsents(EMPTY_CONSENTS);
      // revoke previews
      for (const t of Object.keys(photos) as PhotoType[]) {
        for (const p of photos[t]) URL.revokeObjectURL(p.previewUrl);
      }
      setPhotos({ portret: [], cela_postava: [], profil: [], dalsia: [] });
    } catch (err: any) {
      toast.error(err?.message || "Odoslanie zlyhalo. Skúste znova.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successCode) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#EBE6E2] px-6 py-12">
        <div className="max-w-md w-full bg-[#F5F1EC] border border-[#D9D2CC] rounded-2xl p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-4" strokeWidth={1.5} />
          <h1 className="text-2xl font-medium text-[#383B3A] mb-2">Ďakujeme!</h1>
          <p className="text-sm text-[#726D6A] mb-4">
            Vaša prihláška bola úspešne odoslaná. Ozveme sa vám čo najskôr.
          </p>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Číslo prihlášky</div>
          <div className="mt-1 font-mono text-lg text-[#383B3A]">{successCode}</div>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => setSuccessCode(null)}
              className="inline-flex justify-center rounded-full border border-[#D9D2CC] px-6 py-2.5 text-sm"
            >
              Vyplniť ďalšiu prihlášku
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex justify-center rounded-full bg-[#383B3A] text-[#F5F1EC] px-6 py-2.5 text-sm"
            >
              Späť na domovskú stránku
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBE6E2] text-[#383B3A] py-6 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">NU-U agentúra</div>
          <h1 className="text-2xl md:text-3xl font-medium mt-2">Registračný formulár hostesky</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Osobné údaje">
            <Grid>
              <Field label="Meno *"><Input value={form.first_name} onChange={(v) => set("first_name", v)} required /></Field>
              <Field label="Priezvisko *"><Input value={form.last_name} onChange={(v) => set("last_name", v)} required /></Field>
              <Field label="Dátum narodenia"><Input type="date" value={form.birth_date} onChange={(v) => set("birth_date", v)} /></Field>
              <Field label="Telefón"><Input type="tel" value={form.phone} onChange={(v) => set("phone", v)} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(v) => set("email", v)} /></Field>
              <Field label="Štátna príslušnosť"><Input value={form.nationality} onChange={(v) => set("nationality", v)} /></Field>
              <Field label="Adresa" full><Input value={form.address} onChange={(v) => set("address", v)} /></Field>
              <Field label="Mesto"><Input value={form.city} onChange={(v) => set("city", v)} /></Field>
              <Field label="PSČ"><Input value={form.postal_code} onChange={(v) => set("postal_code", v)} /></Field>
              <Field label="Rodné číslo"><Input value={form.national_id} onChange={(v) => set("national_id", v)} /></Field>
              <Field label="Číslo OP"><Input value={form.identity_card_number} onChange={(v) => set("identity_card_number", v)} /></Field>
              <Field label="IBAN" full><Input value={form.iban} onChange={(v) => set("iban", v)} /></Field>
            </Grid>
          </Section>

          <Section title="Pracovné informácie">
            <Grid>
              <Field label="Výška"><Input value={form.height} onChange={(v) => set("height", v)} placeholder="cm" /></Field>
              <Field label="Konfekčná veľkosť"><Input value={form.clothing_size} onChange={(v) => set("clothing_size", v)} /></Field>
              <Field label="Veľkosť obuvi"><Input value={form.shoe_size} onChange={(v) => set("shoe_size", v)} /></Field>
              <Field label="Farba vlasov"><Input value={form.hair_color} onChange={(v) => set("hair_color", v)} /></Field>
              <Field label="Jazyky" full><Input value={form.languages} onChange={(v) => set("languages", v)} placeholder="SK, EN, DE…" /></Field>
              <Field label="Skúsenosti" full><Textarea value={form.experience} onChange={(v) => set("experience", v)} /></Field>
              <Field label="Dostupnosť" full><Textarea value={form.availability} onChange={(v) => set("availability", v)} placeholder="Kedy máte čas, víkendy…" /></Field>
              <Field label="Poznámka" full><Textarea value={form.note} onChange={(v) => set("note", v)} /></Field>
            </Grid>
          </Section>

          <Section title="Fotografie">
            <p className="text-xs text-[#726D6A] -mt-2 mb-4">
              Nahrajte originálne fotografie bez úprav a filtrov. JPG, PNG alebo HEIC. Max 12 MB na fotku.
            </p>
            <div className="space-y-4">
              {PHOTO_TYPES.map((pt) => (
                <div key={pt.value} className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">
                      {pt.label} {pt.required && <span className="text-red-600">*</span>}
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs cursor-pointer hover:bg-[#EBE6E2]">
                      <Upload className="h-3.5 w-3.5" />
                      Nahrať
                      <input
                        type="file"
                        accept={ACCEPT_EXT}
                        multiple={pt.value === "dalsia"}
                        className="hidden"
                        onChange={(e) => {
                          addPhotos(pt.value, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {photos[pt.value].length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {photos[pt.value].map((p, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#EBE6E2] border border-[#D9D2CC]">
                          {/\.(heic|heif)$/i.test(p.file.name) ? (
                            <div className="w-full h-full grid place-items-center text-[10px] text-[#726D6A] text-center px-1">
                              HEIC<br />bez náhľadu
                            </div>
                          ) : (
                            <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(pt.value, i)}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white grid place-items-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Typ zmluvy">
            <div className="space-y-2">
              {CONTRACT_TYPES.map((c) => (
                <label key={c.value} className="flex items-center gap-3 rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] px-4 py-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contract_type"
                    value={c.value}
                    checked={form.contract_type === c.value}
                    onChange={() => set("contract_type", c.value)}
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Súhlasy">
            <div className="space-y-3">
              {CONSENTS.map((c) => (
                <label key={c.value} className="flex items-start gap-3 text-sm text-[#383B3A]">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={consents[c.value]}
                    onChange={(e) => setConsents((cc) => ({ ...cc, [c.value]: e.target.checked }))}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 text-xs text-[#726D6A] space-y-1">
              <div><span className="underline">Ochrana osobných údajov</span> — zásady budú doplnené.</div>
              <div><span className="underline">Súhlas so spracovaním fotografií</span> — pravidlá budú doplnené.</div>
            </div>
          </Section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-6 py-4 text-base font-medium disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Odosielam…" : "Odoslať prihlášku"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      {children}
    </label>
  );
}
function Input(props: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type={props.type || "text"}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      required={props.required}
      className="w-full rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] px-3 py-2.5 text-sm text-[#383B3A] focus:outline-none focus:border-[#383B3A]"
    />
  );
}
function Textarea(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      rows={3}
      className="w-full rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] px-3 py-2.5 text-sm text-[#383B3A] focus:outline-none focus:border-[#383B3A]"
    />
  );
}
