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
