import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { listContractTemplates } from "@/lib/hostess.functions";
import { contractLabel } from "@/lib/hostess-data";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({ meta: [{ title: "Zmluvy — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ContractsPage,
});

function ContractsPage() {
  const list = useServerFn(listContractTemplates);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setRows((await list()) as any[]); }
      catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [list]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-medium text-[#383B3A] mb-2">Šablóny zmlúv</h1>
      <p className="text-sm text-[#726D6A] mb-6">
        Sekcia pripravená pre nahranie šablón zmlúv (DOCX alebo PDF), mapovanie premenných na údaje hostesky, generovanie a označenie ako podpísané.
      </p>

      <div className="rounded-xl border border-dashed border-[#D9D2CC] bg-[#F5F1EC] p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-[#726D6A] mb-3" strokeWidth={1.5} />
        <h2 className="text-lg font-medium text-[#383B3A] mb-2">Zatiaľ neaktívne</h2>
        <p className="text-sm text-[#726D6A] max-w-md mx-auto">
          Nahranie šablón (Príkazná zmluva, Dohoda o vykonaní práce) a generovanie dokumentov sa doplní po dodaní finálnych šablón. Údaje z formulárov sú už uložené v štruktúrovanej podobe a dajú sa neskôr vložiť do šablón.
        </p>
      </div>

      {!loading && rows.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm uppercase tracking-wider text-[#726D6A] mb-3">Nahrané šablóny</h2>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border border-[#D9D2CC] bg-[#F5F1EC] px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-[#383B3A]">{r.name}</div>
                  <div className="text-xs text-[#726D6A]">{contractLabel(r.contract_type)}</div>
                </div>
                <span className={`text-xs ${r.is_active ? "text-emerald-700" : "text-[#726D6A]"}`}>{r.is_active ? "Aktívna" : "Neaktívna"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
