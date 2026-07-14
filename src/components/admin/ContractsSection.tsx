import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileSignature, Download, Trash2, RefreshCw, X } from "lucide-react";
import {
  previewContract,
  generateContract,
  listGeneratedContracts,
  getGeneratedContractUrl,
  getGeneratedContractBase64,
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
  const getB64 = useServerFn(getGeneratedContractBase64);
  const del = useServerFn(deleteGeneratedContract);

  const [rows, setRows] = useState<any[]>([]);
  const [modalKind, setModalKind] = useState<ContractKind | null>(null);
  const [event, setEvent] = useState<EventFields>(EMPTY_EVENT);
  const [previewB64, setPreviewB64] = useState<string | null>(null);
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
  }
  function closeModal() {
    setModalKind(null);
    setPreviewB64(null);
    setEvent(EMPTY_EVENT);
  }

  async function doPreview() {
    if (!modalKind) return;
    setBusy(true);
    try {
      const r = (await preview({
        data: { hostess_id: hostessId, kind: modalKind, event },
      })) as { base64: string; filename: string };
      setPreviewB64(r.base64);
      toast.success("Náhľad DOCX pripravený — stiahnite a skontrolujte pred uložením.");
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
      const r = (await getB64({ data: { id } })) as {
        base64: string;
        filename: string;
      };
      if (!r?.base64) throw new Error("Prázdna odpoveď zo servera.");
      downloadBase64(r.base64, r.filename, DOCX_MIME);
    } catch (e: any) {
      const msg = e?.message || "Stiahnutie zlyhalo.";
      console.error("[download DOCX] failed:", e);
      toast.error(msg, {
        duration: 10000,
        action: {
          label: "Skúsiť znova",
          onClick: () => download(id),
        },
      });
      // Fallback: try signed URL, log it, open only if valid.
      try {
        const s = (await getUrl({ data: { id } })) as {
          url: string | null;
          path?: string;
        };
        console.log("[download DOCX] fallback signed URL:", s?.url, "path:", s?.path);
        if (s?.url) window.open(s.url, "_blank", "noopener");
      } catch (e2: any) {
        console.error("[download DOCX] signed URL fallback failed:", e2);
      }
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

      <div className="mb-4 rounded-lg border border-[#D9D2CC] bg-white/60 p-3 text-xs text-[#726D6A]">
        PDF export je dočasne vypnutý. Zmluvy sa generujú vo formáte DOCX so
        zachovaným formátovaním šablóny (tabuľky, okraje, fonty, hlavičky,
        pätičky, zalomenia strán). Kvalitný PDF export vyžaduje pripojenie
        externého konvertora (napr. CloudConvert, ConvertAPI, Gotenberg alebo
        LibreOffice service) — poviete a zapojíme ho.
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
            className="bg-[#F5F1EC] rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
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

              {previewB64 && (
                <div className="mt-4 rounded-lg border border-[#D9D2CC] bg-white p-4 text-sm text-[#383B3A]">
                  Náhľad DOCX je pripravený. Stiahnite ho a otvorte vo Worde
                  na kontrolu — formátovanie je 1:1 zo šablóny. Po kontrole
                  potvrďte a uložte.
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#D9D2CC] flex flex-wrap gap-2 justify-end sticky bottom-0 bg-[#F5F1EC]">
              {previewB64 && (
                <button
                  onClick={downloadPreview}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2CC] px-4 py-2 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Stiahnuť náhľad DOCX
                </button>
              )}
              <button
                onClick={doPreview}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#383B3A] text-[#383B3A] px-4 py-2 text-xs disabled:opacity-60"
              >
                {busy ? "Pripravujem…" : previewB64 ? "Aktualizovať náhľad" : "Náhľad DOCX"}
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
