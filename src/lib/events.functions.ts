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
      .in("status", ACTIVE_ASSIGNMENT_STATUSES as unknown as string[]);
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
