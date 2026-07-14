import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Trash2,
  AlertTriangle,
  ExternalLink,
  FileText,
  CheckCircle2,
} from "lucide-react";
import {
  listAssignableHostesses,
  listEventAssignments,
  assignHostessToEvent,
  updateAssignmentStatus,
  removeAssignment,
  checkHostessConflict,
} from "@/lib/events.functions";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABEL,
  type AssignmentStatus,
} from "@/lib/event-constants";
import { EventContractDialog } from "./EventContractDialog";

type Hostess = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  languages?: string | null;
};

type Assignment = {
  id: string;
  event_id: string;
  hostess_profile_id: string;
  status: AssignmentStatus;
  hostess: Hostess | null;
  created_at: string;
  generated_contract_id: string | null;
  contract_signed: boolean;
  contract_required: boolean;
  agreed_payment: number | null;
  payment_type: string | null;
};

const badge: Record<AssignmentStatus, string> = {
  navrhnuta: "bg-[#D9D2CC] text-[#383B3A]",
  kontaktovana: "bg-blue-100 text-blue-800",
  potvrdena: "bg-emerald-100 text-emerald-800",
  odmietnutna: "bg-red-100 text-red-800",
  nahradnicka: "bg-amber-100 text-amber-800",
  zucastnila_sa: "bg-emerald-200 text-emerald-900",
  neprisla: "bg-red-200 text-red-900",
  zrusena: "bg-[#EBE6E2] text-[#726D6A]",
};

export function EventWorkersTab({
  eventId,
  requiredWorkers,
}: {
  eventId: string;
  requiredWorkers: number;
}) {
  const listAssign = useServerFn(listEventAssignments);
  const listHostesses = useServerFn(listAssignableHostesses);
  const assignFn = useServerFn(assignHostessToEvent);
  const updateStatusFn = useServerFn(updateAssignmentStatus);
  const removeFn = useServerFn(removeAssignment);
  const conflictFn = useServerFn(checkHostessConflict);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [hostesses, setHostesses] = useState<Hostess[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [asSubstitute, setAsSubstitute] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Record<string, any[]>>({});
  const [contractFor, setContractFor] = useState<Assignment | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [a, h] = await Promise.all([
        listAssign({ data: { event_id: eventId } }),
        listHostesses(),
      ]);
      setAssignments(a as Assignment[]);
      setHostesses(h as Hostess[]);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const assignedIds = useMemo(
    () => new Set(assignments.map((a) => a.hostess_profile_id)),
    [assignments],
  );

  const candidates = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return hostesses.filter((h) => {
      if (assignedIds.has(h.id)) return false;
      if (!needle) return true;
      return (
        `${h.first_name} ${h.last_name}`.toLowerCase().includes(needle) ||
        (h.email || "").toLowerCase().includes(needle) ||
        (h.phone || "").toLowerCase().includes(needle) ||
        (h.city || "").toLowerCase().includes(needle) ||
        (h.languages || "").toLowerCase().includes(needle)
      );
    });
  }, [hostesses, assignedIds, q]);

  const visibleAssignments = useMemo(() => {
    if (!statusFilter) return assignments;
    return assignments.filter((a) => a.status === statusFilter);
  }, [assignments, statusFilter]);

  const activeCount = assignments.filter(
    (a) => !["odmietnutna", "zrusena"].includes(a.status),
  ).length;

  async function checkAndAssign(hostessId: string) {
    setBusy(hostessId);
    try {
      const conf: any = await conflictFn({
        data: { hostess_id: hostessId, event_id: eventId },
      });
      let proceed = true;
      if (conf && conf.length) {
        const names = conf.map((c: any) => `• ${c.name} (${c.date_from})`).join("\n");
        proceed = confirm(
          `⚠ Časový konflikt s inými eventmi:\n${names}\n\nPriradiť napriek tomu?`,
        );
      }
      if (!proceed) return;
      await assignFn({
        data: {
          event_id: eventId,
          hostess_id: hostessId,
          as_substitute: asSubstitute,
        },
      });
      toast.success(asSubstitute ? "Náhradníčka pridaná." : "Hosteska priradená.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri priraďovaní.");
    } finally {
      setBusy(null);
    }
  }

  async function loadConflict(a: Assignment) {
    if (conflicts[a.id]) return;
    try {
      const c: any = await conflictFn({
        data: { hostess_id: a.hostess_profile_id, event_id: eventId },
      });
      setConflicts((prev) => ({ ...prev, [a.id]: c }));
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    assignments.forEach(loadConflict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  async function onChangeStatus(id: string, status: string) {
    setBusy(id);
    try {
      await updateStatusFn({ data: { id, status } });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(id: string, name: string) {
    if (!confirm(`Odobrať ${name}?`)) return;
    setBusy(id);
    try {
      await removeFn({ data: { id } });
      toast.success("Priradenie odstránené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Priradení */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h3 className="text-sm uppercase tracking-wider text-[#726D6A]">
            Priradení pracovníci{" "}
            <span className="ml-1 text-[#383B3A] font-medium">
              {activeCount} / {requiredWorkers}
            </span>
          </h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Všetky stavy</option>
            {ASSIGNMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ASSIGNMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-sm text-[#726D6A]">Načítavam…</div>
        ) : visibleAssignments.length === 0 ? (
          <div className="text-sm text-[#726D6A] py-6 text-center border border-dashed border-[#D9D2CC] rounded-lg">
            Zatiaľ nikto priradený.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-[#726D6A] border-b border-[#D9D2CC]">
                <tr>
                  <th className="py-2 pr-3">Hosteska</th>
                  <th className="py-2 pr-3">Kontakt</th>
                  <th className="py-2 pr-3">Stav</th>
                  <th className="py-2 pr-3">Konflikt</th>
                  <th className="py-2 pr-3">Zmluva</th>
                  <th className="py-2 text-right">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {visibleAssignments.map((a) => {
                  const name = a.hostess
                    ? `${a.hostess.first_name} ${a.hostess.last_name}`
                    : "—";
                  const c = conflicts[a.id];
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-[#D9D2CC] last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium">
                        <div className="flex items-center gap-2">
                          {name}
                          {a.hostess && (
                            <Link
                              to="/admin/hostesses/$id"
                              params={{ id: a.hostess.id }}
                              title="Otvoriť profil"
                              className="text-[#726D6A] hover:text-[#383B3A]"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-[#726D6A]">
                        <div>{a.hostess?.email || "—"}</div>
                        <div className="text-xs">{a.hostess?.phone || ""}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={a.status}
                          disabled={busy === a.id}
                          onChange={(e) => onChangeStatus(a.id, e.target.value)}
                          className={`rounded-full px-2 py-1 text-xs border-0 ${badge[a.status]}`}
                        >
                          {ASSIGNMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {ASSIGNMENT_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        {c && c.length > 0 ? (
                          <span
                            title={c.map((x: any) => x.name).join(", ")}
                            className="inline-flex items-center gap-1 text-amber-700 text-xs"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {c.length}× kolízia
                          </span>
                        ) : (
                          <span className="text-xs text-[#726D6A]">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <button
                          onClick={() => setContractFor(a)}
                          className="inline-flex items-center gap-1 text-xs rounded-lg border border-[#D9D2CC] px-2 py-1 hover:bg-white"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {a.generated_contract_id ? "Zmluva" : "Generovať"}
                          {a.contract_signed && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onRemove(a.id, name)}
                          disabled={busy === a.id}
                          className="p-1.5 rounded hover:bg-red-50 text-red-700 disabled:opacity-50"
                          title="Odobrať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pridať */}
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h3 className="text-sm uppercase tracking-wider text-[#726D6A] mb-4">
          Pridať hostesku
        </h3>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#726D6A]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hľadať meno, email, telefón, mesto, jazyky…"
              className="w-full rounded-lg border border-[#D9D2CC] bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#383B3A]"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={asSubstitute}
              onChange={(e) => setAsSubstitute(e.target.checked)}
            />
            Pridať ako náhradníčku
          </label>
        </div>

        {loading ? (
          <div className="text-sm text-[#726D6A]">Načítavam hostesky…</div>
        ) : candidates.length === 0 ? (
          <div className="text-sm text-[#726D6A] py-6 text-center border border-dashed border-[#D9D2CC] rounded-lg">
            {hostesses.length === 0
              ? "Žiadne schválené hostesky nie sú k dispozícii."
              : "Všetky vyhovujúce hostesky sú už priradené."}
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-lg border border-[#D9D2CC] bg-white">
            <table className="w-full text-sm">
              <tbody>
                {candidates.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[#EBE6E2] last:border-0"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {h.first_name} {h.last_name}
                      </div>
                      <div className="text-xs text-[#726D6A]">
                        {[h.city, h.email, h.phone].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => checkAndAssign(h.id)}
                        disabled={busy === h.id}
                        className="inline-flex items-center gap-1 text-sm rounded-lg bg-[#383B3A] text-[#F5F1EC] px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
                      >
                        <UserPlus className="h-4 w-4" />
                        Priradiť
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
