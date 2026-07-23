import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Plus, Upload, ImageOff } from "lucide-react";

type Row = Database["public"]["Tables"]["services"]["Row"];

const ICONS = ["Sparkles", "Megaphone", "HardHat", "Clapperboard", "Shirt", "Users2"];
const SIGN_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

export const Route = createFileRoute("/admin/services")({
  component: ServicesAdmin,
});

function ServicesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("services").select("*").order("sort_order");
    if (error) setErr(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) setErr(error.message);
  };

  const add = async () => {
    const slug = `sluzba-${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.from("services").insert({
      title: "Nová služba", description: "", icon: "Sparkles",
      slug, detail_content: "",
      sort_order: rows.length + 1, is_active: true,
    });
    if (error) setErr(error.message);
    else load();
  };

  const del = async (id: string) => {
    if (!confirm("Vymazať službu?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) setErr(error.message);
    else setRows((p) => p.filter((r) => r.id !== id));
  };

  const uploadImage = async (row: Row, file: File) => {
    setErr(null);
    try {
      const path = `services/${row.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600", upsert: false,
      });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("site-images").createSignedUrl(path, SIGN_TTL);
      if (signErr) throw signErr;
      await update(row.id, { image_url: signed.signedUrl });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const removeImage = async (row: Row) => {
    if (!confirm("Odstrániť fotografiu?")) return;
    await update(row.id, { image_url: null });
  };

  return (
    <section>
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Služby</div>
          <h1 className="font-display text-4xl">Ponuka služieb</h1>
        </div>
        <button onClick={add} className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-3 text-sm">
          <Plus className="h-4 w-4" /> Pridať službu
        </button>
      </header>

      {err && <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm">{err}</div>}

      {loading ? <div>Načítavam…</div> : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-5 space-y-3">
              <div className="grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-start">
                <input
                  className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 font-medium"
                  placeholder="Názov"
                  value={row.title}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, title: e.target.value } : r))}
                  onBlur={(e) => update(row.id, { title: e.target.value })}
                />
                <textarea
                  rows={2}
                  className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
                  placeholder="Krátky popis (karta na úvode)"
                  value={row.description}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, description: e.target.value } : r))}
                  onBlur={(e) => update(row.id, { description: e.target.value })}
                />
                <select
                  className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
                  value={row.icon}
                  onChange={(e) => update(row.id, { icon: e.target.value })}
                >
                  {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <input
                  type="number" title="Poradie"
                  className="w-20 rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
                  value={row.sort_order}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, sort_order: Number(e.target.value) } : r))}
                  onBlur={(e) => update(row.id, { sort_order: Number(e.target.value) })}
                />
                <div className="flex flex-col gap-2 text-sm">
                  <label className="inline-flex items-center gap-1.5">
                    <input type="checkbox" checked={row.is_active} onChange={(e) => update(row.id, { is_active: e.target.checked })} />
                    Aktívna
                  </label>
                  <button onClick={() => del(row.id)} className="text-red-700 hover:underline inline-flex items-center gap-1">
                    <Trash2 className="h-4 w-4" /> Vymazať
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-[240px_1fr] gap-3 items-start">
                <label className="text-xs uppercase tracking-widest text-[#726D6A] pt-2">URL (slug)</label>
                <input
                  className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm font-mono"
                  placeholder="napr. hostessing"
                  value={row.slug}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, slug: e.target.value } : r))}
                  onBlur={(e) => update(row.id, { slug: e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") })}
                />
                <label className="text-xs uppercase tracking-widest text-[#726D6A] pt-2">Text podstránky</label>
                <textarea
                  rows={8}
                  className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm leading-relaxed"
                  placeholder="Podrobný popis služby, ktorý sa zobrazí na podstránke /sluzby/<slug>."
                  value={row.detail_content ?? ""}
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, detail_content: e.target.value } : r))}
                  onBlur={(e) => update(row.id, { detail_content: e.target.value })}
                />
                <div />
                <a
                  href={row.slug === "prenajom-oblecenia" ? "/prenajom-oblecenia" : `/sluzby/${row.slug}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-[#383B3A] underline w-fit"
                >
                  Otvoriť podstránku ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
