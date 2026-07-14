import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Pencil,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  listEvents,
  listEventClients,
  duplicateEvent,
  deleteEvent,
} from "@/lib/events.functions";
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABEL,
  EVENT_STATUS_COLOR,
  WORKER_TYPES,
  WORKER_TYPE_LABEL,
  type EventStatus,
} from "@/lib/event-constants";

export const Route = createFileRoute("/admin/events/")({
  head: () => ({
    meta: [
      { title: "Eventy — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EventsListPage,
});

type Row = {
  id: string;
  name: string;
  client_id: string | null;
  client: { id: string; name: string } | null;
  location: string;
  date_from: string;
  date_to: string;
  time_from: string | null;
  time_to: string | null;
  worker_type: string;
  required_workers: number;
  assigned_count: number;
  status: EventStatus;
};

function EventsListPage() {
  const nav = useNavigate();
  const listFn = useServerFn(listEvents);
  const clientsFn = useServerFn(listEventClients);
  const dupFn = useServerFn(duplicateEvent);
  const delFn = useServerFn(deleteEvent);

  const [rows, setRows] = useState<Row[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [workerType, setWorkerType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  async function refresh() {
    setLoading(true);
    try {
      const [ev, cs] = await Promise.all([listFn(), clientsFn()]);
      setRows(ev as Row[]);
      setClients(cs as any);
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
      if (status && r.status !== status) return false;
      if (clientId && r.client_id !== clientId) return false;
      if (workerType && r.worker_type !== workerType) return false;
      if (location && !r.location.toLowerCase().includes(location.toLowerCase()))
        return false;
      if (dateFrom && r.date_to < dateFrom) return false;
      if (dateTo && r.date_from > dateTo) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        (r.client?.name || "").toLowerCase().includes(needle) ||
        r.location.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status, clientId, location, workerType, dateFrom, dateTo]);

  function fmtDate(d: string) {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("sk-SK");
    } catch {
      return d;
    }
  }
  function fmtTime(t: string | null) {
    return t ? t.slice(0, 5) : "—";
  }

  async function onDuplicate(id: string) {
    setBusy(id);
    try {
      const row: any = await dupFn({ data: { id } });
      toast.success("Event duplikovaný.");
      nav({ to: "/admin/events/$id", params: { id: row.id } });
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri duplikovaní.");
    } finally {
      setBusy(null);
    }
  }
  async function onDelete(id: string, name: string) {
    if (!confirm(`Zmazať event „${name}"? Toto zmaže aj priradenia a dokumenty.`))
      return;
    setBusy(id);
    try {
      await delFn({ data: { id } });
      toast.success("Event zmazaný.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri mazaní.");
    } finally {
      setBusy(null);
    }
  }

  const activeFilters =
    (status ? 1 : 0) +
    (clientId ? 1 : 0) +
    (location ? 1 : 0) +
    (workerType ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  return (
    <div className="max-w-[1200px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium">Eventy</h1>
          <p className="text-sm text-[#726D6A] mt-1">
            Správa eventov, priradenia pracovníkov a dochádzka.
          </p>
        </div>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" /> Nový event
        </Link>
      </div>

      <div className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#726D6A]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hľadať podľa názvu, klienta alebo miesta…"
              className="w-full rounded-lg border border-[#D9D2CC] bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#383B3A]"
            />
          </div>
          <div className="text-xs text-[#726D6A] inline-flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filtre {activeFilters ? `(${activeFilters})` : ""}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          >
            <option value="">Všetky stavy</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EVENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          >
            <option value="">Všetci klienti</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={workerType}
            onChange={(e) => setWorkerType(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          >
            <option value="">Všetci pracovníci</option>
            {WORKER_TYPES.map((w) => (
              <option key={w} value={w}>
                {WORKER_TYPE_LABEL[w]}
              </option>
            ))}
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Miesto"
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-[#726D6A] py-12 text-center">
          Načítavam eventy…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#F5F1EC] border border-dashed border-[#D9D2CC] rounded-xl p-10 text-center">
          <div className="text-[#383B3A] font-medium mb-1">
            {rows.length === 0 ? "Zatiaľ žiadne eventy" : "Nič nezodpovedá filtrom"}
          </div>
          <div className="text-sm text-[#726D6A] mb-4">
            {rows.length === 0
              ? "Vytvorte prvý event kliknutím na tlačidlo nižšie."
              : "Skúste zmeniť filtre alebo vyhľadávanie."}
          </div>
          {rows.length === 0 && (
            <Link
              to="/admin/events/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm"
            >
              <Plus className="h-4 w-4" /> Nový event
            </Link>
          )}
        </div>
      ) : (
        <div className="hidden md:block overflow-x-auto bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-[#726D6A] border-b border-[#D9D2CC]">
              <tr>
                <th className="px-4 py-3">Názov</th>
                <th className="px-4 py-3">Klient</th>
                <th className="px-4 py-3">Miesto</th>
                <th className="px-4 py-3">Dátum</th>
                <th className="px-4 py-3">Čas</th>
                <th className="px-4 py-3">Pracovníci</th>
                <th className="px-4 py-3">Stav</th>
                <th className="px-4 py-3 text-right">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#D9D2CC] last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      to="/admin/events/$id"
                      params={{ id: r.id }}
                      className="hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.client?.name || "—"}</td>
                  <td className="px-4 py-3">{r.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {fmtDate(r.date_from)}
                    {r.date_to !== r.date_from && ` – ${fmtDate(r.date_to)}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {fmtTime(r.time_from)} – {fmtTime(r.time_to)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.assigned_count >= r.required_workers
                          ? "text-emerald-700 font-medium"
                          : "text-[#383B3A]"
                      }
                    >
                      {r.assigned_count} / {r.required_workers}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${EVENT_STATUS_COLOR[r.status] || ""}`}
                    >
                      {EVENT_STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/admin/events/$id"
                        params={{ id: r.id }}
                        title="Otvoriť"
                        className="p-1.5 rounded hover:bg-[#EBE6E2]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/admin/events/$id"
                        params={{ id: r.id }}
                        title="Upraviť"
                        className="p-1.5 rounded hover:bg-[#EBE6E2]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        title="Duplikovať"
                        onClick={() => onDuplicate(r.id)}
                        disabled={busy === r.id}
                        className="p-1.5 rounded hover:bg-[#EBE6E2] disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        title="Zmazať"
                        onClick={() => onDelete(r.id, r.name)}
                        disabled={busy === r.id}
                        className="p-1.5 rounded hover:bg-red-50 text-red-700 disabled:opacity-50"
                      >
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

      {/* Mobile cards */}
      {!loading && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/admin/events/$id"
                  params={{ id: r.id }}
                  className="font-medium hover:underline"
                >
                  {r.name}
                </Link>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${EVENT_STATUS_COLOR[r.status] || ""}`}
                >
                  {EVENT_STATUS_LABEL[r.status] || r.status}
                </span>
              </div>
              <div className="text-xs text-[#726D6A] mt-1">
                {r.client?.name || "—"} · {r.location}
              </div>
              <div className="text-xs mt-1">
                {fmtDate(r.date_from)}
                {r.date_to !== r.date_from && ` – ${fmtDate(r.date_to)}`} ·{" "}
                {fmtTime(r.time_from)}–{fmtTime(r.time_to)}
              </div>
              <div className="text-xs mt-1">
                Pracovníci: {r.assigned_count} / {r.required_workers}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Link
                  to="/admin/events/$id"
                  params={{ id: r.id }}
                  className="text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5"
                >
                  Otvoriť
                </Link>
                <button
                  onClick={() => onDuplicate(r.id)}
                  className="text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5"
                >
                  Duplikovať
                </button>
                <button
                  onClick={() => onDelete(r.id, r.name)}
                  className="text-sm rounded-lg border border-red-200 text-red-700 px-3 py-1.5 ml-auto"
                >
                  Zmazať
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
