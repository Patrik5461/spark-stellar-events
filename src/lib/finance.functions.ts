import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ---------- helpers ----------

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

function calcAmount(
  assignment: {
    payment_type?: string | null;
    agreed_payment?: number | null;
    worked_hours?: number | null;
  },
  event: {
    payment_type?: string | null;
    payment_amount?: number | null;
    date_from: string;
    date_to: string;
  },
): number | null {
  const pType = assignment.payment_type || event.payment_type || null;
  const rate =
    assignment.agreed_payment != null
      ? Number(assignment.agreed_payment)
      : event.payment_amount != null
      ? Number(event.payment_amount)
      : null;
  if (rate == null || !Number.isFinite(rate)) return null;
  switch (pType) {
    case "za_hodinu": {
      const wh = assignment.worked_hours;
      if (wh == null || !Number.isFinite(Number(wh))) return null;
      return Math.round(Number(wh) * rate * 100) / 100;
    }
    case "za_den": {
      const days = daysBetween(event.date_from, event.date_to);
      return Math.round(rate * days * 100) / 100;
    }
    case "jednorazova":
      return Math.round(rate * 100) / 100;
    default:
      return null;
  }
}

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function fmtDateSK(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("sk-SK");
}
function fmtTimeSK(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------- calculation refresh ----------

export const recalcAssignmentPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { assignment_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: a, error } = await context.supabase
      .from("event_assignments")
      .select("*")
      .eq("id", data.assignment_id)
      .single();
    if (error || !a) throw new Error(error?.message || "Priradenie neexistuje.");
    const { data: e } = await context.supabase
      .from("events")
      .select("payment_type, payment_amount, date_from, date_to")
      .eq("id", a.event_id)
      .single();
    if (!e) throw new Error("Event neexistuje.");
    const amount = calcAmount(a as any, e as any);
    const { data: row, error: uErr } = await context.supabase
      .from("event_assignments")
      .update({ payment_amount_calculated: amount })
      .eq("id", data.assignment_id)
      .select()
      .single();
    if (uErr) throw new Error(uErr.message);
    return row;
  });

export const updateAssignmentPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      payment_amount_final?: number | null;
      paid?: boolean;
      paid_at?: string | null;
      payment_note?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, any> = {};
    if (data.payment_amount_final !== undefined)
      patch.payment_amount_final = data.payment_amount_final;
    if (data.payment_note !== undefined) patch.payment_note = data.payment_note;
    if (data.paid !== undefined) {
      patch.paid = data.paid;
      patch.paid_at = data.paid ? data.paid_at || new Date().toISOString() : null;
    } else if (data.paid_at !== undefined) {
      patch.paid_at = data.paid_at;
    }
    const { data: row, error } = await context.supabase
      .from("event_assignments")
      .update(patch as any)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: row.event_id,
      action: "payment_updated",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { assignment_id: data.id, patch },
    });
    return row;
  });

export const bulkMarkPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { assignment_ids: string[]; paid: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.assignment_ids.length) return { updated: 0 };
    const patch: Record<string, any> = {
      paid: data.paid,
      paid_at: data.paid ? new Date().toISOString() : null,
    };
    const { error } = await context.supabase
      .from("event_assignments")
      .update(patch as any)
      .in("id", data.assignment_ids);
    if (error) throw new Error(error.message);
    return { updated: data.assignment_ids.length };
  });

// ---------- finance list ----------

export type FinanceFilters = {
  date_from?: string | null;
  date_to?: string | null;
  event_id?: string | null;
  client_id?: string | null;
  paid?: "all" | "paid" | "unpaid";
  worker_type?: string | null;
  contract_type?: string | null;
};

export const listFinanceRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: FinanceFilters) => d || {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = context.supabase;

    let evQ = s
      .from("events")
      .select(
        "id, name, date_from, date_to, location, payment_type, payment_amount, worker_type, client_id, status",
      );
    if (data.date_from) evQ = evQ.gte("date_from", data.date_from);
    if (data.date_to) evQ = evQ.lte("date_to", data.date_to);
    if (data.event_id) evQ = evQ.eq("id", data.event_id);
    if (data.client_id) evQ = evQ.eq("client_id", data.client_id);
    if (data.worker_type) evQ = evQ.eq("worker_type", data.worker_type as any);
    const { data: events, error: eErr } = await evQ;
    if (eErr) throw new Error(eErr.message);

    const evIds = ((events as any[]) || []).map((e) => e.id);
    if (!evIds.length) {
      return { rows: [], totals: emptyTotals() };
    }
    const eventMap = new Map<string, any>(
      ((events as any[]) || []).map((e) => [e.id, e]),
    );

    let asQ = s
      .from("event_assignments")
      .select(
        "id, event_id, hostess_profile_id, status, agreed_payment, payment_type, worked_hours, payment_amount_calculated, payment_amount_final, paid, paid_at, payment_note, attendance_status",
      )
      .in("event_id", evIds)
      .not("status", "in", "(zrusena,odmietnutna)");
    if (data.paid === "paid") asQ = asQ.eq("paid", true);
    if (data.paid === "unpaid") asQ = asQ.eq("paid", false);
    const { data: assigns, error: aErr } = await asQ;
    if (aErr) throw new Error(aErr.message);

    const hIds = Array.from(
      new Set(((assigns as any[]) || []).map((a) => a.hostess_profile_id)),
    );
    let hostessMap = new Map<string, any>();
    if (hIds.length) {
      let hQ = s
        .from("hostess_profiles")
        .select("id, first_name, last_name, phone, email, iban, contract_type")
        .in("id", hIds);
      if (data.contract_type)
        hQ = hQ.eq("contract_type", data.contract_type as any);
      const { data: hs } = await hQ;
      hostessMap = new Map(((hs as any[]) || []).map((h) => [h.id, h]));
    }

    const clientIds = Array.from(
      new Set(
        ((events as any[]) || []).map((e) => e.client_id).filter(Boolean),
      ),
    );
    let clientMap = new Map<string, any>();
    if (clientIds.length) {
      const { data: cs } = await s
        .from("event_clients")
        .select("id, name")
        .in("id", clientIds as string[]);
      clientMap = new Map(((cs as any[]) || []).map((c) => [c.id, c]));
    }

    const rows = ((assigns as any[]) || [])
      .filter((a) => {
        if (data.contract_type && !hostessMap.has(a.hostess_profile_id))
          return false;
        return true;
      })
      .map((a) => {
        const ev = eventMap.get(a.event_id);
        const h = hostessMap.get(a.hostess_profile_id) || null;
        const calc =
          a.payment_amount_calculated != null
            ? Number(a.payment_amount_calculated)
            : calcAmount(a, ev);
        const finalAmount =
          a.payment_amount_final != null
            ? Number(a.payment_amount_final)
            : calc;
        return {
          assignment_id: a.id,
          event_id: a.event_id,
          event_name: ev?.name || "",
          event_date_from: ev?.date_from || null,
          event_date_to: ev?.date_to || null,
          event_status: ev?.status || null,
          client_name: ev?.client_id ? clientMap.get(ev.client_id)?.name || null : null,
          worker_type: ev?.worker_type || null,
          hostess_id: a.hostess_profile_id,
          hostess_first_name: h?.first_name || "",
          hostess_last_name: h?.last_name || "",
          phone: h?.phone || "",
          email: h?.email || "",
          iban: h?.iban || "",
          contract_type: h?.contract_type || null,
          payment_type: a.payment_type || ev?.payment_type || null,
          agreed_payment:
            a.agreed_payment != null
              ? Number(a.agreed_payment)
              : ev?.payment_amount != null
              ? Number(ev.payment_amount)
              : null,
          worked_hours: a.worked_hours != null ? Number(a.worked_hours) : null,
          amount_calculated: calc,
          amount_final: finalAmount,
          paid: !!a.paid,
          paid_at: a.paid_at,
          payment_note: a.payment_note,
          attendance_status: a.attendance_status,
          status: a.status,
        };
      });

    const totals = {
      total_amount: 0,
      total_paid: 0,
      total_unpaid: 0,
      count_workers: new Set<string>(),
      count_events: new Set<string>(),
    };
    for (const r of rows) {
      const amt = r.amount_final != null ? Number(r.amount_final) : 0;
      totals.total_amount += amt;
      if (r.paid) totals.total_paid += amt;
      else totals.total_unpaid += amt;
      totals.count_workers.add(r.hostess_id);
      totals.count_events.add(r.event_id);
    }
    return {
      rows,
      totals: {
        total_amount: Math.round(totals.total_amount * 100) / 100,
        total_paid: Math.round(totals.total_paid * 100) / 100,
        total_unpaid: Math.round(totals.total_unpaid * 100) / 100,
        count_workers: totals.count_workers.size,
        count_events: totals.count_events.size,
      },
    };
  });

function emptyTotals() {
  return {
    total_amount: 0,
    total_paid: 0,
    total_unpaid: 0,
    count_workers: 0,
    count_events: 0,
  };
}

// ---------- XLSX / CSV export ----------

async function loadExcelJS() {
  const mod = await import("exceljs");
  return (mod as any).default || mod;
}

const ASSIGNMENT_LABEL: Record<string, string> = {
  navrhnuta: "Navrhnutá",
  kontaktovana: "Kontaktovaná",
  potvrdena: "Potvrdená",
  odmietnutna: "Odmietnutá",
  nahradnicka: "Náhradníčka",
  zucastnila_sa: "Zúčastnila sa",
  neprisla: "Neprišla",
  zrusena: "Zrušená",
};
const ATTENDANCE_LABEL: Record<string, string> = {
  nevyplnene: "Nevyplnené",
  ok: "Zúčastnila sa",
  meskala: "Meškala",
  odisla_skor: "Odišla skôr",
  neprisla: "Neprišla",
  ospravedlnena: "Ospravedlnená",
};
const PAYMENT_LABEL: Record<string, string> = {
  za_hodinu: "Za hodinu",
  za_den: "Za deň",
  jednorazova: "Jednorazová",
  na_vyziadanie: "Na vyžiadanie",
};

async function fetchEventBundle(s: any, eventId: string) {
  const { data: ev, error } = await s
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error || !ev) throw new Error("Event neexistuje.");
  const { data: assigns } = await s
    .from("event_assignments")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  const hIds = Array.from(
    new Set(((assigns as any[]) || []).map((a) => a.hostess_profile_id)),
  );
  let hostessMap = new Map<string, any>();
  if (hIds.length) {
    const { data: hs } = await s
      .from("hostess_profiles")
      .select("id, first_name, last_name, phone, email, iban, contract_type")
      .in("id", hIds);
    hostessMap = new Map(((hs as any[]) || []).map((h) => [h.id, h]));
  }
  let contractsMap = new Map<string, any>();
  const contractIds = Array.from(
    new Set(
      ((assigns as any[]) || [])
        .map((a) => a.generated_contract_id)
        .filter(Boolean),
    ),
  );
  if (contractIds.length) {
    const { data: cs } = await s
      .from("generated_contracts")
      .select("id, version, created_at")
      .in("id", contractIds as string[]);
    contractsMap = new Map(((cs as any[]) || []).map((c) => [c.id, c]));
  }
  return { ev, assigns: (assigns as any[]) || [], hostessMap, contractsMap };
}

function sheetWorkers(wb: any, ev: any, assigns: any[], hostessMap: Map<string, any>) {
  const ws = wb.addWorksheet("Pracovníci");
  ws.columns = [
    { header: "Meno", key: "first_name", width: 16 },
    { header: "Priezvisko", key: "last_name", width: 18 },
    { header: "Telefón", key: "phone", width: 16 },
    { header: "Email", key: "email", width: 26 },
    { header: "Stav priradenia", key: "status", width: 18 },
    { header: "Typ pracovníka", key: "worker_type", width: 16 },
    { header: "Dohodnutá odmena", key: "rate", width: 18 },
    { header: "Typ odmeny", key: "payment_type", width: 16 },
    { header: "Zmluva vygenerovaná", key: "contract_generated", width: 20 },
    { header: "Zmluva podpísaná", key: "contract_signed", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const a of assigns) {
    const h = hostessMap.get(a.hostess_profile_id) || {};
    ws.addRow({
      first_name: h.first_name || "",
      last_name: h.last_name || "",
      phone: h.phone || "",
      email: h.email || "",
      status: ASSIGNMENT_LABEL[a.status] || a.status,
      worker_type: ev.worker_type || "",
      rate: a.agreed_payment != null ? Number(a.agreed_payment) : ev.payment_amount,
      payment_type: PAYMENT_LABEL[a.payment_type || ev.payment_type] || "",
      contract_generated: a.generated_contract_id ? "Áno" : "Nie",
      contract_signed: a.contract_signed ? "Áno" : "Nie",
    });
  }
}

function sheetAttendance(wb: any, ev: any, assigns: any[], hostessMap: Map<string, any>) {
  const ws = wb.addWorksheet("Dochádzka");
  ws.columns = [
    { header: "Meno", key: "first_name", width: 16 },
    { header: "Priezvisko", key: "last_name", width: 18 },
    { header: "Dátum", key: "date", width: 14 },
    { header: "Príchod", key: "arrival", width: 10 },
    { header: "Odchod", key: "departure", width: 10 },
    { header: "Prestávka (min)", key: "break", width: 16 },
    { header: "Odpracované hodiny", key: "hours", width: 18 },
    { header: "Stav dochádzky", key: "att", width: 18 },
    { header: "Poznámka", key: "note", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const a of assigns) {
    const h = hostessMap.get(a.hostess_profile_id) || {};
    ws.addRow({
      first_name: h.first_name || "",
      last_name: h.last_name || "",
      date: fmtDateSK(ev.date_from),
      arrival: fmtTimeSK(a.arrival_time),
      departure: fmtTimeSK(a.departure_time),
      break: a.break_minutes ?? 0,
      hours: a.worked_hours ?? "",
      att: ATTENDANCE_LABEL[a.attendance_status] || a.attendance_status,
      note: a.worker_note || "",
    });
  }
}

function sheetPayments(wb: any, ev: any, assigns: any[], hostessMap: Map<string, any>) {
  const ws = wb.addWorksheet("Odmeny");
  ws.columns = [
    { header: "Meno", key: "first_name", width: 16 },
    { header: "Priezvisko", key: "last_name", width: 18 },
    { header: "IBAN", key: "iban", width: 28 },
    { header: "Typ odmeny", key: "payment_type", width: 16 },
    { header: "Sadzba", key: "rate", width: 12 },
    { header: "Odpracované hodiny", key: "hours", width: 18 },
    { header: "Vypočítaná suma", key: "calc", width: 16 },
    { header: "Finálna suma", key: "final", width: 14 },
    { header: "Uhradené", key: "paid", width: 12 },
    { header: "Dátum úhrady", key: "paid_at", width: 16 },
    { header: "Poznámka", key: "note", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const a of assigns) {
    const h = hostessMap.get(a.hostess_profile_id) || {};
    const calc =
      a.payment_amount_calculated != null
        ? Number(a.payment_amount_calculated)
        : calcAmount(a, ev);
    const finalAmount =
      a.payment_amount_final != null ? Number(a.payment_amount_final) : calc;
    ws.addRow({
      first_name: h.first_name || "",
      last_name: h.last_name || "",
      iban: h.iban || "",
      payment_type: PAYMENT_LABEL[a.payment_type || ev.payment_type] || "",
      rate: a.agreed_payment != null ? Number(a.agreed_payment) : ev.payment_amount,
      hours: a.worked_hours ?? "",
      calc: calc ?? "",
      final: finalAmount ?? "",
      paid: a.paid ? "Áno" : "Nie",
      paid_at: fmtDateSK(a.paid_at),
      note: a.payment_note || "",
    });
  }
}

function sheetSummary(wb: any, ev: any) {
  const ws = wb.addWorksheet("Prehľad");
  ws.columns = [
    { header: "Pole", key: "k", width: 24 },
    { header: "Hodnota", key: "v", width: 60 },
  ];
  ws.getRow(1).font = { bold: true };
  const items = [
    ["Názov", ev.name],
    ["Miesto", ev.location],
    ["Dátum od", fmtDateSK(ev.date_from)],
    ["Dátum do", fmtDateSK(ev.date_to)],
    ["Čas od", ev.time_from || ""],
    ["Čas do", ev.time_to || ""],
    ["Typ pracovníka", ev.worker_type],
    ["Počet pracovníkov", ev.required_workers],
    ["Typ odmeny", PAYMENT_LABEL[ev.payment_type] || ev.payment_type],
    ["Sadzba", ev.payment_amount],
    ["Status", ev.status],
  ];
  for (const [k, v] of items) ws.addRow({ k, v });
}

async function bufferToB64(wb: any): Promise<string> {
  const buf = await wb.xlsx.writeBuffer();
  return bytesToB64(new Uint8Array(buf as ArrayBuffer));
}

export const exportEventXlsx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      event_id: string;
      kind: "workers" | "attendance" | "payments" | "full";
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const bundle = await fetchEventBundle(context.supabase, data.event_id);
    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    wb.creator = "NU-U Admin";
    wb.created = new Date();
    if (data.kind === "workers") {
      sheetWorkers(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
    } else if (data.kind === "attendance") {
      sheetAttendance(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
    } else if (data.kind === "payments") {
      sheetPayments(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
    } else {
      sheetSummary(wb, bundle.ev);
      sheetWorkers(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
      sheetAttendance(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
      sheetPayments(wb, bundle.ev, bundle.assigns, bundle.hostessMap);
    }
    const b64 = await bufferToB64(wb);
    const safeName = (bundle.ev.name || "event").replace(/[^\w\-. ]+/g, "_");
    const suffix =
      data.kind === "workers"
        ? "pracovnici"
        : data.kind === "attendance"
        ? "dochadzka"
        : data.kind === "payments"
        ? "odmeny"
        : "kompletny";
    return {
      base64: b64,
      file_name: `${safeName}-${suffix}.xlsx`,
      mime_type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });

export const exportFinance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { filters: FinanceFilters; format: "xlsx" | "csv" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Reuse list logic by calling the handler code directly with the same auth
    const s = context.supabase;
    const filters = data.filters || {};

    let evQ = s
      .from("events")
      .select(
        "id, name, date_from, date_to, location, payment_type, payment_amount, worker_type, client_id, status",
      );
    if (filters.date_from) evQ = evQ.gte("date_from", filters.date_from);
    if (filters.date_to) evQ = evQ.lte("date_to", filters.date_to);
    if (filters.event_id) evQ = evQ.eq("id", filters.event_id);
    if (filters.client_id) evQ = evQ.eq("client_id", filters.client_id);
    if (filters.worker_type)
      evQ = evQ.eq("worker_type", filters.worker_type as any);
    const { data: events } = await evQ;
    const evIds = ((events as any[]) || []).map((e) => e.id);
    const eventMap = new Map<string, any>(
      ((events as any[]) || []).map((e) => [e.id, e]),
    );

    let assigns: any[] = [];
    let hostessMap = new Map<string, any>();
    let clientMap = new Map<string, any>();
    if (evIds.length) {
      let asQ = s
        .from("event_assignments")
        .select(
          "id, event_id, hostess_profile_id, status, agreed_payment, payment_type, worked_hours, payment_amount_calculated, payment_amount_final, paid, paid_at, payment_note, attendance_status",
        )
        .in("event_id", evIds)
        .not("status", "in", "(zrusena,odmietnutna)");
      if (filters.paid === "paid") asQ = asQ.eq("paid", true);
      if (filters.paid === "unpaid") asQ = asQ.eq("paid", false);
      const { data: as } = await asQ;
      assigns = (as as any[]) || [];

      const hIds = Array.from(new Set(assigns.map((a) => a.hostess_profile_id)));
      if (hIds.length) {
        let hQ = s
          .from("hostess_profiles")
          .select("id, first_name, last_name, phone, email, iban, contract_type")
          .in("id", hIds);
        if (filters.contract_type)
          hQ = hQ.eq("contract_type", filters.contract_type as any);
        const { data: hs } = await hQ;
        hostessMap = new Map(((hs as any[]) || []).map((h) => [h.id, h]));
      }
      const clientIds = Array.from(
        new Set(
          ((events as any[]) || []).map((e) => e.client_id).filter(Boolean),
        ),
      );
      if (clientIds.length) {
        const { data: cs } = await s
          .from("event_clients")
          .select("id, name")
          .in("id", clientIds as string[]);
        clientMap = new Map(((cs as any[]) || []).map((c) => [c.id, c]));
      }
    }

    const rows = assigns
      .filter((a) => !filters.contract_type || hostessMap.has(a.hostess_profile_id))
      .map((a) => {
        const ev = eventMap.get(a.event_id) || {};
        const h = hostessMap.get(a.hostess_profile_id) || {};
        const calc =
          a.payment_amount_calculated != null
            ? Number(a.payment_amount_calculated)
            : calcAmount(a, ev);
        const finalAmount =
          a.payment_amount_final != null
            ? Number(a.payment_amount_final)
            : calc;
        return {
          event_name: ev.name || "",
          client_name: ev.client_id ? clientMap.get(ev.client_id)?.name || "" : "",
          date: fmtDateSK(ev.date_from),
          first_name: h.first_name || "",
          last_name: h.last_name || "",
          iban: h.iban || "",
          payment_type: PAYMENT_LABEL[a.payment_type || ev.payment_type] || "",
          hours: a.worked_hours ?? "",
          calc: calc ?? "",
          final: finalAmount ?? "",
          paid: a.paid ? "Áno" : "Nie",
          paid_at: fmtDateSK(a.paid_at),
          note: a.payment_note || "",
        };
      });

    if (data.format === "csv") {
      const headers = [
        "Event",
        "Klient",
        "Dátum",
        "Meno",
        "Priezvisko",
        "IBAN",
        "Typ odmeny",
        "Odpracované hodiny",
        "Vypočítaná suma",
        "Finálna suma",
        "Uhradené",
        "Dátum úhrady",
        "Poznámka",
      ];
      const esc = (v: any) => {
        const s = v == null ? "" : String(v);
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [headers.map(esc).join(";")];
      for (const r of rows) {
        lines.push(
          [
            r.event_name,
            r.client_name,
            r.date,
            r.first_name,
            r.last_name,
            r.iban,
            r.payment_type,
            r.hours,
            r.calc,
            r.final,
            r.paid,
            r.paid_at,
            r.note,
          ]
            .map(esc)
            .join(";"),
        );
      }
      const bin = "\uFEFF" + lines.join("\n");
      const bytes = new TextEncoder().encode(bin);
      return {
        base64: bytesToB64(bytes),
        file_name: `finance.csv`,
        mime_type: "text/csv;charset=utf-8",
      };
    }

    const ExcelJS = await loadExcelJS();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Finance");
    ws.columns = [
      { header: "Event", key: "event_name", width: 24 },
      { header: "Klient", key: "client_name", width: 20 },
      { header: "Dátum", key: "date", width: 14 },
      { header: "Meno", key: "first_name", width: 14 },
      { header: "Priezvisko", key: "last_name", width: 16 },
      { header: "IBAN", key: "iban", width: 28 },
      { header: "Typ odmeny", key: "payment_type", width: 14 },
      { header: "Odpracované hodiny", key: "hours", width: 18 },
      { header: "Vypočítaná suma", key: "calc", width: 16 },
      { header: "Finálna suma", key: "final", width: 14 },
      { header: "Uhradené", key: "paid", width: 10 },
      { header: "Dátum úhrady", key: "paid_at", width: 14 },
      { header: "Poznámka", key: "note", width: 30 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of rows) ws.addRow(r);
    const b64 = await bufferToB64(wb);
    return {
      base64: b64,
      file_name: "finance.xlsx",
      mime_type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  });
