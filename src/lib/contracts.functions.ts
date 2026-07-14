import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COMPANY } from "./contract-constants";
import type { ContractKind } from "./hostess-data";

const TEMPLATES_BUCKET = "contract-templates";
const CONTRACTS_BUCKET = "generated-contracts";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

// ---------- Templates ----------

export const uploadContractTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      kind: ContractKind;
      name: string;
      filename: string;
      base64: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const buf = Buffer.from(data.base64, "base64");
    const path = `${data.kind}/${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(TEMPLATES_BUCKET)
      .upload(path, buf, { contentType: DOCX_MIME, upsert: false });
    if (upErr) throw new Error(upErr.message);
    // deactivate previous templates of same kind
    await supabaseAdmin
      .from("contract_templates")
      .update({ is_active: false })
      .eq("contract_type", data.kind);
    const { error: insErr } = await supabaseAdmin
      .from("contract_templates")
      .insert({
        name: data.name || data.filename,
        contract_type: data.kind,
        storage_path: path,
        original_filename: data.filename,
        mime_type: DOCX_MIME,
        placeholder_mapping: {},
        is_active: true,
        created_by: context.userId,
      });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

export const deleteContractTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: t } = await supabaseAdmin
      .from("contract_templates")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (t?.storage_path)
      await supabaseAdmin.storage
        .from(TEMPLATES_BUCKET)
        .remove([t.storage_path]);
    await supabaseAdmin.from("contract_templates").delete().eq("id", data.id);
    return { ok: true };
  });

export const getTemplateDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: t } = await supabaseAdmin
      .from("contract_templates")
      .select("storage_path, original_filename")
      .eq("id", data.id)
      .maybeSingle();
    if (!t) throw new Error("Šablóna neexistuje.");
    const { data: s } = await supabaseAdmin.storage
      .from(TEMPLATES_BUCKET)
      .createSignedUrl(t.storage_path, 600);
    return { url: s?.signedUrl || null, filename: t.original_filename };
  });

// ---------- Generation ----------

type EventFields = {
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

function fmtDate(v?: string): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("sk-SK");
}

function buildPayload(h: any, event: EventFields) {
  const fullName = `${h.first_name || ""} ${h.last_name || ""}`.trim();
  const podpis = fmtDate(event.datum_podpisu);
  const dnes = podpis || new Date().toLocaleDateString("sk-SK");
  const birth = h.birth_date
    ? new Date(h.birth_date).toLocaleDateString("sk-SK")
    : "";
  const adresa = [h.address, h.postal_code, h.city].filter(Boolean).join(", ");
  return {
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
    miesto_vykonu: event.miesto_vykonu || "",
    datum_od: fmtDate(event.datum_od),
    datum_do: fmtDate(event.datum_do),
    hodinova_sadzba: event.hodinova_sadzba || "",
    jednorazova_odmena: event.jednorazova_odmena || "",
    rozsah_prace: event.rozsah_prace || "",
    nazov_klienta: event.nazov_klienta || "",
    poznamka: event.poznamka || "",
  };
}

// Preview: render the DOCX in memory, return base64 to browser (no DB writes).
export const previewContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { hostess_id: string; kind: ContractKind; event: EventFields }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
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
      .eq("id", data.hostess_id)
      .maybeSingle();
    if (!h) throw new Error("Profil neexistuje.");

    const { data: file, error: dErr } = await supabaseAdmin.storage
      .from(TEMPLATES_BUCKET)
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
    try {
      doc.render(buildPayload(h, data.event));
    } catch (e: any) {
      throw new Error(
        "Chyba pri vypĺňaní šablóny: " + (e?.message || String(e)),
      );
    }
    const out: Uint8Array = doc
      .getZip()
      .generate({ type: "uint8array" }) as Uint8Array;
    const b64 = Buffer.from(out).toString("base64");
    return { base64: b64, filename: `${data.kind}-preview.docx` };
  });



// Confirm: same rendering, uploads to storage and stores history row.
export const generateContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      hostess_id: string;
      kind: ContractKind;
      event: EventFields;
      regenerate_of?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

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
        "Pre tento typ zmluvy nie je nahraná žiadna aktívna šablóna.",
      );

    const { data: h } = await supabaseAdmin
      .from("hostess_profiles")
      .select("*")
      .eq("id", data.hostess_id)
      .maybeSingle();
    if (!h) throw new Error("Profil neexistuje.");

    const { data: file, error: dErr } = await supabaseAdmin.storage
      .from(TEMPLATES_BUCKET)
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
    try {
      doc.render(buildPayload(h, data.event));
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
      .eq("hostess_id", data.hostess_id)
      .eq("contract_type", data.kind)
      .order("version", { ascending: false })
      .limit(1);
    const version = ((existing?.[0]?.version as number) || 0) + 1;

    const docxPath = `${data.hostess_id}/${data.kind}-v${version}-${Date.now()}.docx`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .upload(docxPath, out, { contentType: DOCX_MIME, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const email = userData?.user?.email || null;

    const adresa = [h.address, h.postal_code, h.city]
      .filter(Boolean)
      .join(", ");
    const { data: row, error: rErr } = await supabaseAdmin
      .from("generated_contracts")
      .insert({
        hostess_id: data.hostess_id,
        template_id: tpl.id,
        contract_type: data.kind,
        version,
        generated_by: context.userId,
        generated_by_email: email,
        docx_path: docxPath,
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

    return { id: row.id, version };
  });

export const listGeneratedContracts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hostess_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("generated_contracts")
      .select("*")
      .eq("hostess_id", data.hostess_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows || [];
  });

export const getGeneratedContractUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: r } = await supabaseAdmin
      .from("generated_contracts")
      .select("docx_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!r) throw new Error("Zmluva neexistuje.");
    const { data: s } = await supabaseAdmin.storage
      .from(CONTRACTS_BUCKET)
      .createSignedUrl(r.docx_path, 600);
    return { url: s?.signedUrl || null };
  });

export const deleteGeneratedContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: r } = await supabaseAdmin
      .from("generated_contracts")
      .select("docx_path")
      .eq("id", data.id)
      .maybeSingle();
    if (r?.docx_path)
      await supabaseAdmin.storage.from(CONTRACTS_BUCKET).remove([r.docx_path]);
    await supabaseAdmin.from("generated_contracts").delete().eq("id", data.id);
    return { ok: true };
  });
