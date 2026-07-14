import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const DOCUMENT_TYPES = [
  "brief",
  "instructions",
  "contract",
  "attendance",
  "invoicing",
  "photos",
  "other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  brief: "Brief klienta",
  instructions: "Pokyny pre pracovníkov",
  contract: "Zmluva",
  attendance: "Dochádzka",
  invoicing: "Fakturácia",
  photos: "Fotografie",
  other: "Ostatné",
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

export const listEventDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const [{ data: docs, error: dErr }, { data: contracts, error: cErr }] =
      await Promise.all([
        context.supabase
          .from("event_documents")
          .select("*")
          .eq("event_id", data.event_id)
          .order("created_at", { ascending: false }),
        context.supabase
          .from("generated_contracts")
          .select(
            "id, contract_type, version, docx_path, created_at, generated_by_email, hostess_id, event_assignment_id",
          )
          .eq("event_id", data.event_id)
          .order("created_at", { ascending: false }),
      ]);
    if (dErr) throw new Error(dErr.message);
    if (cErr) throw new Error(cErr.message);

    // Enrich contracts with hostess name
    const hostessIds = Array.from(
      new Set(((contracts as any[]) || []).map((c) => c.hostess_id).filter(Boolean)),
    );
    let hmap: Record<string, any> = {};
    if (hostessIds.length) {
      const { data: hs } = await context.supabase
        .from("hostess_profiles")
        .select("id, first_name, last_name")
        .in("id", hostessIds as string[]);
      hmap = Object.fromEntries((hs || []).map((h: any) => [h.id, h]));
    }

    return {
      documents: docs || [],
      contracts: ((contracts as any[]) || []).map((c) => ({
        ...c,
        hostess: hmap[c.hostess_id] || null,
      })),
    };
  });

export const uploadEventDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      event_id: string;
      title: string;
      document_type: string;
      internal_note?: string | null;
      file_name: string;
      mime_type: string;
      content_base64: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.title?.trim()) throw new Error("Názov dokumentu je povinný.");
    if (!(DOCUMENT_TYPES as readonly string[]).includes(data.document_type))
      throw new Error("Neplatný typ dokumentu.");
    if (!ALLOWED_MIME.has(data.mime_type))
      throw new Error("Nepovolený typ súboru.");
    const bytes = b64ToBytes(data.content_base64);
    if (bytes.length === 0) throw new Error("Prázdny súbor.");
    if (bytes.length > MAX_BYTES)
      throw new Error(`Súbor je väčší ako ${MAX_BYTES / 1024 / 1024} MB.`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safe = data.file_name.replace(/[^\w.\-]/g, "_");
    const path = `${data.event_id}/${Date.now()}-${safe}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("event-documents")
      .upload(path, bytes, { contentType: data.mime_type, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: row, error } = await supabaseAdmin
      .from("event_documents")
      .insert({
        event_id: data.event_id,
        title: data.title.trim(),
        document_type: data.document_type,
        internal_note: data.internal_note || null,
        file_name: data.file_name,
        mime_type: data.mime_type,
        file_size: bytes.length,
        storage_path: path,
        uploaded_by: context.userId,
      } as any)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("event_audit_log").insert({
      event_id: data.event_id,
      action: "document_uploaded",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { document_id: row.id, title: row.title, type: row.document_type },
    });
    return row;
  });

export const updateEventDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      title?: string;
      document_type?: string;
      internal_note?: string | null;
      file_name?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, any> = {};
    if (data.title !== undefined) {
      if (!data.title.trim()) throw new Error("Názov nemôže byť prázdny.");
      patch.title = data.title.trim();
    }
    if (data.document_type !== undefined) {
      if (!(DOCUMENT_TYPES as readonly string[]).includes(data.document_type))
        throw new Error("Neplatný typ dokumentu.");
      patch.document_type = data.document_type;
    }
    if (data.internal_note !== undefined)
      patch.internal_note = data.internal_note || null;
    if (data.file_name !== undefined && data.file_name.trim())
      patch.file_name = data.file_name.trim();

    const { data: row, error } = await context.supabase
      .from("event_documents")
      .update(patch as any)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("event_audit_log").insert({
      event_id: row.event_id,
      action: "document_updated",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { document_id: row.id, patch },
    });
    return row;
  });

export const deleteEventDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc } = await supabaseAdmin
      .from("event_documents")
      .select("id, event_id, storage_path, title, generated_contract_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Dokument neexistuje.");
    if (doc.generated_contract_id) {
      throw new Error(
        "Tento záznam patrí vygenerovanej zmluve. Zmluvu spravujte v priradení pracovníčky.",
      );
    }

    // Best-effort delete from storage
    await supabaseAdmin.storage.from("event-documents").remove([doc.storage_path]);
    const { error } = await supabaseAdmin
      .from("event_documents")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("event_audit_log").insert({
      event_id: doc.event_id,
      action: "document_deleted",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { document_id: doc.id, title: doc.title },
    });
    return { ok: true };
  });

export const downloadEventDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc } = await supabaseAdmin
      .from("event_documents")
      .select("event_id, storage_path, file_name, mime_type, title")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Dokument neexistuje.");
    const { data: file, error } = await supabaseAdmin.storage
      .from("event-documents")
      .download(doc.storage_path);
    if (error || !file) throw new Error(error?.message || "Chyba pri sťahovaní.");
    const ab = await file.arrayBuffer();
    await supabaseAdmin.from("event_audit_log").insert({
      event_id: doc.event_id,
      action: "document_downloaded",
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      details: { document_id: data.id, title: doc.title },
    });
    return {
      base64: bytesToB64(new Uint8Array(ab)),
      file_name: doc.file_name,
      mime_type: doc.mime_type || "application/octet-stream",
    };
  });

export const downloadGeneratedContractDocx = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contract_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c } = await supabaseAdmin
      .from("generated_contracts")
      .select("id, docx_path, contract_type, version, event_id")
      .eq("id", data.contract_id)
      .maybeSingle();
    if (!c) throw new Error("Zmluva neexistuje.");
    const { data: file, error } = await supabaseAdmin.storage
      .from("generated-contracts")
      .download(c.docx_path);
    if (error || !file) throw new Error(error?.message || "Chyba pri sťahovaní.");
    const ab = await file.arrayBuffer();
    if (c.event_id) {
      await supabaseAdmin.from("event_audit_log").insert({
        event_id: c.event_id,
        action: "document_downloaded",
        actor_id: context.userId,
        actor_email: (context.claims as any)?.email ?? null,
        details: { contract_id: c.id, kind: "generated_contract" },
      });
    }
    const name = `${c.contract_type}-v${c.version}.docx`;
    return {
      base64: bytesToB64(new Uint8Array(ab)),
      file_name: name,
      mime_type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  });
