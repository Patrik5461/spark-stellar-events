import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

const OPEN_EVENT_STATUSES = ["koncept", "otvoreny_nabor", "obsadene", "prebieha"] as const;
const ACTIVE_ASSIGNMENT = [
  "navrhnuta",
  "kontaktovana",
  "potvrdena",
  "nahradnicka",
  "zucastnila_sa",
] as const;

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = context.supabase;
    const today = todayISO();
    const in7 = addDaysISO(7);
    const in2 = addDaysISO(2);

    const [
      todayCount,
      weekCount,
      openCount,
      pendingConfirm,
      unsignedContracts,
      newHostesses,
      allOpenEvents,
      allActiveAssigns,
      finishedNoAttendance,
      unpaidRows,
    ] = await Promise.all([
      s.from("events").select("id", { count: "exact", head: true }).lte("date_from", today).gte("date_to", today),
      s.from("events").select("id", { count: "exact", head: true }).lte("date_from", in7).gte("date_to", today),
      s.from("events").select("id", { count: "exact", head: true }).in("status", OPEN_EVENT_STATUSES as any),
      s.from("event_assignments").select("id", { count: "exact", head: true }).in("status", ["navrhnuta", "kontaktovana"]),
      s.from("event_assignments").select("id", { count: "exact", head: true }).eq("contract_required", true).eq("contract_signed", false),
      s.from("hostess_profiles").select("id", { count: "exact", head: true }).eq("status", "nova"),
      s.from("events").select("id, required_workers").in("status", OPEN_EVENT_STATUSES as any).gte("date_to", today),
      s.from("event_assignments").select("event_id, status").in("status", ACTIVE_ASSIGNMENT as any),
      s.from("events").select("id, date_to").lt("date_to", today).neq("status", "zrusene"),
      s.from("event_assignments").select("payment_amount_final, payment_amount_calculated, paid, paid_at, event_id, status").eq("paid", false).not("status", "in", "(zrusena,odmietnutna)"),
    ]);

    // Unfilled slots across open, not-past events
    const assignedByEvent: Record<string, number> = {};
    for (const r of (allActiveAssigns.data as any[]) || []) {
      assignedByEvent[r.event_id] = (assignedByEvent[r.event_id] || 0) + 1;
    }
    let unfilled = 0;
    for (const e of (allOpenEvents.data as any[]) || []) {
      const gap = (e.required_workers || 0) - (assignedByEvent[e.id] || 0);
      if (gap > 0) unfilled += gap;
    }

    // Events without attendance filled (any assignment still 'nevyplnene' after event end)
    let missingAttendance = 0;
    const finishedIds = ((finishedNoAttendance.data as any[]) || []).map((e) => e.id);
    if (finishedIds.length) {
      const { data: assigns } = await s
        .from("event_assignments")
        .select("event_id, attendance_status")
        .in("event_id", finishedIds);
      const bad = new Set<string>();
      for (const a of (assigns as any[]) || []) {
        if (a.attendance_status === "nevyplnene") bad.add(a.event_id);
      }
      missingAttendance = bad.size;
    }

    // Finance widgets
    const monthStart = today.slice(0, 8) + "01";
    let unpaidTotal = 0;
    for (const r of (unpaidRows.data as any[]) || []) {
      const v = r.payment_amount_final ?? r.payment_amount_calculated ?? 0;
      unpaidTotal += Number(v) || 0;
    }
    const { data: monthAssigns } = await s
      .from("event_assignments")
      .select("payment_amount_final, payment_amount_calculated, paid, paid_at, event_id, status, events!inner(date_from)")
      .gte("events.date_from", monthStart)
      .lte("events.date_from", today)
      .not("status", "in", "(zrusena,odmietnutna)");
    let monthTotal = 0;
    let monthPaid = 0;
    for (const r of (monthAssigns as any[]) || []) {
      const v = Number(r.payment_amount_final ?? r.payment_amount_calculated ?? 0) || 0;
      monthTotal += v;
      if (r.paid) monthPaid += v;
    }

    return {
      today: todayCount.count || 0,
      week: weekCount.count || 0,
      open: openCount.count || 0,
      unfilled_slots: unfilled,
      pending_confirmations: pendingConfirm.count || 0,
      unsigned_contracts: unsignedContracts.count || 0,
      missing_attendance: missingAttendance,
      new_hostesses: newHostesses.count || 0,
      unpaid_total: Math.round(unpaidTotal * 100) / 100,
      month_total: Math.round(monthTotal * 100) / 100,
      month_paid: Math.round(monthPaid * 100) / 100,
      in48h: in2,
    };
  });

export const getUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = context.supabase;
    const today = todayISO();
    const { data: events } = await s
      .from("events")
      .select("id, name, date_from, date_to, location, status, required_workers, client_id")
      .gte("date_to", today)
      .neq("status", "zrusene")
      .order("date_from", { ascending: true })
      .limit(5);
    const ids = ((events as any[]) || []).map((e) => e.id);
    const clientIds = Array.from(
      new Set(((events as any[]) || []).map((e) => e.client_id).filter(Boolean)),
    );
    const [assigns, clients] = await Promise.all([
      ids.length
        ? s.from("event_assignments").select("event_id, status").in("event_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      clientIds.length
        ? s.from("event_clients").select("id, name").in("id", clientIds as string[])
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const counts: Record<string, number> = {};
    for (const a of (assigns.data as any[]) || []) {
      if ((ACTIVE_ASSIGNMENT as readonly string[]).includes(a.status))
        counts[a.event_id] = (counts[a.event_id] || 0) + 1;
    }
    const cmap: Record<string, any> = Object.fromEntries(
      ((clients.data as any[]) || []).map((c) => [c.id, c]),
    );
    return ((events as any[]) || []).map((e) => ({
      ...e,
      assigned_count: counts[e.id] || 0,
      client: cmap[e.client_id] || null,
    }));
  });

export const getDashboardAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = context.supabase;
    const today = todayISO();
    const in2 = addDaysISO(2);

    const alerts: Array<{
      kind: string;
      severity: "warn" | "info" | "danger";
      message: string;
      event_id: string;
      assignment_id?: string;
    }> = [];

    // 1) Event within 48h and not fully staffed
    const { data: soon } = await s
      .from("events")
      .select("id, name, date_from, required_workers")
      .gte("date_from", today)
      .lte("date_from", in2)
      .neq("status", "zrusene");
    const soonIds = ((soon as any[]) || []).map((e) => e.id);
    let assignsBy: Record<string, any[]> = {};
    if (soonIds.length) {
      const { data: as } = await s
        .from("event_assignments")
        .select("id, event_id, status, contract_required, contract_signed, generated_contract_id")
        .in("event_id", soonIds);
      for (const a of (as as any[]) || []) {
        (assignsBy[a.event_id] ||= []).push(a);
      }
    }
    for (const e of (soon as any[]) || []) {
      const list = assignsBy[e.id] || [];
      const active = list.filter((a) => (ACTIVE_ASSIGNMENT as readonly string[]).includes(a.status));
      if (active.length < (e.required_workers || 0)) {
        alerts.push({
          kind: "understaffed",
          severity: "danger",
          message: `${e.name} — chýba ${(e.required_workers || 0) - active.length} z ${e.required_workers} pracovníkov (štart ${e.date_from}).`,
          event_id: e.id,
        });
      }
      for (const a of list) {
        if (a.status === "navrhnuta" || a.status === "kontaktovana") {
          alerts.push({
            kind: "unconfirmed",
            severity: "warn",
            message: `${e.name} — hosteska nepotvrdila účasť.`,
            event_id: e.id,
            assignment_id: a.id,
          });
        }
        if (a.contract_required && !a.generated_contract_id) {
          alerts.push({
            kind: "missing_contract",
            severity: "warn",
            message: `${e.name} — chýba zmluva.`,
            event_id: e.id,
            assignment_id: a.id,
          });
        }
        if (a.generated_contract_id && !a.contract_signed) {
          alerts.push({
            kind: "unsigned_contract",
            severity: "warn",
            message: `${e.name} — zmluva nie je podpísaná.`,
            event_id: e.id,
            assignment_id: a.id,
          });
        }
      }
    }

    // 2) Finished events without attendance filled
    const { data: fin } = await s
      .from("events")
      .select("id, name, date_to")
      .lt("date_to", today)
      .neq("status", "zrusene")
      .order("date_to", { ascending: false })
      .limit(50);
    const finIds = ((fin as any[]) || []).map((e) => e.id);
    if (finIds.length) {
      const { data: as } = await s
        .from("event_assignments")
        .select("id, event_id, attendance_status")
        .in("event_id", finIds);
      const missingByEvent: Record<string, number> = {};
      for (const a of (as as any[]) || []) {
        if (a.attendance_status === "nevyplnene")
          missingByEvent[a.event_id] = (missingByEvent[a.event_id] || 0) + 1;
      }
      for (const e of (fin as any[]) || []) {
        if (missingByEvent[e.id]) {
          alerts.push({
            kind: "attendance_missing",
            severity: "info",
            message: `${e.name} (${e.date_to}) — nevyplnená dochádzka pre ${missingByEvent[e.id]} priradení.`,
            event_id: e.id,
          });
        }
      }
    }

    // 3) Finance-related alerts
    // 3a) Finished/dokoncene events with unpaid amounts
    const { data: doneEvents } = await s
      .from("events")
      .select("id, name, date_to, status")
      .in("status", ["dokoncene"])
      .order("date_to", { ascending: false })
      .limit(50);
    const doneIds = ((doneEvents as any[]) || []).map((e) => e.id);
    if (doneIds.length) {
      const { data: as } = await s
        .from("event_assignments")
        .select("event_id, paid, status")
        .in("event_id", doneIds)
        .eq("paid", false)
        .not("status", "in", "(zrusena,odmietnutna)");
      const unpaidBy: Record<string, number> = {};
      for (const a of (as as any[]) || [])
        unpaidBy[a.event_id] = (unpaidBy[a.event_id] || 0) + 1;
      for (const e of (doneEvents as any[]) || []) {
        if (unpaidBy[e.id])
          alerts.push({
            kind: "unpaid_finished",
            severity: "warn",
            message: `${e.name} — ukončený event má neuhradené odmeny (${unpaidBy[e.id]}).`,
            event_id: e.id,
          });
      }
    }
    // 3b) Assignments in active events missing IBAN or calculated amount
    const { data: activeAssigns } = await s
      .from("event_assignments")
      .select("id, event_id, hostess_profile_id, worked_hours, payment_amount_calculated, payment_amount_final")
      .in("status", ACTIVE_ASSIGNMENT as any)
      .limit(200);
    const hIds2 = Array.from(
      new Set(((activeAssigns as any[]) || []).map((a) => a.hostess_profile_id)),
    );
    let ibanMap = new Map<string, string | null>();
    let nameMap = new Map<string, string>();
    if (hIds2.length) {
      const { data: hs } = await s
        .from("hostess_profiles")
        .select("id, iban, first_name, last_name")
        .in("id", hIds2);
      for (const h of (hs as any[]) || []) {
        ibanMap.set(h.id, h.iban);
        nameMap.set(h.id, `${h.first_name || ""} ${h.last_name || ""}`.trim());
      }
    }
    const evIds3 = Array.from(
      new Set(((activeAssigns as any[]) || []).map((a) => a.event_id)),
    );
    let evNames = new Map<string, string>();
    if (evIds3.length) {
      const { data: evs } = await s
        .from("events")
        .select("id, name")
        .in("id", evIds3);
      for (const e of (evs as any[]) || []) evNames.set(e.id, e.name);
    }
    for (const a of (activeAssigns as any[]) || []) {
      if (!ibanMap.get(a.hostess_profile_id)) {
        alerts.push({
          kind: "missing_iban",
          severity: "info",
          message: `${evNames.get(a.event_id) || ""} — ${nameMap.get(a.hostess_profile_id) || "pracovník"} nemá IBAN.`,
          event_id: a.event_id,
          assignment_id: a.id,
        });
      }
      if (
        a.worked_hours != null &&
        a.payment_amount_calculated == null &&
        a.payment_amount_final == null
      ) {
        alerts.push({
          kind: "missing_calc",
          severity: "info",
          message: `${evNames.get(a.event_id) || ""} — vyplnené hodiny bez vypočítanej odmeny.`,
          event_id: a.event_id,
          assignment_id: a.id,
        });
      }
    }

    return alerts.slice(0, 50);
  });

export const getEventsHealthSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = context.supabase;
    const today = todayISO();
    const [ev, openEv, ass, fin, assAll] = await Promise.all([
      s.from("events").select("id", { count: "exact", head: true }),
      s.from("events").select("id", { count: "exact", head: true }).in("status", OPEN_EVENT_STATUSES as any),
      s.from("event_assignments").select("id", { count: "exact", head: true }).eq("contract_required", true).is("generated_contract_id", null),
      s.from("events").select("id").lt("date_to", today).neq("status", "zrusene"),
      s.from("event_assignments").select("event_id, attendance_status"),
    ]);
    let finishedNoAttendance = 0;
    const finIds = new Set(((fin.data as any[]) || []).map((e) => e.id));
    const bad = new Set<string>();
    for (const a of (assAll.data as any[]) || []) {
      if (finIds.has(a.event_id) && a.attendance_status === "nevyplnene")
        bad.add(a.event_id);
    }
    finishedNoAttendance = bad.size;

    // Try to hit the bucket
    let bucketOk = true;
    let bucketDetail = "OK";
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.storage.from("event-documents").list("", { limit: 1 });
      if (error) {
        bucketOk = false;
        bucketDetail = error.message;
      }
    } catch (e: any) {
      bucketOk = false;
      bucketDetail = e?.message || String(e);
    }
    return {
      total_events: ev.count || 0,
      open_events: openEv.count || 0,
      assignments_missing_contract: ass.count || 0,
      finished_no_attendance: finishedNoAttendance,
      bucket_ok: bucketOk,
      bucket_detail: bucketDetail,
    };
  });
