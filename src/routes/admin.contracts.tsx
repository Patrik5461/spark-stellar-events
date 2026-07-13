import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Upload, Trash2, Download, Check } from "lucide-react";
import {
  listContractTemplates,
  uploadContractTemplate,
  deleteContractTemplate,
  getTemplateDownloadUrl,
} from "@/lib/hostess.functions";
import {
  uploadContractTemplate as uploadTpl,
  deleteContractTemplate as delTpl,
  getTemplateDownloadUrl as getTplUrl,
} from "@/lib/contracts.functions";
import { CONTRACT_KINDS, type ContractKind } from "@/lib/hostess-data";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/contract-constants";

// Re-export bindings so unused import warnings don't fire — server fns are also
// declared in contracts.functions.ts; keep only those below.
void listContractTemplates;
void uploadContractTemplate;
void deleteContractTemplate;
void getTemplateDownloadUrl;

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({
    meta: [
      { title: "Šablóny zmlúv — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContractsPage,
});

function ContractsPage() {
  const list = useServerFn(listContractTemplates);
  const upload = useServerFn(uploadTpl);
  const remove = useServerFn(delTpl);
  const getUrl = useServerFn(getTplUrl);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setRows((await list()) as any[]);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(kind: ContractKind, file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Nahrajte DOCX súbor.");
      return;
    }
    setBusy(kind);
    try {
      const buf = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buf);
      await upload({
        data: {
          kind,
          name: file.name,
          filename: file.name,
          base64,
        },
      });
      toast.success("Šablóna nahraná.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Nahrávanie zlyhalo.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Naozaj zmazať túto šablónu?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Zmazané.");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  async function handleDownload(id: string, name: string) {
    try {
      const r = (await getUrl({ data: { id } })) as any;
      if (r?.url) window.open(r.url, "_blank");
      else toast.error("Odkaz sa nepodarilo vytvoriť.");
      void name;
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-medium text-[#383B3A] mb-2">Šablóny zmlúv</h1>
      <p className="text-sm text-[#726D6A] mb-6">
        Nahrajte oficiálne DOCX šablóny pre každý typ zmluvy. Šablóny slúžia ako
        master — pri generovaní sa nikdy nemenia, iba sa z nich vytvorí kópia
        naplnená údajmi hostesky a eventu.
      </p>

      <div className="space-y-4 mb-8">
        {CONTRACT_KINDS.map((k) => {
          const active = rows.find(
            (r) => r.contract_type === k.value && r.is_active,
          );
          const history = rows.filter(
            (r) => r.contract_type === k.value && !r.is_active,
          );
          return (
            <div
              key={k.value}
              className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-medium text-[#383B3A]">
                    {k.label}
                  </h2>
                  {active ? (
                    <div className="mt-1 text-xs text-emerald-700 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Aktívna šablóna:{" "}
                      <span className="font-mono">
                        {active.original_filename}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-[#B23A2E]">
                      Šablóna nie je nahraná — generovanie tohto typu zmluvy
                      nebude fungovať.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {active && (
                    <>
                      <button
                        onClick={() =>
                          handleDownload(active.id, active.original_filename)
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D2CC] px-3 py-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Stiahnuť
                      </button>
                      <button
                        onClick={() => handleDelete(active.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-300 text-red-700 px-3 py-1.5 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Zmazať
                      </button>
                    </>
                  )}
                  <UploadButton
                    label={active ? "Nahradiť" : "Nahrať DOCX"}
                    disabled={busy === k.value}
                    onFile={(f) => handleUpload(k.value, f)}
                  />
                </div>
              </div>

              {history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#D9D2CC]">
                  <div className="text-xs uppercase tracking-wider text-[#726D6A] mb-2">
                    Predchádzajúce verzie
                  </div>
                  <ul className="space-y-1">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between text-xs text-[#726D6A]"
                      >
                        <span className="font-mono">{h.original_filename}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleDownload(h.id, h.original_filename)
                            }
                            className="hover:text-[#383B3A]"
                          >
                            Stiahnuť
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="text-red-700"
                          >
                            Zmazať
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#D9D2CC] bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-[#726D6A]" />
          <h2 className="text-sm uppercase tracking-wider text-[#726D6A]">
            Placeholders v šablónach
          </h2>
        </div>
        <p className="text-xs text-[#726D6A] mb-3">
          V DOCX šablóne označte polia ako{" "}
          <code className="font-mono">{`{{meno}}`}</code>. Pri generovaní sa
          nahradia týmito hodnotami:
        </p>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {TEMPLATE_PLACEHOLDERS.map((p) => (
            <div key={p.key} className="flex justify-between border-b border-[#F0EAE4] py-1">
              <code className="font-mono text-[#383B3A]">{`{{${p.key}}}`}</code>
              <span className="text-[#726D6A]">{p.description}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="mt-4 text-sm text-[#726D6A]">Načítavam…</div>}
    </div>
  );
}

function UploadButton({
  label,
  onFile,
  disabled,
}: {
  label: string;
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#383B3A] text-[#F5F1EC] px-3 py-1.5 text-xs disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" />
        {disabled ? "Nahrávam…" : label}
      </button>
    </>
  );
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[],
    );
  }
  return btoa(binary);
}
