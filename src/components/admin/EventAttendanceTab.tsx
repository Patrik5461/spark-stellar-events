import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Users, Clock, Calculator, CheckCircle2 } from "lucide-react";
import {
  listEventAssignments,
  updateAssignmentAttendance,
  bulkUpdateAttendance,
  getEvent,
} from "@/lib/events.functions";
import {
  recalcAssignmentPayment,
  updateAssignmentPayment,
} from "@/lib/finance.functions";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABEL,
  type AttendanceStatus,
} from "@/lib/event-constants";

type Row = {
  id: string;
  event_id: string;
  hostess_profile_id: string;
  arrival_time: string | null;
  departure_time: string | null;
  break_minutes: number;
  worked_hours: number | null;
  attendance_status: AttendanceStatus;
  worker_note: string | null;
  status: string;
  payment_amount_calculated: number | null;
  payment_amount_final: number | null;
  paid: boolean;
  paid_at: string | null;
  payment_note: string | null;
  hostess: { first_name: string; last_name: string } | null;
};

type LocalRow = Row & {
  arrival_local: string; // HH:MM
  departure_local: string;
  worked_hours_str: string;
  dirty: boolean;
};

function toLocalTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function combine(date: string, time: string): string | null {
  if (!time) return null;
  const d = new Date(`${date}T${time}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function computeHours(
  arrival: string | null,
  departure: string | null,
  breakMin: number,
): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival).getTime();
  const d = new Date(departure).getTime();
  if (isNaN(a) || isNaN(d) || d <= a) return null;
  const minutes = (d - a) / 60000 - (breakMin || 0);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

export function EventAttendanceTab({ eventId }: { eventId: string }) {
  const listFn = useServerFn(listEventAssignments);
  const eventFn = useServerFn(getEvent);
  const updateFn = useServerFn(updateAssignmentAttendance);
  const bulkFn = useServerFn(bulkUpdateAttendance);
  const recalcFn = useServerFn(recalcAssignmentPayment);
  const payFn = useServerFn(updateAssignmentPayment);

  const [rows, setRows] = useState<LocalRow[]>([]);
  const [eventDate, setEventDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [commonArrival, setCommonArrival] = useState("");
  const [commonDeparture, setCommonDeparture] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const [assn, ev]: any = await Promise.all([
        listFn({ data: { event_id: eventId } }),
        eventFn({ data: { id: eventId } }),
      ]);
      setEventDate(ev?.date_from || new Date().toISOString().slice(0, 10));
      setRows(
        (assn as Row[]).map((r) => ({
          ...r,
          arrival_local: toLocalTime(r.arrival_time),
          departure_local: toLocalTime(r.departure_time),
          worked_hours_str:
            r.worked_hours != null ? String(r.worked_hours) : "",
          dirty: false,
        })),
      );
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

  const activeRows = useMemo(
    () => rows.filter((r) => !["odmietnutna", "zrusena"].includes(r.status)),
    [rows],
  );

  function patch(id: string, patch: Partial<LocalRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch, dirty: true };
        // auto-recalc worked hours unless user set them manually in this patch
        if (
          patch.worked_hours_str === undefined &&
          (patch.arrival_local !== undefined ||
            patch.departure_local !== undefined ||
            patch.break_minutes !== undefined)
        ) {
          const arr = combine(eventDate, next.arrival_local);
          const dep = combine(eventDate, next.departure_local);
          const h = computeHours(arr, dep, next.break_minutes || 0);
          next.worked_hours_str = h != null ? String(h) : "";
        }
        return next;
      }),
    );
  }

  async function saveRow(r: LocalRow) {
    setBusyId(r.id);
    try {
      const arrival = combine(eventDate, r.arrival_local);
      const departure = combine(eventDate, r.departure_local);
      const wh = r.worked_hours_str.trim() === ""
        ? null
        : Number(r.worked_hours_str.replace(",", "."));
      await updateFn({
        data: {
          id: r.id,
          arrival_time: arrival,
          departure_time: departure,
          break_minutes: Number(r.break_minutes) || 0,
          worked_hours: Number.isFinite(wh as number) ? (wh as number) : null,
          attendance_status: r.attendance_status,
          worker_note: r.worker_note,
        },
      });
      toast.success("Uložené.");
      setRows((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, dirty: false } : x)),
      );
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri ukladaní.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllPresent() {
    if (!activeRows.length) return;
    if (!confirm("Označiť všetkých priradených ako Zúčastnila sa?")) return;
    try {
      await bulkFn({
        data: {
          event_id: eventId,
          assignment_ids: activeRows.map((r) => r.id),
          attendance_status: "ok",
        },
      });
      toast.success("Označené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  async function applyCommonArrival() {
    if (!commonArrival) return toast.error("Zadaj čas príchodu.");
    const iso = combine(eventDate, commonArrival);
    try {
      await bulkFn({
        data: {
          event_id: eventId,
          assignment_ids: activeRows.map((r) => r.id),
          arrival_time: iso,
        },
      });
      toast.success("Nastavené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  async function applyCommonDeparture() {
    if (!commonDeparture) return toast.error("Zadaj čas odchodu.");
    const iso = combine(eventDate, commonDeparture);
    try {
      await bulkFn({
        data: {
          event_id: eventId,
          assignment_ids: activeRows.map((r) => r.id),
          departure_time: iso,
        },
      });
      toast.success("Nastavené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  async function recalcOne(id: string) {
    setBusyId(id);
    try {
      await recalcFn({ data: { assignment_id: id } });
      toast.success("Prepočítané.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePaid(id: string, paid: boolean) {
    setBusyId(id);
    try {
      await payFn({ data: { id, paid } });
      toast.success(paid ? "Označené ako uhradené." : "Zrušené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    } finally {
      setBusyId(null);
    }
  }

  async function setFinal(id: string, value: string, note: string) {
    setBusyId(id);
    try {
      const num =
        value.trim() === "" ? null : Number(value.replace(",", "."));
      await payFn({
        data: {
          id,
          payment_amount_final: Number.isFinite(num as number)
            ? (num as number)
            : null,
          payment_note: note,
        },
      });
      toast.success("Uložené.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading)
    return <div className="text-sm text-[#726D6A]">Načítavam dochádzku…</div>;

  if (!activeRows.length)
    return (
      <div className="bg-[#F5F1EC] border border-dashed border-[#D9D2CC] rounded-xl p-10 text-center text-[#726D6A]">
        Zatiaľ nikto priradený. Priraď hostesky v záložke „Pracovníci".
      </div>
    );

  return (
    <div className="space-y-6">
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h3 className="text-sm uppercase tracking-wider text-[#726D6A] mb-3">
          Hromadné akcie
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <button
            onClick={markAllPresent}
            className="inline-flex items-center gap-2 rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm hover:opacity-90"
          >
            <Users className="h-4 w-4" /> Označiť všetkých ako prítomných
          </button>
          <label className="flex items-end gap-2 text-sm">
            <div>
              <div className="text-xs text-[#726D6A] mb-1">Spoločný príchod</div>
              <input
                type="time"
                value={commonArrival}
                onChange={(e) => setCommonArrival(e.target.value)}
                className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={applyCommonArrival}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white"
            >
              <Clock className="h-4 w-4" /> Nastaviť
            </button>
          </label>
          <label className="flex items-end gap-2 text-sm">
            <div>
              <div className="text-xs text-[#726D6A] mb-1">Spoločný odchod</div>
              <input
                type="time"
                value={commonDeparture}
                onChange={(e) => setCommonDeparture(e.target.value)}
                className="rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={applyCommonDeparture}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-white"
            >
              <Clock className="h-4 w-4" /> Nastaviť
            </button>
          </label>
        </div>
      </section>

      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-xs uppercase tracking-wider text-[#726D6A] border-b border-[#D9D2CC]">
            <tr>
              <th className="py-2 pr-3">Hosteska</th>
              <th className="py-2 pr-3">Príchod</th>
              <th className="py-2 pr-3">Odchod</th>
              <th className="py-2 pr-3">Prestávka (min)</th>
              <th className="py-2 pr-3">Hodiny</th>
              <th className="py-2 pr-3">Stav</th>
              <th className="py-2 pr-3">Poznámka</th>
              <th className="py-2 text-right">Akcia</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.map((r) => (
              <tr key={r.id} className="border-b border-[#D9D2CC] last:border-0">
                <td className="py-2 pr-3 font-medium">
                  {r.hostess
                    ? `${r.hostess.first_name} ${r.hostess.last_name}`
                    : "—"}
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="time"
                    value={r.arrival_local}
                    onChange={(e) =>
                      patch(r.id, { arrival_local: e.target.value })
                    }
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-28"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="time"
                    value={r.departure_local}
                    onChange={(e) =>
                      patch(r.id, { departure_local: e.target.value })
                    }
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-28"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    value={r.break_minutes}
                    onChange={(e) =>
                      patch(r.id, {
                        break_minutes: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-20"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={r.worked_hours_str}
                    onChange={(e) =>
                      patch(r.id, { worked_hours_str: e.target.value })
                    }
                    placeholder="auto"
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-20"
                  />
                </td>
                <td className="py-2 pr-3">
                  <select
                    value={r.attendance_status}
                    onChange={(e) =>
                      patch(r.id, {
                        attendance_status: e.target.value as AttendanceStatus,
                      })
                    }
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm"
                  >
                    {ATTENDANCE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ATTENDANCE_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={r.worker_note || ""}
                    onChange={(e) => patch(r.id, { worker_note: e.target.value })}
                    className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-full min-w-[140px]"
                  />
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => saveRow(r)}
                    disabled={busyId === r.id || !r.dirty}
                    className="inline-flex items-center gap-1 text-sm rounded-lg bg-[#383B3A] text-[#F5F1EC] px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {r.dirty ? "Uložiť" : "OK"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5 overflow-x-auto">
        <h3 className="text-sm uppercase tracking-wider text-[#726D6A] mb-3">
          Odmeny
        </h3>
        <table className="w-full text-sm min-w-[900px]">
          <thead className="text-left text-xs uppercase tracking-wider text-[#726D6A] border-b border-[#D9D2CC]">
            <tr>
              <th className="py-2 pr-3">Hosteska</th>
              <th className="py-2 pr-3">Hodiny</th>
              <th className="py-2 pr-3">Vypočítaná</th>
              <th className="py-2 pr-3">Finálna</th>
              <th className="py-2 pr-3">Poznámka</th>
              <th className="py-2 pr-3">Stav</th>
              <th className="py-2 text-right">Akcia</th>
            </tr>
          </thead>
          <tbody>
            {activeRows.map((r) => (
              <PaymentRow
                key={r.id}
                row={r}
                busy={busyId === r.id}
                onRecalc={() => recalcOne(r.id)}
                onSetFinal={(v, n) => setFinal(r.id, v, n)}
                onTogglePaid={(p) => togglePaid(r.id, p)}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function PaymentRow({
  row,
  busy,
  onRecalc,
  onSetFinal,
  onTogglePaid,
}: {
  row: LocalRow & {
    payment_amount_calculated: number | null;
    payment_amount_final: number | null;
    paid: boolean;
    paid_at: string | null;
    payment_note: string | null;
  };
  busy: boolean;
  onRecalc: () => void;
  onSetFinal: (value: string, note: string) => void;
  onTogglePaid: (paid: boolean) => void;
}) {
  const [finalStr, setFinalStr] = useState(
    row.payment_amount_final != null ? String(row.payment_amount_final) : "",
  );
  const [note, setNote] = useState(row.payment_note || "");
  const dirty =
    finalStr !== (row.payment_amount_final != null ? String(row.payment_amount_final) : "") ||
    note !== (row.payment_note || "");
  return (
    <tr className="border-b border-[#D9D2CC] last:border-0">
      <td className="py-2 pr-3 font-medium">
        {row.hostess ? `${row.hostess.first_name} ${row.hostess.last_name}` : "—"}
      </td>
      <td className="py-2 pr-3">{row.worked_hours ?? "—"}</td>
      <td className="py-2 pr-3">
        {row.payment_amount_calculated != null
          ? `${Number(row.payment_amount_calculated).toLocaleString("sk-SK")} €`
          : "—"}
      </td>
      <td className="py-2 pr-3">
        <input
          type="text"
          value={finalStr}
          onChange={(e) => setFinalStr(e.target.value)}
          placeholder={row.payment_amount_calculated != null ? String(row.payment_amount_calculated) : "0"}
          className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-24"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded border border-[#D9D2CC] bg-white px-2 py-1 text-sm w-full min-w-[140px]"
        />
      </td>
      <td className="py-2 pr-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            row.paid
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {row.paid
            ? `Uhradené${row.paid_at ? " " + new Date(row.paid_at).toLocaleDateString("sk-SK") : ""}`
            : "Neuhradené"}
        </span>
      </td>
      <td className="py-2 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={onRecalc}
            disabled={busy}
            title="Prepočítať"
            className="text-xs rounded-lg border border-[#D9D2CC] px-2 py-1 hover:bg-white disabled:opacity-50"
          >
            <Calculator className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSetFinal(finalStr, note)}
            disabled={busy || !dirty}
            className="text-xs rounded-lg border border-[#D9D2CC] px-2 py-1 hover:bg-white disabled:opacity-50"
          >
            Uložiť
          </button>
          <button
            onClick={() => onTogglePaid(!row.paid)}
            disabled={busy}
            className={`text-xs rounded-lg px-2 py-1 inline-flex items-center gap-1 ${
              row.paid
                ? "border border-[#D9D2CC] hover:bg-white"
                : "bg-emerald-600 text-white hover:opacity-90"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {row.paid ? "Zrušiť" : "Uhradiť"}
          </button>
        </div>
      </td>
    </tr>
  );
}
