import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, Trash2 } from "lucide-react";
import { getHostess, updateHostess, deleteHostess } from "@/lib/hostess.functions";
import { ContractsSection } from "@/components/admin/ContractsSection";
import {
  HOSTESS_STATUSES,
  CONTRACT_TYPES,
  photoLabel,
  type HostessStatus,
  type ContractType,
} from "@/lib/hostess-data";

export const Route = createFileRoute("/admin/hostesses/$id")({
  head: () => ({ meta: [{ title: "Hosteska — Admin" }, { name: "robots", content: "noindex" }] }),
  component: HostessDetail,
});

function HostessDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const get = useServerFn(getHostess);
  const upd = useServerFn(updateHostess);
  const del = useServerFn(deleteHostess);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await get({ data: { id } });
      setData(r);
      setForm({ ...r.profile });
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  async function save() {
    setSaving(true);
    try {
      const { id: _, application_code: __, created_at: ___, updated_at: ____, invite_id: _____, ...patch } = form;
      await upd({ data: { id, patch } });
      toast.success("Uložené");
      await refresh();
    } catch (e: any) { toast.error(e?.message); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!confirm("Naozaj zmazať tento profil a všetky fotografie?")) return;
    try {
      await del({ data: { id } });
      toast.success("Zmazané");
      navigate({ to: "/admin/hostesses" });
    } catch (e: any) { toast.error(e?.message); }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${data.profile.application_code}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !data) return <div className="text-[#726D6A]">Načítavam…</div>;
  const p = data.profile;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/admin/hostesses" className="inline-flex items-center gap-1 text-sm text-[#726D6A] hover:text-[#383B3A] mb-2">
            <ArrowLeft className="h-4 w-4" /> Späť
          </Link>
          <h1 className="text-2xl font-medium text-[#383B3A]">{p.first_name} {p.last_name}</h1>
          <div className="text-xs text-[#726D6A] font-mono">{p.application_code}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-full border border-[#D9D2CC] px-4 py-2 text-sm">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={remove} className="inline-flex items-center gap-2 rounded-full border border-red-300 text-red-700 px-4 py-2 text-sm">
            <Trash2 className="h-4 w-4" /> Zmazať
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Photos */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-[#726D6A]">Fotografie</h2>
          {data.photos.length === 0 && <div className="text-sm text-[#726D6A]">Žiadne fotografie.</div>}
          {data.photos.map((ph: any) => (
            <div key={ph.id} className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] overflow-hidden">
              {ph.signed_url ? (
                <img src={ph.signed_url} alt={ph.original_filename} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] grid place-items-center text-[#726D6A] text-sm">Náhľad nedostupný</div>
              )}
              <div className="p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-[#383B3A]">{photoLabel(ph.photo_type)}</div>
                  <div className="text-[#726D6A] truncate max-w-[160px]">{ph.original_filename}</div>
                </div>
                {ph.signed_url && (
                  <a href={ph.signed_url} download={ph.original_filename} className="rounded-full border border-[#D9D2CC] px-3 py-1">
                    Stiahnuť
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
            <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">Stav</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Sel label="Stav" value={form.status} options={HOSTESS_STATUSES} onChange={(v) => setForm({ ...form, status: v as HostessStatus })} />
              <Txt label="Interná poznámka" full value={form.internal_note || ""} onChange={(v) => setForm({ ...form, internal_note: v })} textarea />
            </div>
          </div>

          <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
            <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">Zmluva</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Sel label="Typ zmluvy" value={form.contract_type} options={CONTRACT_TYPES} onChange={(v) => setForm({ ...form, contract_type: v as ContractType })} />
            </div>
            <p className="mt-3 text-xs text-[#726D6A]">Zvolený typ zmluvy sa použije pri generovaní zmluvného dokumentu.</p>
          </div>

          <ContractsSection hostessId={id} />

          <Fieldset title="Osobné údaje" form={form} setForm={setForm} fields={[
            ["first_name","Meno"],["last_name","Priezvisko"],
            ["birth_date","Dátum narodenia","date"],["birth_place","Miesto narodenia"],
            ["phone","Telefón"],
            ["email","Email"],["nationality","Štátna príslušnosť"],
            ["marital_status","Rodinný stav"],
            ["address","Adresa",undefined,true],
            ["city","Mesto"],["postal_code","PSČ"],
            ["national_id","Rodné číslo"],["identity_card_number","Číslo OP"],
            ["iban","IBAN",undefined,true],
            ["health_insurance","Zdravotná poisťovňa"],
            ["pension_type","Poberateľ dôchodku / druh dôchodku"],
            ["health_restrictions","Zdravotné obmedzenia / ZŤP",undefined,true,true],
          ]} />
          <Fieldset title="Pracovné informácie" form={form} setForm={setForm} fields={[
            ["height","Výška"],["clothing_size","Konfekčná veľkosť"],
            ["shoe_size","Veľkosť obuvi"],["hair_color","Farba vlasov"],
            ["languages","Jazyky",undefined,true],
            ["experience","Skúsenosti",undefined,true,true],
            ["availability","Dostupnosť",undefined,true,true],
            ["note","Poznámka",undefined,true,true],
          ]} />

          <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
            <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-3">Súhlasy</h2>
            <ul className="text-sm space-y-1">
              {data.consents.map((c: any) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className={c.accepted ? "text-emerald-700" : "text-red-600"}>{c.accepted ? "✓" : "✗"}</span>
                  <span className="text-[#383B3A]">{c.consent_type}</span>
                  <span className="text-xs text-[#726D6A]">{c.accepted_at ? new Date(c.accepted_at).toLocaleString("sk-SK") : ""}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-6 py-2.5 text-sm disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Ukladám…" : "Uložiť zmeny"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
function Txt({ label, value, onChange, full, textarea, type }: { label: string; value: string; onChange: (v: string) => void; full?: boolean; textarea?: boolean; type?: string }) {
  const cls = "w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm";
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      {textarea
        ? <textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} className={cls} />
        : <input type={type || "text"} value={value || ""} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </label>
  );
}
function Fieldset({ title, form, setForm, fields }: {
  title: string; form: any; setForm: (v: any) => void;
  fields: [string, string, string?, boolean?, boolean?][];
}) {
  return (
    <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
      <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(([k, l, type, full, textarea]) => (
          <Txt key={k} label={l} value={form[k] || ""} onChange={(v) => setForm({ ...form, [k]: v })} type={type} full={full} textarea={textarea} />
        ))}
      </div>
    </div>
  );
}
