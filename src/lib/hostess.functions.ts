import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ContractType, HostessStatus, PhotoType, ConsentType } from "./hostess-data";

const BUCKET = "hostess-photos";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

function getClientIp(): string | null {
  try {
    const req = getRequest();
    return (
      req?.headers.get("cf-connecting-ip") ||
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null
    );
  } catch {
    return null;
  }
}

// ---------- public: submit application ----------
type PhotoPayload = { type: PhotoType; base64: string; filename: string; mime: string; size: number };
type ProfileFields = {
  first_name: string;
  last_name: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  national_id?: string;
  identity_card_number?: string;
  iban?: string;
  nationality?: string;
  height?: string;
  clothing_size?: string;
  shoe_size?: string;
  hair_color?: string;
  languages?: string;
  experience?: string;
  availability?: string;
  note?: string;
  contract_type: ContractType;
};

export const submitHostessApplication = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      profile: ProfileFields;
      photos: PhotoPayload[];
      consents: { type: ConsentType; accepted: boolean }[];
    }) => d,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // validate required fields
    if (!data.profile.first_name?.trim() || !data.profile.last_name?.trim())
      throw new Error("Meno a priezvisko sú povinné.");
    const requiredConsents: ConsentType[] = [
      "osobne_udaje",
      "pravdivost",
      "fotografie",
      "elektronicke_dokumenty",
    ];
    for (const c of requiredConsents) {
      const ok = data.consents.find((x) => x.type === c)?.accepted;
      if (!ok) throw new Error("Musíte potvrdiť všetky súhlasy.");
    }
    const requiredPhotos: PhotoType[] = ["portret", "cela_postava", "profil"];
    for (const p of requiredPhotos) {
      if (!data.photos.find((x) => x.type === p))
        throw new Error("Chýbajú povinné fotografie.");
    }

    // create profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("hostess_profiles")
      .insert({
        first_name: data.profile.first_name.trim(),
        last_name: data.profile.last_name.trim(),
        birth_date: data.profile.birth_date || null,
        phone: data.profile.phone || null,
        email: data.profile.email || null,
        address: data.profile.address || null,
        city: data.profile.city || null,
        postal_code: data.profile.postal_code || null,
        national_id: data.profile.national_id || null,
        identity_card_number: data.profile.identity_card_number || null,
        iban: data.profile.iban || null,
        nationality: data.profile.nationality || null,
        height: data.profile.height || null,
        clothing_size: data.profile.clothing_size || null,
        shoe_size: data.profile.shoe_size || null,
        hair_color: data.profile.hair_color || null,
        languages: data.profile.languages || null,
        experience: data.profile.experience || null,
        availability: data.profile.availability || null,
        note: data.profile.note || null,
        contract_type: data.profile.contract_type,
      })
      .select("id, application_code")
      .single();
    if (pErr || !profile) throw new Error(pErr?.message || "Nepodarilo sa uložiť profil.");

    // upload photos
    try {
      for (const photo of data.photos) {
        const buffer = Buffer.from(photo.base64, "base64");
        const ext =
          (photo.filename.match(/\.(\w{2,5})$/)?.[1] || "jpg").toLowerCase();
        const path = `${profile.id}/${photo.type}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, buffer, {
            contentType: photo.mime || "application/octet-stream",
            upsert: false,
          });
        if (upErr) throw upErr;
        await supabaseAdmin.from("hostess_photos").insert({
          hostess_profile_id: profile.id,
          photo_type: photo.type,
          storage_path: path,
          original_filename: photo.filename,
          mime_type: photo.mime,
          file_size: photo.size,
        });
      }
    } catch (err) {
      // rollback profile
      await supabaseAdmin.from("hostess_profiles").delete().eq("id", profile.id);
      throw err;
    }

    // consents
    const ip = getClientIp();
    const now = new Date().toISOString();
    await supabaseAdmin.from("hostess_consents").insert(
      data.consents.map((c) => ({
        hostess_profile_id: profile.id,
        consent_type: c.type,
        accepted: c.accepted,
        accepted_at: c.accepted ? now : null,
        ip_address: ip,
      })),
    );

    return { applicationCode: profile.application_code, profileId: profile.id };
  });

// ---------- admin: hostesses ----------
export const listHostesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("hostess_profiles")
      .select("id, application_code, first_name, last_name, email, phone, city, status, contract_type, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getHostess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profile, error } = await context.supabase
      .from("hostess_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Profil neexistuje.");
    const { data: photos } = await context.supabase
      .from("hostess_photos")
      .select("*")
      .eq("hostess_profile_id", data.id)
      .order("created_at");
    const { data: consents } = await context.supabase
      .from("hostess_consents")
      .select("*")
      .eq("hostess_profile_id", data.id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const signed = await Promise.all(
      (photos || []).map(async (p: any) => {
        const { data: s } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(p.storage_path, 60 * 10);
        return { ...p, signed_url: s?.signedUrl || null };
      }),
    );
    return { profile, photos: signed, consents: consents || [] };
  });

export const updateHostess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      patch: Partial<ProfileFields> & {
        status?: HostessStatus;
        internal_note?: string;
      };
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("hostess_profiles")
      .update(data.patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("hostess_admin_log").insert({
      admin_id: context.userId,
      action: "hostess.update",
      target_type: "hostess_profile",
      target_id: data.id,
      meta: data.patch as any,
    });
    return { ok: true };
  });

export const deleteHostess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: photos } = await supabaseAdmin
      .from("hostess_photos")
      .select("storage_path")
      .eq("hostess_profile_id", data.id);
    if (photos && photos.length) {
      await supabaseAdmin.storage.from(BUCKET).remove(photos.map((p: any) => p.storage_path));
    }
    const { error } = await supabaseAdmin.from("hostess_profiles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("hostess_admin_log").insert({
      admin_id: context.userId,
      action: "hostess.delete",
      target_type: "hostess_profile",
      target_id: data.id,
    });
    return { ok: true };
  });

// ---------- admin: contract templates (placeholder) ----------
export const listContractTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("contract_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });
