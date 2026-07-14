import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, Search, FileText, Trash2 } from "lucide-react";
import {
  listAllGeneratedContracts,
  getGeneratedContractBase64,
  deleteGeneratedContract,
} from "@/lib/contracts.functions";
import { contractKindLabel } from "@/lib/hostess-data";

export const Route = createFileRoute("/admin/generated-contracts")({
  head: () => ({
    meta: [
      { title: "Vygenerované zmluvy — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GeneratedContractsPage,
});

type Row = {
  id: string;
  hostess_id: string;
  contract_type: string;
  version: number;
  created_at: string;
  generated_by_email: string | null;
  docx_path: string | null;
  hostess: { first_name: string | null; last_name: string | null; email: string | null } | null;
};

function GeneratedContractsPage() {
  const list = useServerFn(listAllGeneratedContracts);
  const getB64 = useServerFn(getGeneratedContractBase64);
  const remove = useServerFn(deleteGeneratedContract);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      setRows((await list()) as Row[]);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter && r.contract_type !== kindFilter) return false;
      if (!needle) return true;
      const name = `${r.hostess?.first_name ?? ""} ${r.hostess?.last_name ?? ""}`.toLowerCase();
      return (
        name.includes(needle) ||
        (r.hostess?.email ?? "").toLowerCase().includes(needle) ||
        contractKindLabel(r.contract_type).toLowerCase().includes(needle)
      );
    });
  }, [rows, q, kindFilter]);

  const grouped = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of filtered) {
      const k = r.contract_type || "ostatne";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) =>
      contractKindLabel(a[0]).localeCompare(contractKindLabel(b[0]), "sk"),
    );
  }, [filtered]);

  const kinds = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.contract_type))).sort();
  }, [rows]);

  async function download(id: string) {
    try {
      const r = (await getB64({ data: { id } })) as any;
      downloadBase64(
        r.base64,
        r.filename,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    } catch (e: any) {
      toast.error(e?.message || "Stiahnutie zlyhalo.");
    }
  }

  async function del(id: string) {
    if (!confirm("Naozaj zmazať túto zmluvu?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Zmazané.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium text-[#383B3A]">Vygenerované zmluvy</h1>
          <p className="text-sm text-[#726D6A] mt-1">
            Globálny prehľad všetkých vygenerovaných zmlúv naprieč hosteskami.
          </p>
        </div>
        <div className="text-xs text-[#726D6A]">
          Spolu: <span className="font-medium text-[#383B3A]">{rows.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 my-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A9A3]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hľadať podľa mena, e-mailu, typu…"
            className="w-full pl-9 pr-3 py-2 rounded-full border border-[#D9D2CC] bg-white text-sm"
          />
        </div>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="rounded-full border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
        >
          <option value="">Všetky typy</option>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {contractKindLabel(k)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-[#726D6A]">Načítavam…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-8 text-center text-sm text-[#726D6A]">
          <FileText className="h-6 w-6 mx-auto mb-2 opacity-60" />
          Zatiaľ neboli vygenerované žiadne zmluvy.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([kind, items]) => (
            <div
              key={kind}
              className="rounded-xl border border-[#D9D2CC] bg-white overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 bg-[#F5F1EC] border-b border-[#D9D2CC]">
                <div className="text-sm font-medium text-[#383B3A]">
                  {contractKindLabel(kind)}
                </div>
                <div className="text-xs text-[#726D6A]">{items.length}</div>
              </div>
              <ul className="divide-y divide-[#F0EAE4]">
                {items.map((r) => {
                  const name = `${r.hostess?.first_name ?? ""} ${r.hostess?.last_name ?? ""}`.trim() || "—";
                  return (
                    <li key={r.id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <Link
                          to="/admin/hostesses/$id"
                          params={{ id: r.hostess_id }}
                          className="text-sm font-medium text-[#383B3A] hover:underline"
                        >
                          {name}
                        </Link>
                        <div className="text-xs text-[#726D6A]">
                          {r.hostess?.email || "—"}
                        </div>
                      </div>
                      <div className="text-xs text-[#726D6A] w-24">v{r.version}</div>
                      <div className="text-xs text-[#726D6A] w-32">
                        {new Date(r.created_at).toLocaleDateString("sk-SK")}
                      </div>
                      <div className="text-xs text-[#726D6A] hidden md:block flex-1 min-w-[140px] truncate">
                        {r.generated_by_email || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => download(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs hover:bg-[#F5F1EC]"
                        >
                          <Download className="h-3.5 w-3.5" /> DOCX
                        </button>
                        <button
                          onClick={() => del(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-300 text-red-700 px-3 py-1.5 text-xs hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function downloadBase64(base64: string, filename: string, mime: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
