import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileSpreadsheet, CheckCircle2, Filter } from "lucide-react";
import {
  listFinanceRows,
  exportFinance,
  bulkMarkPaid,
  type FinanceFilters,
} from "@/lib/finance.functions";
import { listEventClients } from "@/lib/events.functions";
import { WORKER_TYPES, WORKER_TYPE_LABEL } from "@/lib/event-constants";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({
    meta: [
      { title: "Financie — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FinancePage,
});

type Row = {
  assignment_id: string;
  event_id: string;
  event_name: string;
  event_date_from: string | null;
  hostess_first_name: string;
  hostess_last_name: string;
  worked_hours: number | null;
  amount_calculated: number | null;
  amount_final: number | null;
  paid: boolean;
  paid_at: string | null;
  payment_note: string | null;
};

function saveBlob(base64: string, mime: string, name: string) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function FinancePage() {
  const listFn = useServerFn(listFinanceRows);
  const exportFn = useServerFn(exportFinance);
  const bulkFn = useServerFn(bulkMarkPaid);
  const clientsFn = useServerFn(listEventClients);

  const [filters, setFilters] = useState<FinanceFilters>({ paid: "all" });
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState({
    total_amount: 0,
    total_paid: 0,
    total_unpaid: 0,
    count_workers: 0,
    count_events: 0,
  });
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function refresh() {
    setLoading(true);
    try {
      const res: any = await listFn({ data: filters });
      setRows(res.rows);
      setTotals(res.totals);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const c = await clientsFn();
        setClients(c as any[]);
      } catch {}
      refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof FinanceFilters>(k: K, v: FinanceFilters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
  }

  async function doExport(format: "xlsx" | "csv") {
    try {
      const r: any = await exportFn({ data: { filters, format } });
      saveBlob(r.base64, r.mime_type, r.file_name);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri exporte.");
    }
  }

  async function markSelectedPaid(paid: boolean) {
    if (!selected.size) return toast.error("Nič nie je označené.");
    try {
      await bulkFn({ data: { assignment_ids: Array.from(selected), paid } });
      toast.success(paid ? "Označené ako uhradené." : "Zrušené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  const allSelected = useMemo(
    () => rows.length > 0 && selected.size === rows.length,
    [rows, selected],
  );

  return (
    <section>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Prehľad</div>
        <h1 className="font-display text-4xl">Financie</h1>
      </header>

      <div className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-[#726D6A]">
          <Filter className="h-4 w-4" /> Filtre
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Obdobie od</div>
            <input
              type="date"
              value={filters.date_from || ""}
              onChange={(e) => set("date_from", e.target.value || null)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Obdobie do</div>
            <input
              type="date"
              value={filters.date_to || ""}
              onChange={(e) => set("date_to", e.target.value || null)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Klient</div>
            <select
              value={filters.client_id || ""}
              onChange={(e) => set("client_id", e.target.value || null)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            >
              <option value="">Všetci</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Stav platby</div>
            <select
              value={filters.paid || "all"}
              onChange={(e) => set("paid", e.target.value as any)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            >
              <option value="all">Všetko</option>
              <option value="paid">Uhradené</option>
              <option value="unpaid">Neuhradené</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Typ pracovníka</div>
            <select
              value={filters.worker_type || ""}
              onChange={(e) => set("worker_type", e.target.value || null)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            >
              <option value="">Všetci</option>
              {WORKER_TYPES.map((w) => (
                <option key={w} value={w}>{WORKER_TYPE_LABEL[w]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <div className="text-xs text-[#726D6A] mb-1">Typ zmluvy hostesky</div>
            <select
              value={filters.contract_type || ""}
              onChange={(e) => set("contract_type", e.target.value || null)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            >
              <option value="">Všetky</option>
              <option value="dohoda_o_brigadnickej_praci">Dohoda o BPŠ</option>
              <option value="dohoda_o_pracovnej_cinnosti">Dohoda o PČ</option>
              <option value="dohoda_o_vykonani_prace">Dohoda o VP</option>
              <option value="pracovna_zmluva">Pracovná zmluva</option>
              <option value="zivnost">Živnosť</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={refresh}
            className="rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm hover:opacity-90"
          >
            Aplikovať filtre
          </button>
          <button
            onClick={() => {
              setFilters({ paid: "all" });
              setTimeout(refresh, 0);
            }}
            className="rounded-lg border border-[#D9D2CC] px-4 py-2 text-sm hover:bg-white"
          >
            Vyčistiť
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <SumCard label="Celkom" value={`${totals.total_amount.toLocaleString("sk-SK")} €`} />
        <SumCard label="Uhradené" value={`${totals.total_paid.toLocaleString("sk-SK")} €`} tone="ok" />
        <SumCard label="Neuhradené" value={`${totals.total_unpaid.toLocaleString("sk-SK")} €`} tone="warn" />
        <SumCard label="Pracovníci" value={String(totals.count_workers)} />
        <SumCard label="Eventy" value={String(totals.count_events)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => doExport("xlsx")}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export XLSX
        </button>
        <button
          onClick={() => doExport("csv")}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button
          onClick={() => markSelectedPaid(true)}
          disabled={!selected.size}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" /> Označiť vybrané ako uhradené
        </button>
        <button
          onClick={() => markSelectedPaid(false)}
          disabled={!selected.size}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white disabled:opacity-50"
        >
          Zrušiť označenie
        </button>
      </div>

      <div className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-[#726D6A] p-6">Načítavam…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-[#726D6A] p-6 text-center">Žiadne záznamy.</div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-xs uppercase tracking-wider text-[#726D6A] border-b border-[#D9D2CC]">
              <tr>
                <th className="py-2 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(rows.map((r) => r.assignment_id)));
                      else setSelected(new Set());
                    }}
                  />
                </th>
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Pracovník</th>
                <th className="py-2 pr-3">Dátum</th>
                <th className="py-2 pr-3">Hodiny</th>
                <th className="py-2 pr-3">Vypočítaná</th>
                <th className="py-2 pr-3">Finálna</th>
                <th className="py-2 pr-3">Stav</th>
                <th className="py-2 pr-3">Dátum úhrady</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.assignment_id} className="border-b border-[#D9D2CC] last:border-0">
                  <td className="py-2 pr-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.assignment_id)}
                      onChange={(e) => {
                        const ns = new Set(selected);
                        if (e.target.checked) ns.add(r.assignment_id);
                        else ns.delete(r.assignment_id);
                        setSelected(ns);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Link
                      to="/admin/events/$id"
                      params={{ id: r.event_id }}
                      className="text-[#383B3A] hover:underline"
                    >
                      {r.event_name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    {r.hostess_first_name} {r.hostess_last_name}
                  </td>
                  <td className="py-2 pr-3">
                    {r.event_date_from
                      ? new Date(r.event_date_from).toLocaleDateString("sk-SK")
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">{r.worked_hours ?? "—"}</td>
                  <td className="py-2 pr-3">
                    {r.amount_calculated != null
                      ? `${r.amount_calculated.toLocaleString("sk-SK")} €`
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {r.amount_final != null
                      ? `${r.amount_final.toLocaleString("sk-SK")} €`
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        r.paid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.paid ? "Uhradené" : "Neuhradené"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {r.paid_at
                      ? new Date(r.paid_at).toLocaleDateString("sk-SK")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function SumCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : "border-[#D9D2CC] bg-[#F5F1EC]";
  return (
    <div className={`rounded-2xl border ${cls} p-4`}>
      <div className="text-xs text-[#726D6A]">{label}</div>
      <div className="text-2xl font-medium mt-1">{value}</div>
    </div>
  );
}
