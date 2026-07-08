import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Trash2, Mail } from "lucide-react";

type Row = Database["public"]["Tables"]["contact_messages"]["Row"];

export const Route = createFileRoute("/admin/messages")({
  component: MessagesAdmin,
});

const STATUSES = ["new", "read", "archived"] as const;

function MessagesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    setRows((p) => p.map((r) => r.id === id ? { ...r, status } : r));
    await supabase.from("contact_messages").update({ status }).eq("id", id);
  };
  const del = async (id: string) => {
    if (!confirm("Vymazať správu?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <section>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Kontakt</div>
        <h1 className="font-display text-4xl">Prijaté správy</h1>
      </header>
      <div className="mb-4 flex gap-2 text-sm">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 border ${filter === s ? "bg-[#383B3A] text-[#F5F1EC] border-[#383B3A]" : "border-[#D9D2CC]"}`}>
            {s === "all" ? "Všetky" : s === "new" ? "Nové" : s === "read" ? "Prečítané" : "Archív"}
          </button>
        ))}
      </div>
      {err && <div className="mb-4 rounded-lg bg-red-100 text-red-800 px-4 py-3 text-sm">{err}</div>}
      {loading ? <div>Načítavam…</div> : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9D2CC] p-12 text-center text-[#726D6A]">
          Žiadne správy.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div key={row.id} className={`rounded-2xl bg-[#F5F1EC] border p-5 ${row.status === "new" ? "border-[#383B3A]/40" : "border-[#D9D2CC]"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{row.name} <span className="text-[#726D6A] text-sm">· {new Date(row.created_at).toLocaleString("sk-SK")}</span></div>
                  <div className="text-sm text-[#726D6A] flex gap-3 mt-1">
                    <a href={`mailto:${row.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="h-3 w-3" />{row.email}</a>
                    {row.phone && <span>{row.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={row.status} onChange={(e) => setStatus(row.id, e.target.value)}
                    className="rounded-lg border border-[#D9D2CC] bg-white/60 px-3 py-1.5 text-sm">
                    {STATUSES.map((s) => <option key={s} value={s}>{s === "new" ? "Nová" : s === "read" ? "Prečítaná" : "Archív"}</option>)}
                  </select>
                  <button onClick={() => del(row.id)} className="text-red-700"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm text-[#383B3A]">{row.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
