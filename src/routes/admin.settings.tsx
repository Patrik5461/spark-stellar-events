import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { invalidateSiteSettings } from "@/lib/use-site-settings";
import { Save, KeyRound, Upload, Trash2 } from "lucide-react";

const SIGN_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

type Row = Database["public"]["Tables"]["site_settings"]["Row"];

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

const FIELDS: { key: keyof Row; label: string; group: string; textarea?: boolean }[] = [
  { key: "contact_person", label: "Kontaktná osoba", group: "Kontakt" },
  { key: "phone", label: "Telefón", group: "Kontakt" },
  { key: "email", label: "Email", group: "Kontakt" },
  { key: "address", label: "Adresa", group: "Kontakt" },
  { key: "instagram_url", label: "Instagram", group: "Sociálne siete" },
  { key: "linkedin_url", label: "LinkedIn", group: "Sociálne siete" },
  { key: "facebook_url", label: "Facebook", group: "Sociálne siete" },
  { key: "billing_name", label: "Názov spoločnosti", group: "Fakturačné údaje" },
  { key: "billing_address", label: "Fakturačná adresa", group: "Fakturačné údaje" },
  { key: "billing_ico", label: "IČO", group: "Fakturačné údaje" },
  { key: "billing_dic", label: "DIČ", group: "Fakturačné údaje" },
  { key: "billing_ic_dph", label: "IČ DPH", group: "Fakturačné údaje" },
  { key: "billing_iban", label: "IBAN", group: "Fakturačné údaje" },
  { key: "hero_headline", label: "Hero nadpis", group: "Texty webu", textarea: true },
  { key: "hero_subtitle", label: "Hero podnadpis", group: "Texty webu", textarea: true },
  { key: "cta_primary", label: "CTA tlačidlo (hlavné)", group: "Texty webu" },
  { key: "cta_secondary", label: "CTA tlačidlo (vedľajšie)", group: "Texty webu" },
  { key: "about_text", label: "O nás", group: "Texty webu", textarea: true },
  { key: "gallery_intro", label: "Úvod galérie", group: "Texty webu", textarea: true },
  { key: "contact_text", label: "Kontakt – text", group: "Texty webu", textarea: true },
  { key: "footer_text", label: "Footer text", group: "Texty webu", textarea: true },
];

function SettingsAdmin() {
  const [row, setRow] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState<"hero" | "about" | null>(null);
  const [imgErr, setImgErr] = useState<string | null>(null);

  const uploadImage = async (kind: "hero" | "about", file: File) => {
    if (!row) return;
    setImgBusy(kind);
    setImgErr(null);
    try {
      const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("site-images")
        .createSignedUrl(path, SIGN_TTL);
      if (signErr) throw signErr;
      const patch: Partial<Row> =
        kind === "hero"
          ? { hero_image_url: signed.signedUrl, hero_image_path: path }
          : { about_image_url: signed.signedUrl, about_image_path: path };
      // Delete previous file if any
      const prevPath = kind === "hero" ? row.hero_image_path : row.about_image_path;
      if (prevPath) {
        await supabase.storage.from("site-images").remove([prevPath]);
      }
      const { error: updErr } = await supabase.from("site_settings").update(patch).eq("id", 1);
      if (updErr) throw updErr;
      setRow({ ...row, ...patch });
    } catch (e) {
      setImgErr((e as Error).message);
    } finally {
      setImgBusy(null);
    }
  };

  const removeImage = async (kind: "hero" | "about") => {
    if (!row) return;
    if (!confirm("Odstrániť fotografiu?")) return;
    setImgBusy(kind);
    setImgErr(null);
    try {
      const prevPath = kind === "hero" ? row.hero_image_path : row.about_image_path;
      if (prevPath) await supabase.storage.from("site-images").remove([prevPath]);
      const patch: Partial<Row> =
        kind === "hero"
          ? { hero_image_url: null, hero_image_path: null }
          : { about_image_url: null, about_image_path: null };
      const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
      if (error) throw error;
      setRow({ ...row, ...patch });
    } catch (e) {
      setImgErr((e as Error).message);
    } finally {
      setImgBusy(null);
    }
  };

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then(({ data }: { data: Row | null }) => setRow(data));
  }, []);

  const save = async () => {
    if (!row) return;
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.from("site_settings").update(row).eq("id", 1);
    setBusy(false);
    setMsg(error ? error.message : "Uložené ✓");
  };

  const changePwd = async () => {
    if (pwd.length < 8) { setPwdMsg("Heslo musí mať aspoň 8 znakov."); return; }
    setPwdBusy(true);
    setPwdMsg(null);
    const { error } = await supabase.auth.updateUser({
      password: pwd,
      data: { must_change_password: false },
    });
    // Also update app_metadata flag isn't directly writable client-side; user_metadata flag suffices for the banner logic if needed.
    setPwdBusy(false);
    setPwd("");
    setPwdMsg(error ? error.message : "Heslo bolo úspešne zmenené ✓");
  };

  if (!row) return <div>Načítavam…</div>;

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <section>
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Nastavenia</div>
          <h1 className="font-display text-4xl">Obsah webu</h1>
        </div>
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-3 text-sm disabled:opacity-60">
          <Save className="h-4 w-4" /> {busy ? "Ukladám…" : "Uložiť zmeny"}
        </button>
      </header>

      {msg && <div className="mb-4 rounded-lg bg-emerald-100 text-emerald-800 px-4 py-3 text-sm">{msg}</div>}

      <div className="space-y-8">
        {groups.map((g) => (
          <div key={g} className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-6">
            <h2 className="font-display text-2xl mb-4">{g}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <label key={String(f.key)} className={f.textarea ? "block md:col-span-2" : "block"}>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#726D6A]">{f.label}</span>
                  {f.textarea ? (
                    <textarea
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
                      value={(row[f.key] as string) ?? ""}
                      onChange={(e) => setRow({ ...row, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="mt-2 w-full rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
                      value={(row[f.key] as string) ?? ""}
                      onChange={(e) => setRow({ ...row, [f.key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-6">
          <h2 className="font-display text-2xl mb-4">Fotografie webu</h2>
          {imgErr && <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm">{imgErr}</div>}
          <div className="grid md:grid-cols-2 gap-6">
            {([
              { kind: "hero" as const, label: "Titulná fotografia (Hero)", url: row.hero_image_url },
              { kind: "about" as const, label: "Fotografia v sekcii O nás", url: row.about_image_url },
            ]).map(({ kind, label, url }) => (
              <div key={kind} className="space-y-3">
                <div className="text-xs uppercase tracking-[0.2em] text-[#726D6A]">{label}</div>
                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#D9D2CC] bg-white/60 flex items-center justify-center">
                  {url ? (
                    <img src={url} alt={label} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm text-[#726D6A]">Používa sa predvolená fotka</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm cursor-pointer hover:opacity-90">
                    <Upload className="h-4 w-4" />
                    {imgBusy === kind ? "Nahrávam…" : url ? "Zmeniť fotku" : "Nahrať fotku"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={imgBusy === kind}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(kind, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {url && (
                    <button
                      onClick={() => removeImage(kind)}
                      disabled={imgBusy === kind}
                      className="inline-flex items-center gap-1 rounded-full border border-[#D9D2CC] px-4 py-2 text-sm text-red-700 hover:bg-white/60"
                    >
                      <Trash2 className="h-4 w-4" /> Odstrániť
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-6">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2"><KeyRound className="h-5 w-5" /> Zmena hesla</h2>
          <div className="flex flex-col md:flex-row gap-3 max-w-xl">
            <input
              type="password"
              placeholder="Nové heslo (min. 8 znakov)"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="flex-1 rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2"
            />
            <button onClick={changePwd} disabled={pwdBusy} className="rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm disabled:opacity-60">
              {pwdBusy ? "Ukladám…" : "Zmeniť heslo"}
            </button>
          </div>
          {pwdMsg && <div className="mt-3 text-sm">{pwdMsg}</div>}
        </div>
      </div>
    </section>
  );
}
