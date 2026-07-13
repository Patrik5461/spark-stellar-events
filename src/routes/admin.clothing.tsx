import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Upload, Plus } from "lucide-react";
import { CLOTHING_CATEGORIES } from "@/lib/clothing-data";

type Row = Database["public"]["Tables"]["clothing_images"]["Row"];

const SIGN_TTL = 60 * 60 * 24 * 365 * 5; // 5 years

export const Route = createFileRoute("/admin/clothing")({
  component: ClothingAdmin,
});

async function signUrl(path: string) {
  const { data, error } = await supabase.storage.from("gallery").createSignedUrl(path, SIGN_TTL);
  if (error) throw error;
  return data.signedUrl;
}

function ClothingAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("mix");
  const [err, setErr] = useState<string | null>(null);

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

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setErr(null);
    try {
      for (const file of Array.from(files)) {
        const path = `clothing/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const url = await signUrl(path);
        const { error: insErr } = await supabase.from("clothing_images").insert({
          storage_path: path,
          url,
          title: "",
          description: "",
          category: uploadCategory,
          sort_order: rows.length + 1,
          is_active: true,
        });
        if (insErr) throw insErr;
      }
      await load();
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateRow = async (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("clothing_images").update(patch).eq("id", id);
    if (error) setErr(error.message);
  };

  const deleteRow = async (row: Row) => {
    if (!confirm(`Vymazať "${row.title || row.id}"?`)) return;
    if (row.storage_path) {
      await supabase.storage.from("gallery").remove([row.storage_path]);
    }
    const { error } = await supabase.from("clothing_images").delete().eq("id", row.id);
    if (error) setErr(error.message);
    else setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Prenájom oblečenia</div>
          <h1 className="font-display text-4xl text-[#383B3A]">Fotografie oblečenia</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-[#726D6A]">Kategória pri nahrávaní:</label>
          <select
            className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 text-sm"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {CLOTHING_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-3 text-sm cursor-pointer hover:opacity-90">
            {uploading ? <Upload className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
            {uploading ? "Nahrávam…" : "Nahrať fotky"}
            <input type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </header>

      <div className="mb-6 rounded-xl bg-[#F5F1EC] border border-[#D9D2CC] px-4 py-3 text-sm text-[#726D6A]">
        Každá fotografia musí mať priradenú kategóriu. Kategóriu môžete kedykoľvek zmeniť.
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm">{err}</div>}

      {loading ? (
        <div className="text-[#726D6A]">Načítavam…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9D2CC] p-12 text-center text-[#726D6A]">
          Zatiaľ tu nie sú žiadne fotografie. Nahrajte prvú vyššie.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-4 flex gap-4">
              <img
                src={row.url}
                alt={row.title}
                className="w-40 h-40 object-cover rounded-xl border border-[#D9D2CC] shrink-0"
              />
              <div className="flex-1 space-y-2 text-sm">
                <input
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2"
                  value={row.title}
                  placeholder="Názov (voliteľné)"
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, title: e.target.value } : r))}
                  onBlur={(e) => updateRow(row.id, { title: e.target.value })}
                />
                <textarea
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2 min-h-[60px]"
                  value={row.description}
                  placeholder="Popis (voliteľné)"
                  onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, description: e.target.value } : r))}
                  onBlur={(e) => updateRow(row.id, { description: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2"
                    value={row.category}
                    onChange={(e) => updateRow(row.id, { category: e.target.value })}
                  >
                    {CLOTHING_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="w-24 rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-2"
                    value={row.sort_order}
                    onChange={(e) => setRows((p) => p.map((r) => r.id === row.id ? { ...r, sort_order: Number(e.target.value) } : r))}
                    onBlur={(e) => updateRow(row.id, { sort_order: Number(e.target.value) })}
                    title="Poradie v kategórii"
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      onChange={(e) => updateRow(row.id, { is_active: e.target.checked })}
                    />
                    {row.is_active ? "Aktívna" : "Skrytá"}
                  </label>
                  <button
                    onClick={() => deleteRow(row)}
                    className="ml-auto inline-flex items-center gap-1 text-red-700 hover:underline"
                  >
                    <Trash2 className="h-4 w-4" /> Vymazať
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
