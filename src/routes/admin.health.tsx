import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { APP_VERSION } from "@/lib/admin-auth";
import { getEventsHealthSnapshot } from "@/lib/dashboard.functions";

type Status = "healthy" | "warning" | "error";
type Check = { label: string; status: Status; detail?: string };

export const Route = createFileRoute("/admin/health")({
  component: HealthPage,
});

function HealthPage() {
  const eventsHealthFn = useServerFn(getEventsHealthSnapshot);
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);


  const run = async () => {
    setRunning(true);
    const results: Check[] = [];

    // Supabase connection + auth
    try {
      const { data: session } = await supabase.auth.getSession();
      results.push({
        label: "Supabase Auth",
        status: session.session ? "healthy" : "warning",
        detail: session.session ? `Session aktívna (${session.session.user.email})` : "Bez aktívnej session",
      });
    } catch (e) {
      results.push({ label: "Supabase Auth", status: "error", detail: (e as Error).message });
    }

    // DB — settings
    try {
      const { error } = await supabase.from("site_settings").select("id").limit(1);
      results.push({ label: "Databáza", status: error ? "error" : "healthy", detail: error?.message ?? "Pripojenie OK" });
    } catch (e) {
      results.push({ label: "Databáza", status: "error", detail: (e as Error).message });
    }

    // Storage
    try {
      const { data, error } = await supabase.storage.from("gallery").list("", { limit: 1 });
      results.push({
        label: "Storage bucket 'gallery'",
        status: error ? "error" : "healthy",
        detail: error?.message ?? `Prístup OK (${data?.length ?? 0} položiek)`,
      });
    } catch (e) {
      results.push({ label: "Storage bucket 'gallery'", status: "error", detail: (e as Error).message });
    }

    // Counts
    try {
      const [{ count: active }, { count: hidden }, { count: featured }] = await Promise.all([
        supabase.from("gallery_images").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("gallery_images").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("gallery_images").select("id", { count: "exact", head: true }).eq("featured_on_homepage", true).eq("is_active", true),
      ]);
      results.push({ label: "Aktívne fotografie", status: "healthy", detail: `${active ?? 0}` });
      results.push({ label: "Skryté fotografie", status: "healthy", detail: `${hidden ?? 0}` });
      results.push({ label: "Featured na homepage", status: (featured ?? 0) === 0 ? "warning" : "healthy", detail: `${featured ?? 0}` });
    } catch (e) {
      results.push({ label: "Fotografie – počty", status: "error", detail: (e as Error).message });
    }

    // Messages
    try {
      const { count } = await supabase.from("contact_messages").select("id", { count: "exact", head: true });
      const { data: last } = await supabase.from("contact_messages").select("created_at").order("created_at", { ascending: false }).limit(1);
      results.push({ label: "Prijaté správy", status: "healthy", detail: `${count ?? 0}` });
      results.push({
        label: "Posledná správa",
        status: last?.length ? "healthy" : "warning",
        detail: last?.length ? new Date(last[0].created_at).toLocaleString("sk-SK") : "Zatiaľ žiadna",
      });
    } catch (e) {
      results.push({ label: "Prijaté správy", status: "error", detail: (e as Error).message });
    }

    // Hostess profiles (admin select)
    try {
      const { count, error } = await supabase.from("hostess_profiles").select("id", { count: "exact", head: true });
      results.push({
        label: "Hostess profiles – admin select",
        status: error ? "error" : "healthy",
        detail: error?.message ?? `${count ?? 0} prihlášok`,
      });
    } catch (e) {
      results.push({ label: "Hostess profiles – admin select", status: "error", detail: (e as Error).message });
    }

    // Hostess photos storage bucket
    try {
      const { data, error } = await supabase.storage.from("hostess-photos").list("", { limit: 1 });
      results.push({
        label: "Storage bucket 'hostess-photos'",
        status: error ? "error" : "healthy",
        detail: error?.message ?? `Prístup OK (${data?.length ?? 0} položiek)`,
      });
    } catch (e) {
      results.push({ label: "Storage bucket 'hostess-photos'", status: "error", detail: (e as Error).message });
    }

    // Contract templates
    try {
      const { count, error } = await supabase.from("contract_templates").select("id", { count: "exact", head: true });
      results.push({
        label: "Šablóny zmlúv",
        status: error ? "error" : "healthy",
        detail: error?.message ?? `${count ?? 0} šablón`,
      });
    } catch (e) {
      results.push({ label: "Šablóny zmlúv", status: "error", detail: (e as Error).message });
    }

    // Public hostess form availability
    try {
      const r = await fetch("/hostess-form", { method: "GET", redirect: "follow" });
      results.push({
        label: "Verejný formulár /hostess-form",
        status: r.ok ? "healthy" : "error",
        detail: r.ok ? `HTTP ${r.status}` : `HTTP ${r.status}`,
      });
    } catch (e) {
      results.push({ label: "Verejný formulár /hostess-form", status: "error", detail: (e as Error).message });
    }

    // Env
    const env = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    results.push({ label: "Prostredie (env)", status: env ? "healthy" : "error", detail: env ? "VITE_SUPABASE_* nastavené" : "Chýba VITE_SUPABASE_*" });

    // App version
    results.push({ label: "Verzia aplikácie", status: "healthy", detail: APP_VERSION });

    setChecks(results);
    setRanAt(new Date());
    setRunning(false);

    // Log run (best-effort)
    const worst: Status = results.some((r) => r.status === "error") ? "error" : results.some((r) => r.status === "warning") ? "warning" : "healthy";
    await supabase.from("health_logs").insert({ event: "manual_check", status: worst, details: results });
  };

  useEffect(() => { run(); }, []);

  const [logs, setLogs] = useState<{ event: string; status: string; created_at: string }[]>([]);
  useEffect(() => {
    if (!ranAt) return;
    supabase.from("health_logs").select("event,status,created_at").order("created_at", { ascending: false }).limit(10)
      .then(({ data }: { data: { event: string; status: string; created_at: string }[] | null }) => setLogs(data ?? []));
  }, [ranAt]);

  const StatusIcon = ({ s }: { s: Status }) => {
    if (s === "healthy") return <CheckCircle2 className="h-5 w-5 text-emerald-700" />;
    if (s === "warning") return <AlertTriangle className="h-5 w-5 text-amber-700" />;
    return <XCircle className="h-5 w-5 text-red-700" />;
  };

  return (
    <section>
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Systém</div>
          <h1 className="font-display text-4xl">Stav systému</h1>
          {ranAt && <div className="text-sm text-[#726D6A] mt-1">Posledná kontrola: {ranAt.toLocaleString("sk-SK")}</div>}
        </div>
        <button onClick={run} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-3 text-sm disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} /> Skontrolovať systém
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        {checks.map((c, i) => (
          <div key={i} className="rounded-2xl bg-[#F5F1EC] border border-[#D9D2CC] p-5 flex items-start gap-3">
            <StatusIcon s={c.status} />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{c.label}</div>
              <div className="text-sm text-[#726D6A] mt-0.5 break-words">{c.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-2xl mb-4">História kontrol</h2>
          <ul className="text-sm space-y-1 text-[#726D6A]">
            {logs.map((l, i) => (
              <li key={i}>{new Date(l.created_at).toLocaleString("sk-SK")} · {l.event} · {l.status}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
