import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X, FileText, Download, RefreshCw, History, CheckCircle2 } from "lucide-react";
import {
  generateContractForAssignment,
  listAssignmentContracts,
  setAssignmentContractSigned,
  getEvent,
} from "@/lib/events.functions";
import { getGeneratedContractUrl } from "@/lib/contracts.functions";
import { CONTRACT_KINDS, type ContractKind } from "@/lib/hostess-data";

type Assignment = {
  id: string;
  event_id: string;
  hostess_profile_id: string;
  generated_contract_id: string | null;
  contract_signed: boolean;
  agreed_payment: number | null;
  payment_type: string | null;
  hostess?: { first_name: string; last_name: string } | null;
};

export function EventContractDialog({
  assignment,
  onClose,
  onChanged,
}: {
  assignment: Assignment;
  onClose: () => void;
  onChanged: () => void;
}) {
  const genFn = useServerFn(generateContractForAssignment);
  const listFn = useServerFn(listAssignmentContracts);
  const urlFn = useServerFn(getGeneratedContractUrl);
  const eventFn = useServerFn(getEvent);
  const signedFn = useServerFn(setAssignmentContractSigned);

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [kind, setKind] = useState<ContractKind>("prikazna_zmluva");
  const [event, setEvent] = useState({
    miesto_vykonu: "",
    datum_od: "",
    datum_do: "",
    datum_podpisu: "",
    hodinova_sadzba: "",
    jednorazova_odmena: "",
    rozsah_prace: "",
    nazov_klienta: "",
    poznamka: "",
  });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [contracts, ev]: any = await Promise.all([
        listFn({ data: { assignment_id: assignment.id } }),
        eventFn({ data: { id: assignment.event_id } }),
      ]);
      setCurrent(contracts.current);
      setHistory(contracts.history);
      // seed form from existing contract event_data or from event
      const seed = contracts.current?.event_data || {};
      setEvent({
        miesto_vykonu: seed.miesto_vykonu ?? ev.location ?? "",
        datum_od: seed.datum_od ?? ev.date_from ?? "",
        datum_do: seed.datum_do ?? ev.date_to ?? "",
        datum_podpisu: seed.datum_podpisu ?? "",
        hodinova_sadzba:
          seed.hodinova_sadzba ??
          (ev.payment_type === "za_hodinu" && ev.payment_amount != null
            ? String(ev.payment_amount)
            : ""),
        jednorazova_odmena:
          seed.jednorazova_odmena ??
          (ev.payment_type === "jednorazova" && ev.payment_amount != null
            ? String(ev.payment_amount)
            : assignment.agreed_payment != null
              ? String(assignment.agreed_payment)
              : ""),
        rozsah_prace: seed.rozsah_prace ?? ev.job_description ?? "",
        nazov_klienta: seed.nazov_klienta ?? "",
        poznamka: seed.poznamka ?? "",
      });
      if (contracts.current?.contract_type) {
        setKind(contracts.current.contract_type);
      }
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.id]);

  async function download(id: string) {
    try {
      const r: any = await urlFn({ data: { id } });
      if (r?.url) window.open(r.url, "_blank");
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri sťahovaní.");
    }
  }

  async function generate() {
    setBusy(true);
    try {
      await genFn({ data: { assignment_id: assignment.id, kind, event } });
      toast.success("Zmluva vygenerovaná.");
      onChanged();
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri generovaní.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSigned(v: boolean) {
    try {
      await signedFn({ data: { id: assignment.id, signed: v } });
      onChanged();
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  const name = assignment.hostess
    ? `${assignment.hostess.first_name} ${assignment.hostess.last_name}`
    : "hosteska";

  const hasContract = !!current;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-[#F5F1EC] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D9D2CC] sticky top-0 bg-[#F5F1EC]">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#726D6A]">
              Zmluva
            </div>
            <h2 className="text-lg font-medium">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#EBE6E2] text-[#726D6A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="text-sm text-[#726D6A]">Načítavam…</div>
          ) : (
            <>
              {hasContract && (
                <div className="rounded-xl border border-[#D9D2CC] bg-white p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {CONTRACT_KINDS.find((k) => k.value === current.contract_type)?.label ||
                          current.contract_type}{" "}
                        · v{current.version}
                      </div>
                      <div className="text-xs text-[#726D6A]">
                        Vygenerované{" "}
                        {new Date(current.created_at).toLocaleString("sk-SK")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => download(current.id)}
                        className="inline-flex items-center gap-1 text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5 hover:bg-[#F5F1EC]"
                      >
                        <Download className="h-4 w-4" /> Stiahnuť DOCX
                      </button>
                      <button
                        onClick={() => setShowHistory((v) => !v)}
                        className="inline-flex items-center gap-1 text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5 hover:bg-[#F5F1EC]"
                      >
                        <History className="h-4 w-4" /> Verzie ({history.length})
                      </button>
                    </div>
                  </div>

                  <label className="mt-3 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assignment.contract_signed}
                      onChange={(e) => toggleSigned(e.target.checked)}
                    />
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    Zmluva podpísaná
                  </label>

                  {showHistory && (
                    <div className="mt-4 border-t border-[#D9D2CC] pt-3 space-y-1">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <span>
                            v{h.version} ·{" "}
                            {new Date(h.created_at).toLocaleString("sk-SK")}
                            {h.id === current.id && (
                              <span className="ml-2 text-xs text-emerald-700">
                                (aktuálna)
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => download(h.id)}
                            className="text-xs inline-flex items-center gap-1 text-[#383B3A] hover:underline"
                          >
                            <Download className="h-3 w-3" /> DOCX
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#D9D2CC] bg-white p-4 space-y-3">
                <h3 className="text-sm uppercase tracking-wider text-[#726D6A]">
                  {hasContract ? "Regenerovať" : "Generovať zmluvu"}
                </h3>

                <label className="block text-sm">
                  <span className="block text-xs text-[#726D6A] mb-1">
                    Typ zmluvy
                  </span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ContractKind)}
                    className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
                  >
                    {CONTRACT_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field
                    label="Miesto výkonu"
                    value={event.miesto_vykonu}
                    onChange={(v) => setEvent({ ...event, miesto_vykonu: v })}
                  />
                  <Field
                    label="Klient"
                    value={event.nazov_klienta}
                    onChange={(v) => setEvent({ ...event, nazov_klienta: v })}
                  />
                  <Field
                    label="Dátum od"
                    type="date"
                    value={event.datum_od}
                    onChange={(v) => setEvent({ ...event, datum_od: v })}
                  />
                  <Field
                    label="Dátum do"
                    type="date"
                    value={event.datum_do}
                    onChange={(v) => setEvent({ ...event, datum_do: v })}
                  />
                  <Field
                    label="Dátum podpisu"
                    type="date"
                    value={event.datum_podpisu}
                    onChange={(v) => setEvent({ ...event, datum_podpisu: v })}
                  />
                  <Field
                    label="Hodinová sadzba"
                    value={event.hodinova_sadzba}
                    onChange={(v) => setEvent({ ...event, hodinova_sadzba: v })}
                  />
                  <Field
                    label="Jednorazová odmena"
                    value={event.jednorazova_odmena}
                    onChange={(v) =>
                      setEvent({ ...event, jednorazova_odmena: v })
                    }
                  />
                </div>
                <TextArea
                  label="Popis / rozsah práce"
                  value={event.rozsah_prace}
                  onChange={(v) => setEvent({ ...event, rozsah_prace: v })}
                />
                <TextArea
                  label="Poznámka"
                  value={event.poznamka}
                  onChange={(v) => setEvent({ ...event, poznamka: v })}
                />

                <div className="flex justify-end">
                  <button
                    onClick={generate}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
                  >
                    {hasContract ? (
                      <>
                        <RefreshCw className="h-4 w-4" /> Regenerovať (nová verzia)
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" /> Generovať zmluvu
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
      />
    </label>
  );
}
