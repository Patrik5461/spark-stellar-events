import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Copy, ExternalLink } from "lucide-react";
import { listHostesses } from "@/lib/hostess.functions";
import { HOSTESS_STATUSES, statusLabel, contractLabel } from "@/lib/hostess-data";

export const Route = createFileRoute("/admin/hostesses/")({
  head: () => ({ meta: [{ title: "Hostesky — Admin" }, { name: "robots", content: "noindex" }] }),
  component: HostessesPage,
});

type Row = {
  id: string;
  application_code: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  contract_type: string;
  created_at: string;
};

function getFormUrl() {
  if (typeof window === "undefined") return "/hostess-form";
  return `${window.location.origin}/hostess-form`;
}

async function copyFormLink() {
  const url = getFormUrl();
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Odkaz skopírovaný");
  } catch {
    toast.error("Kopírovanie zlyhalo");
  }
}

function HostessesPage() {
  const list = useServerFn(listHostesses);
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      try { setRows((await list()) as Row[]); }
      catch (e: any) { toast.error(e?.message); }
      finally { setLoading(false); }
    })();
  }, [list]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (!qq) return true;
      return [r.first_name, r.last_name, r.email, r.phone, r.city, r.application_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(qq));
    });
  }, [rows, q, status]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-medium text-[#383B3A]">Hostesky</h1>
          <p className="text-sm text-[#726D6A] mt-1">Prijaté prihlášky.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/hostess-form"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#D9D2CC] px-4 py-2.5 text-sm hover:bg-[#EBE6E2]"
          >
            <ExternalLink className="h-4 w-4" /> Otvoriť formulár
          </a>
          <button
            onClick={copyFormLink}
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm"
          >
            <Copy className="h-4 w-4" /> Kopírovať odkaz na formulár
          </button>
        </div>
      </div>

      {!loading && rows.length === 0 ? (
        <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-10 text-center">
          <h2 className="text-lg font-medium text-[#383B3A] mb-2">Zatiaľ neprišli žiadne registrácie</h2>
          <p className="text-sm text-[#726D6A] mb-6">Pošlite hosteskám verejný odkaz na registračný formulár.</p>
          <button
            onClick={copyFormLink}
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm"
          >
            <Copy className="h-4 w-4" /> Kopírovať odkaz na formulár
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#726D6A]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hľadať meno, email, mesto, ID…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] px-3 py-2 text-sm"
            >
              <option value="">Všetky stavy</option>
              {HOSTESS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#EBE6E2] text-[#726D6A] text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Meno</th>
                  <th className="text-left px-4 py-3">Kontakt</th>
                  <th className="text-left px-4 py-3">Mesto</th>
                  <th className="text-left px-4 py-3">Zmluva</th>
                  <th className="text-left px-4 py-3">Stav</th>
                  <th className="text-left px-4 py-3">Prijaté</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-[#726D6A]">Načítavam…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-[#726D6A]">Žiadne výsledky.</td></tr>
                ) : filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate({ to: "/admin/hostesses/$id", params: { id: r.id } })}
                    className="border-t border-[#D9D2CC] hover:bg-[#EBE6E2] cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#383B3A]">{r.application_code}</td>
                    <td className="px-4 py-3 font-medium text-[#383B3A]">{r.first_name} {r.last_name}</td>
                    <td className="px-4 py-3 text-xs text-[#726D6A]">
                      {r.email && <div>{r.email}</div>}
                      {r.phone && <div>{r.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.city || "—"}</td>
                    <td className="px-4 py-3 text-xs">{contractLabel(r.contract_type)}</td>
                    <td className="px-4 py-3"><span className="inline-block rounded-full px-2 py-0.5 text-xs bg-[#EBE6E2]">{statusLabel(r.status)}</span></td>
                    <td className="px-4 py-3 text-xs text-[#726D6A]">{new Date(r.created_at).toLocaleDateString("sk-SK")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
