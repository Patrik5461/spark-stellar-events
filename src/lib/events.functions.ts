import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ---------- Clients ----------

export const listEventClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("event_clients")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createEventClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      name: string;
      contact_name?: string | null;
      phone?: string | null;
      email?: string | null;
      note?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.name?.trim()) throw new Error("Názov klienta je povinný.");
    const { data: row, error } = await context.supabase
      .from("event_clients")
      .insert({
        name: data.name.trim(),
        contact_name: data.contact_name || null,
        phone: data.phone || null,
        email: data.email || null,
        note: data.note || null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Events ----------

type EventInput = {
  name: string;
  client_id: string | null;
  client_contact_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  location: string;
  date_from: string;
  date_to: string;
  time_from: string | null;
  time_to: string | null;
  worker_type: string;
  required_workers: number;
  payment_amount: number | null;
  payment_type: string;
  dress_code?: string | null;
  clothing_instructions?: string | null;
  job_description?: string | null;
  requirements?: string | null;
  required_languages?: string | null;
  requires_food_certificate?: boolean;
  requires_driver_license?: boolean;
  requires_car?: boolean;
  public_note?: string | null;
  internal_note?: string | null;
  status?: string;
};

function normalizeEventInput(d: EventInput) {
  if (!d.name?.trim()) throw new Error("Názov eventu je povinný.");
  if (!d.location?.trim()) throw new Error("Miesto výkonu je povinné.");
  if (!d.date_from || !d.date_to) throw new Error("Dátumy sú povinné.");
  if (d.date_to < d.date_from) throw new Error("Dátum do musí byť po dátume od.");
  if (!Number.isFinite(d.required_workers) || d.required_workers < 0)
    throw new Error("Počet pracovníkov je neplatný.");
  return {
    name: d.name.trim(),
    client_id: d.client_id || null,
    client_contact_name: d.client_contact_name || null,
    client_phone: d.client_phone || null,
    client_email: d.client_email || null,
    location: d.location.trim(),
    date_from: d.date_from,
    date_to: d.date_to,
    time_from: d.time_from || null,
    time_to: d.time_to || null,
    worker_type: d.worker_type,
    required_workers: Math.floor(d.required_workers),
    payment_amount:
      d.payment_type === "na_vyziadanie" ? null : d.payment_amount ?? null,
    payment_type: d.payment_type,
    dress_code: d.dress_code || null,
    clothing_instructions: d.clothing_instructions || null,
    job_description: d.job_description || null,
    requirements: d.requirements || null,
    required_languages: d.required_languages || null,
    requires_food_certificate: !!d.requires_food_certificate,
    requires_driver_license: !!d.requires_driver_license,
    requires_car: !!d.requires_car,
    public_note: d.public_note || null,
    internal_note: d.internal_note || null,
    status: d.status || "koncept",
  };
}

export const listEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: events, error } = await context.supabase
      .from("events")
      .select("*")
      .order("date_from", { ascending: false });
    if (error) throw new Error(error.message);

    const clientIds = Array.from(
      new Set((events || []).map((e: any) => e.client_id).filter(Boolean)),
    );
    let clientsMap: Record<string, any> = {};
    if (clientIds.length) {
      const { data: clients } = await context.supabase
        .from("event_clients")
        .select("id, name")
        .in("id", clientIds as string[]);
      clientsMap = Object.fromEntries(
        (clients || []).map((c: any) => [c.id, c]),
      );
    }

    const eventIds = (events || []).map((e: any) => e.id);
    const counts: Record<string, number> = {};
    if (eventIds.length) {
      const { data: a } = await context.supabase
        .from("event_assignments")
        .select("event_id, status")
        .in("event_id", eventIds);
      for (const r of (a as any[]) || []) {
        if (r.status !== "odmietnutna" && r.status !== "zrusena") {
          counts[r.event_id] = (counts[r.event_id] || 0) + 1;
        }
      }
    }

    return (events || []).map((e: any) => ({
      ...e,
      client: clientsMap[e.client_id] || null,
      assigned_count: counts[e.id] || 0,
    }));
  });

export const getEvent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("events")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EventInput) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload = { ...normalizeEventInput(data), created_by: context.userId };
    const { data: row, error } = await context.supabase
      .from("events")
      .insert(payload as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: row.id,
      action: "event_created",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
    });
    return row;
  });

export const updateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EventInput & { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    const patch = normalizeEventInput(rest);
    const { data: row, error } = await context.supabase
      .from("events")
      .update(patch as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: id,
      action: "event_updated",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
    });
    return row;
  });

export const duplicateEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: src, error: e1 } = await context.supabase
      .from("events")
      .select("*")
      .eq("id", data.id)
      .single();
    if (e1 || !src) throw new Error(e1?.message || "Event nenájdený.");
    const {
      id: _id,
      created_at: _c,
      updated_at: _u,
      created_by: _cb,
      ...rest
    } = src as any;
    const { data: row, error } = await context.supabase
      .from("events")
      .insert({
        ...rest,
        name: `${rest.name} (kópia)`,
        status: "koncept",
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("events")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Assignments ----------

const ACTIVE_ASSIGNMENT_STATUSES = [
  "navrhnuta",
  "kontaktovana",
  "potvrdena",
  "nahradnicka",
  "zucastnila_sa",
] as const;

export const listAssignableHostesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("hostess_profiles")
      .select(
        "id, first_name, last_name, email, phone, city, status, languages",
      )
      .in("status", ["schvalena", "zmluva_pripravena", "zmluva_podpisana"])
      .order("last_name", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const listEventAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("event_assignments")
      .select("*")
      .eq("event_id", data.event_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const hostessIds = Array.from(
      new Set((rows || []).map((r: any) => r.hostess_profile_id)),
    );
    let map: Record<string, any> = {};
    if (hostessIds.length) {
      const { data: hs } = await context.supabase
        .from("hostess_profiles")
        .select("id, first_name, last_name, email, phone, city, status")
        .in("id", hostessIds as string[]);
      map = Object.fromEntries((hs || []).map((h: any) => [h.id, h]));
    }
    return (rows || []).map((r: any) => ({ ...r, hostess: map[r.hostess_profile_id] || null }));
  });

export const checkHostessConflict = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hostess_id: string; event_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: ev, error: eErr } = await context.supabase
      .from("events")
      .select("id, date_from, date_to")
      .eq("id", data.event_id)
      .single();
    if (eErr || !ev) return [];

    const { data: assigns } = await context.supabase
      .from("event_assignments")
      .select("id, event_id, status")
      .eq("hostess_profile_id", data.hostess_id)
      .in("status", ACTIVE_ASSIGNMENT_STATUSES as any);
    const otherIds = ((assigns as any[]) || [])
      .filter((a) => a.event_id !== data.event_id)
      .map((a) => a.event_id);
    if (!otherIds.length) return [];

    const { data: others } = await context.supabase
      .from("events")
      .select("id, name, date_from, date_to, location, time_from, time_to")
      .in("id", otherIds);
    return ((others as any[]) || []).filter(
      (o) => !(o.date_to < ev.date_from || o.date_from > ev.date_to),
    );
  });

export const assignHostessToEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { event_id: string; hostess_id: string; as_substitute?: boolean }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // Duplicate protection: any active assignment already?
    const { data: existing } = await context.supabase
      .from("event_assignments")
      .select("id, status")
      .eq("event_id", data.event_id)
      .eq("hostess_profile_id", data.hostess_id)
      .maybeSingle();
    if (existing && !["odmietnutna", "zrusena"].includes(existing.status)) {
      throw new Error("Táto hosteska je už priradená k eventu.");
    }
    const status = data.as_substitute ? "nahradnicka" : "navrhnuta";
    let row: any;
    if (existing) {
      const { data: upd, error } = await context.supabase
        .from("event_assignments")
        .update({ status })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      row = upd;
    } else {
      const { data: ins, error } = await context.supabase
        .from("event_assignments")
        .insert({
          event_id: data.event_id,
          hostess_profile_id: data.hostess_id,
          status,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      row = ins;
    }
    await context.supabase.from("event_audit_log").insert({
      event_id: data.event_id,
      action: data.as_substitute ? "assignment_added_substitute" : "assignment_added",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { hostess_profile_id: data.hostess_id },
    });
    return row;
  });

export const updateAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("event_assignments")
      .update({ status: data.status as any })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: row.event_id,
      action: "assignment_status_changed",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { assignment_id: data.id, status: data.status },
    });
    return row;
  });

export const removeAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: existing } = await context.supabase
      .from("event_assignments")
      .select("event_id, hostess_profile_id")
      .eq("id", data.id)
      .single();
    const { error } = await context.supabase
      .from("event_assignments")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (existing) {
      await context.supabase.from("event_audit_log").insert({
        event_id: existing.event_id,
        action: "assignment_removed",
        actor_id: context.userId,
        actor_email: (context.claims as any)?.email ?? null,
        details: { hostess_profile_id: existing.hostess_profile_id },
      });
    }
    return { ok: true };
  });

// ---------- Notes ----------

export const listEventNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("event_notes")
      .select("*")
      .eq("event_id", data.event_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows || [];
  });

export const addEventNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string; note: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.note.trim()) throw new Error("Poznámka nemôže byť prázdna.");
    const { data: row, error } = await context.supabase
      .from("event_notes")
      .insert({
        event_id: data.event_id,
        note: data.note.trim(),
        created_by: context.userId,
        created_by_email: (context.claims as any)?.email ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEventNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("event_notes")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Audit ----------

export const listEventAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("event_audit_log")
      .select("*")
      .eq("event_id", data.event_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows || [];
  });

// ---------- Attendance ----------

function combineDateTime(date: string, time: string | null | undefined): string | null {
  if (!time) return null;
  // date: YYYY-MM-DD, time: HH:MM
  const iso = new Date(`${date}T${time}:00`);
  return isNaN(iso.getTime()) ? null : iso.toISOString();
}

function computeWorkedHours(
  arrival: string | null,
  departure: string | null,
  breakMinutes: number,
): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival).getTime();
  const d = new Date(departure).getTime();
  if (isNaN(a) || isNaN(d) || d <= a) return null;
  const minutes = (d - a) / 60000 - (breakMinutes || 0);
  if (minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

export const updateAssignmentAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      arrival_time?: string | null;
      departure_time?: string | null;
      break_minutes?: number;
      worked_hours?: number | null;
      attendance_status?: string;
      worker_note?: string | null;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, any> = {};
    if (data.arrival_time !== undefined) patch.arrival_time = data.arrival_time;
    if (data.departure_time !== undefined) patch.departure_time = data.departure_time;
    if (data.break_minutes !== undefined) patch.break_minutes = data.break_minutes;
    if (data.worked_hours !== undefined) patch.worked_hours = data.worked_hours;
    if (data.attendance_status !== undefined)
      patch.attendance_status = data.attendance_status;
    if (data.worker_note !== undefined) patch.worker_note = data.worker_note;

    const { data: row, error } = await context.supabase
      .from("event_assignments")
      .update(patch as any)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: row.event_id,
      action: "attendance_updated",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { assignment_id: data.id, patch },
    });
    return row;
  });

export const bulkUpdateAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      event_id: string;
      assignment_ids: string[];
      arrival_time?: string | null;
      departure_time?: string | null;
      attendance_status?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.assignment_ids.length) return { updated: 0 };
    const patch: Record<string, any> = {};
    if (data.arrival_time !== undefined) patch.arrival_time = data.arrival_time;
    if (data.departure_time !== undefined) patch.departure_time = data.departure_time;
    if (data.attendance_status !== undefined)
      patch.attendance_status = data.attendance_status;
    const { error } = await context.supabase
      .from("event_assignments")
      .update(patch as any)
      .in("id", data.assignment_ids);
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: data.event_id,
      action: "attendance_bulk_updated",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { count: data.assignment_ids.length, patch },
    });
    return { updated: data.assignment_ids.length };
  });

export { combineDateTime };

// ---------- Contract from assignment ----------

export const generateContractForAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      assignment_id: string;
      kind: string;
      event: {
        miesto_vykonu?: string;
        datum_od?: string;
        datum_do?: string;
        datum_podpisu?: string;
        hodinova_sadzba?: string;
        jednorazova_odmena?: string;
        rozsah_prace?: string;
        nazov_klienta?: string;
        poznamka?: string;
      };
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: assn, error: aErr } = await supabaseAdmin
      .from("event_assignments")
      .select("id, event_id, hostess_profile_id")
      .eq("id", data.assignment_id)
      .maybeSingle();
    if (aErr || !assn) throw new Error("Priradenie neexistuje.");

    const { data: tpl } = await supabaseAdmin
      .from("contract_templates")
      .select("*")
      .eq("contract_type", data.kind)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!tpl)
      throw new Error(
        "Pre tento typ zmluvy nie je nahraná žiadna aktívna šablóna. Nahrajte ju v /admin/contracts.",
      );

    const { data: h } = await supabaseAdmin
      .from("hostess_profiles")
      .select("*")
      .eq("id", assn.hostess_profile_id)
      .maybeSingle();
    if (!h) throw new Error("Profil hostesky neexistuje.");

    const { COMPANY } = await import("./contract-constants");

    const { data: file, error: dErr } = await supabaseAdmin.storage
      .from("contract-templates")
      .download(tpl.storage_path);
    if (dErr || !file) throw new Error("Nepodarilo sa načítať šablónu.");
    const ab = await file.arrayBuffer();

    const PizZip = (await import("pizzip")).default;
    const Docxtemplater = (await import("docxtemplater")).default;
    const zip = new PizZip(new Uint8Array(ab));
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
      nullGetter: () => "",
    });

    const fmtDate = (v?: string) => {
      if (!v) return "";
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString("sk-SK");
    };
    const fullName = `${h.first_name || ""} ${h.last_name || ""}`.trim();
    const podpis = fmtDate(data.event.datum_podpisu);
    const dnes = podpis || new Date().toLocaleDateString("sk-SK");
    const birth = h.birth_date
      ? new Date(h.birth_date).toLocaleDateString("sk-SK")
      : "";
    const adresa = [h.address, h.postal_code, h.city].filter(Boolean).join(", ");

    try {
      doc.render({
        meno: h.first_name || "",
        priezvisko: h.last_name || "",
        cele_meno: fullName,
        datum_narodenia: birth,
        rodne_cislo: h.national_id || "",
        adresa,
        cislo_op: h.identity_card_number || "",
        iban: h.iban || "",
        telefon: h.phone || "",
        email: h.email || "",
        statna_prislusnost: h.nationality || "",
        rodinny_stav: h.marital_status || "",
        miesto_narodenia: h.birth_place || "",
        datum_a_miesto_narodenia: [birth, h.birth_place].filter(Boolean).join(", "),
        zdravotna_poistovna: h.health_insurance || "",
        zdravotne_obmedzenia: h.health_restrictions || "Žiadne",
        poberatel_dochodku: h.pension_type || "",
        cislo_uctu: h.iban || "",
        trvaly_pobyt: adresa,
        rodne_priezvisko: h.last_name || "",
        dnes,
        datum_podpisu: podpis,
        spolocnost_nazov: COMPANY.nazov,
        spolocnost_sidlo: COMPANY.sidlo,
        spolocnost_ico: COMPANY.ico,
        spolocnost_dic: COMPANY.dic,
        spolocnost_ic_dph: COMPANY.ic_dph,
        spolocnost_iban: COMPANY.iban,
        spolocnost_banka: COMPANY.banka,
        spolocnost_telefon: COMPANY.telefon,
        spolocnost_email: COMPANY.email,
        spolocnost_register: COMPANY.register,
        spolocnost_zastupena: COMPANY.zastupena,
        miesto_vykonu: data.event.miesto_vykonu || "",
        datum_od: fmtDate(data.event.datum_od),
        datum_do: fmtDate(data.event.datum_do),
        hodinova_sadzba: data.event.hodinova_sadzba || "",
        jednorazova_odmena: data.event.jednorazova_odmena || "",
        rozsah_prace: data.event.rozsah_prace || "",
        nazov_klienta: data.event.nazov_klienta || "",
        poznamka: data.event.poznamka || "",
      });
    } catch (e: any) {
      throw new Error(
        "Chyba pri vypĺňaní šablóny: " + (e?.message || String(e)),
      );
    }
    const out: Uint8Array = doc
      .getZip()
      .generate({ type: "uint8array" }) as Uint8Array;

    const { data: existing } = await supabaseAdmin
      .from("generated_contracts")
      .select("version")
      .eq("hostess_id", assn.hostess_profile_id)
      .eq("contract_type", data.kind)
      .order("version", { ascending: false })
      .limit(1);
    const version = ((existing?.[0]?.version as number) || 0) + 1;

    const docxPath = `${assn.hostess_profile_id}/${data.kind}-v${version}-${Date.now()}.docx`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("generated-contracts")
      .upload(docxPath, out, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const email = userData?.user?.email || null;

    const { data: row, error: rErr } = await supabaseAdmin
      .from("generated_contracts")
      .insert({
        hostess_id: assn.hostess_profile_id,
        template_id: tpl.id,
        contract_type: data.kind,
        version,
        generated_by: context.userId,
        generated_by_email: email,
        docx_path: docxPath,
        event_id: assn.event_id,
        event_assignment_id: assn.id,
        event_data: data.event,
        hostess_snapshot: {
          first_name: h.first_name,
          last_name: h.last_name,
          birth_date: h.birth_date,
          national_id: h.national_id,
          address: adresa,
          identity_card_number: h.identity_card_number,
          iban: h.iban,
          phone: h.phone,
          email: h.email,
        },
      })
      .select("*")
      .single();
    if (rErr) throw new Error(rErr.message);

    await supabaseAdmin
      .from("event_assignments")
      .update({
        generated_contract_id: row.id,
        contract_required: true,
      })
      .eq("id", assn.id);

    await supabaseAdmin.from("event_audit_log").insert({
      event_id: assn.event_id,
      action: "contract_generated",
      actor_id: context.userId,
      actor_email: email,
      details: {
        assignment_id: assn.id,
        contract_id: row.id,
        kind: data.kind,
        version,
      },
    });

    return { id: row.id, version };
  });

export const listAssignmentContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { assignment_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: assn } = await context.supabase
      .from("event_assignments")
      .select("hostess_profile_id, event_id, generated_contract_id")
      .eq("id", data.assignment_id)
      .maybeSingle();
    if (!assn) return { current: null, history: [] };
    const { data: rows } = await context.supabase
      .from("generated_contracts")
      .select("*")
      .eq("hostess_id", assn.hostess_profile_id)
      .eq("event_id", assn.event_id)
      .order("version", { ascending: false });
    const history = rows || [];
    const current =
      history.find((r: any) => r.id === assn.generated_contract_id) ||
      history[0] ||
      null;
    return { current, history };
  });

export const setAssignmentContractSigned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; signed: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("event_assignments")
      .update({ contract_signed: data.signed })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("event_audit_log").insert({
      event_id: row.event_id,
      action: data.signed ? "contract_signed" : "contract_unsigned",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { assignment_id: data.id },
    });
    return row;
  });
