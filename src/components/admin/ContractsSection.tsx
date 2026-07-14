import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileSignature, Download, Trash2, RefreshCw, X } from "lucide-react";
import {
  previewContract,
  generateContract,
  listGeneratedContracts,
  getGeneratedContractUrl,
  deleteGeneratedContract,
} from "@/lib/contracts.functions";
import { CONTRACT_KINDS, contractKindLabel, type ContractKind } from "@/lib/hostess-data";

type EventFields = {
  miesto_vykonu: string;
  datum_od: string;
  datum_do: string;
  datum_podpisu: string;
  hodinova_sadzba: string;
  jednorazova_odmena: string;
  rozsah_prace: string;
  nazov_klienta: string;
  poznamka: string;
};
const EMPTY_EVENT: EventFields = {
  miesto_vykonu: "",
  datum_od: "",
  datum_do: "",
  datum_podpisu: "",
  hodinova_sadzba: "",
  jednorazova_odmena: "",
  rozsah_prace: "",
  nazov_klienta: "",
  poznamka: "",
};

export function ContractsSection({ hostessId }: { hostessId: string }) {
  const list = useServerFn(listGeneratedContracts);
  const preview = useServerFn(previewContract);
  const generate = useServerFn(generateContract);
  const getUrl = useServerFn(getGeneratedContractUrl);
  const del = useServerFn(deleteGeneratedContract);

  const [rows, setRows] = useState<any[]>([]);
  const [modalKind, setModalKind] = useState<ContractKind | null>(null);
  const [event, setEvent] = useState<EventFields>(EMPTY_EVENT);
  const [previewB64, setPreviewB64] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);


  async function refresh() {
    try {
      setRows((await list({ data: { hostess_id: hostessId } })) as any[]);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní zmlúv.");
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostessId]);

  function openModal(kind: ContractKind, seedEvent?: EventFields) {
    setModalKind(kind);
    setEvent(seedEvent || EMPTY_EVENT);
    setPreviewB64(null);
    setPreviewHtml(null);
  }
  function closeModal() {
    setModalKind(null);
    setPreviewB64(null);
    setPreviewHtml(null);
    setEvent(EMPTY_EVENT);
  }

  async function doPreview() {
    if (!modalKind) return;
    setBusy(true);
    try {
      const r = (await preview({
        data: { hostess_id: hostessId, kind: modalKind, event },
      })) as { base64: string; html?: string; filename: string };
      setPreviewB64(r.base64);
      setPreviewHtml(r.html || "");
      toast.success("Náhľad pripravený — skontrolujte a potvrďte.");

    } catch (e: any) {
      toast.error(e?.message || "Náhľad zlyhal.");
    } finally {
      setBusy(false);
    }
  }

  function downloadPreview() {
    if (!previewB64 || !modalKind) return;
    downloadBase64(
      previewB64,
      `${modalKind}-nahlad.docx`,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  }

  async function doGenerate() {
    if (!modalKind) return;
    setBusy(true);
    try {
      await generate({
        data: { hostess_id: hostessId, kind: modalKind, event },
      });
      toast.success("Zmluva vygenerovaná a uložená.");
      closeModal();
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Generovanie zlyhalo.");
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    try {
      const r = (await getUrl({ data: { id } })) as { url: string | null };
      if (r?.url) window.open(r.url, "_blank");
      else toast.error("Odkaz sa nepodarilo vytvoriť.");
    } catch (e: any) {
      toast.error(e?.message);
    }
  }
  async function remove(id: string) {
    if (!confirm("Naozaj zmazať túto zmluvu?")) return;
    try {
      await del({ data: { id } });
      toast.success("Zmazané.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }
  function regenerate(row: any) {
    openModal(row.contract_type as ContractKind, {
      miesto_vykonu: row.event_data?.miesto_vykonu || "",
      datum_od: row.event_data?.datum_od || "",
      datum_do: row.event_data?.datum_do || "",
      datum_podpisu: row.event_data?.datum_podpisu || "",
      hodinova_sadzba: row.event_data?.hodinova_sadzba || "",
      jednorazova_odmena: row.event_data?.jednorazova_odmena || "",
      rozsah_prace: row.event_data?.rozsah_prace || "",
      nazov_klienta: row.event_data?.nazov_klienta || "",
      poznamka: row.event_data?.poznamka || "",
    });
  }

  return (
    <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="h-4 w-4 text-[#726D6A]" />
        <h2 className="text-sm uppercase tracking-wider text-[#726D6A]">
          Zmluvy
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {CONTRACT_KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => openModal(k.value)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-xs hover:opacity-90"
          >
            {k.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-xs text-[#726D6A]">
          Zatiaľ neboli pre túto hostesku vygenerované žiadne zmluvy.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg bg-white border border-[#D9D2CC] px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="text-sm">
                <div className="font-medium text-[#383B3A]">
                  {contractKindLabel(r.contract_type)}{" "}
                  <span className="text-xs text-[#726D6A]">v{r.version}</span>
                </div>
                <div className="text-xs text-[#726D6A]">
                  {new Date(r.created_at).toLocaleString("sk-SK")} ·{" "}
                  {r.generated_by_email || "admin"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => download(r.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> DOCX
                </button>
                <button
                  disabled
                  title="PDF export bude doplnený neskôr"
                  className="inline-flex items-center gap-1 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs opacity-50 cursor-not-allowed"
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => regenerate(r)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerovať
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-red-300 text-red-700 px-3 py-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Zmazať
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalKind && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-[#F5F1EC] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#D9D2CC] flex items-center justify-between">
              <h3 className="text-lg font-medium text-[#383B3A]">
                {contractKindLabel(modalKind)}
              </h3>
              <button onClick={closeModal} className="text-[#726D6A]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-[#726D6A]">
                Osobné údaje hostesky a údaje spoločnosti sa doplnia
                automaticky. Vyplňte údaje o evente:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Miesto výkonu" value={event.miesto_vykonu} onChange={(v) => setEvent({ ...event, miesto_vykonu: v })} />
                <Field label="Názov klienta" value={event.nazov_klienta} onChange={(v) => setEvent({ ...event, nazov_klienta: v })} />
                <Field label="Dátum od" value={event.datum_od} onChange={(v) => setEvent({ ...event, datum_od: v })} type="date" />
                <Field label="Dátum do" value={event.datum_do} onChange={(v) => setEvent({ ...event, datum_do: v })} type="date" />
                <Field label="Dátum podpisu" value={event.datum_podpisu} onChange={(v) => setEvent({ ...event, datum_podpisu: v })} type="date" />
                <Field label="Hodinová sadzba" value={event.hodinova_sadzba} onChange={(v) => setEvent({ ...event, hodinova_sadzba: v })} placeholder="napr. 8,00 €" />
                <Field label="Jednorázová odmena" value={event.jednorazova_odmena} onChange={(v) => setEvent({ ...event, jednorazova_odmena: v })} placeholder="napr. 120,00 €" />
                <Field label="Rozsah práce" value={event.rozsah_prace} onChange={(v) => setEvent({ ...event, rozsah_prace: v })} full textarea />
                <Field label="Poznámka" value={event.poznamka} onChange={(v) => setEvent({ ...event, poznamka: v })} full textarea />
              </div>
            </div>
            <div className="p-5 border-t border-[#D9D2CC] flex flex-wrap gap-2 justify-end sticky bottom-0 bg-[#F5F1EC]">
              {previewB64 && (
                <button
                  onClick={downloadPreview}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2CC] px-4 py-2 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Stiahnuť náhľad
                </button>
              )}
              <button
                onClick={doPreview}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#383B3A] text-[#383B3A] px-4 py-2 text-xs disabled:opacity-60"
              >
                {busy ? "Pripravujem…" : previewB64 ? "Aktualizovať náhľad" : "Náhľad"}
              </button>
              <button
                onClick={doGenerate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-xs disabled:opacity-60"
              >
                {busy ? "Ukladám…" : "Potvrdiť a uložiť"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  full,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  const cls = "w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm";
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-[#726D6A] mb-1">{label}</span>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </label>
  );
}

function downloadBase64(base64: string, filename: string, mime: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
