import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Trash2,
  Pencil,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABEL,
  type DocumentType,
  listEventDocuments,
  uploadEventDocument,
  updateEventDocument,
  deleteEventDocument,
  downloadEventDocument,
  downloadGeneratedContractDocx,
} from "@/lib/event-documents.functions";

type Doc = {
  id: string;
  title: string | null;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  document_type: string;
  internal_note: string | null;
  storage_path: string;
  generated_contract_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at?: string;
};

type Contract = {
  id: string;
  contract_type: string;
  version: number;
  created_at: string;
  generated_by_email: string | null;
  event_assignment_id: string | null;
  hostess: { first_name: string; last_name: string } | null;
};

function formatSize(n: number | null | undefined) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mime: string | null | undefined) {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime === "application/pdf") return FileText;
  return FileIcon;
}

function saveBlob(base64: string, mime: string, name: string) {
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

const ACCEPT =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png";

export function EventDocumentsTab({ eventId }: { eventId: string }) {
  const listFn = useServerFn(listEventDocuments);
  const uploadFn = useServerFn(uploadEventDocument);
  const updateFn = useServerFn(updateEventDocument);
  const deleteFn = useServerFn(deleteEventDocument);
  const downloadFn = useServerFn(downloadEventDocument);
  const downloadContractFn = useServerFn(downloadGeneratedContractDocx);

  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [editing, setEditing] = useState<Doc | null>(null);

  // Upload form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("other");
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r: any = await listFn({ data: { event_id: eventId } });
      setDocs(r.documents || []);
      setContracts(r.contracts || []);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní dokumentov.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  const contractDocIds = useMemo(
    () => new Set(docs.filter((d) => d.generated_contract_id).map((d) => d.generated_contract_id)),
    [docs],
  );

  const onSelectFile = (f: File | null) => {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const submitUpload = async () => {
    if (!file) return toast.error("Vyberte súbor.");
    if (!title.trim()) return toast.error("Zadajte názov dokumentu.");
    if (file.size > 25 * 1024 * 1024)
      return toast.error("Súbor je väčší ako 25 MB.");
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      await uploadFn({
        data: {
          event_id: eventId,
          title: title.trim(),
          document_type: docType,
          internal_note: note.trim() || null,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          content_base64: b64,
        },
      });
      toast.success("Dokument nahraný.");
      setFile(null);
      setTitle("");
      setNote("");
      setDocType("other");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri nahrávaní.");
    } finally {
      setUploading(false);
    }
  };

  const doDownload = async (id: string) => {
    try {
      const r: any = await downloadFn({ data: { id } });
      saveBlob(r.base64, r.mime_type, r.file_name);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri sťahovaní.");
    }
  };

  const doPreview = async (d: Doc) => {
    if (!d.mime_type?.startsWith("image/")) return doDownload(d.id);
    try {
      const r: any = await downloadFn({ data: { id: d.id } });
      const bin = atob(r.base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: r.mime_type }));
      setPreviewUrl(url);
      setPreviewName(r.file_name);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri náhľade.");
    }
  };

  const doDelete = async (d: Doc) => {
    if (!confirm(`Zmazať dokument "${d.title || d.file_name}"?`)) return;
    try {
      await deleteFn({ data: { id: d.id } });
      toast.success("Zmazané.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri mazaní.");
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateFn({
        data: {
          id: editing.id,
          title: editing.title || "",
          document_type: editing.document_type,
          internal_note: editing.internal_note || null,
          file_name: editing.file_name,
        },
      });
      toast.success("Zmeny uložené.");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri ukladaní.");
    }
  };

  const downloadContract = async (id: string) => {
    try {
      const r: any = await downloadContractFn({ data: { contract_id: id } });
      saveBlob(r.base64, r.mime_type, r.file_name);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri sťahovaní.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload block */}
      <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
        <h3 className="font-medium mb-3">Nahrať dokument</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-[#726D6A] mb-1">Súbor (PDF, DOCX, XLSX, JPG, PNG)</span>
            <input
              type="file"
              accept={ACCEPT}
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {file && (
              <span className="text-xs text-[#726D6A] mt-1 block">
                {file.name} · {formatSize(file.size)}
              </span>
            )}
          </label>
          <label className="text-sm">
            <span className="block text-[#726D6A] mb-1">Názov dokumentu</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
              placeholder="Napr. Brief od klienta – finálna verzia"
            />
          </label>
          <label className="text-sm">
            <span className="block text-[#726D6A] mb-1">Typ dokumentu</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOCUMENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-[#726D6A] mb-1">Interná poznámka</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3">
          <button
            onClick={submitUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2 text-sm disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Nahrať
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div>
        <h3 className="font-medium mb-3">Dokumenty ({docs.length})</h3>
        {loading ? (
          <div className="text-sm text-[#726D6A]">Načítavam…</div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D9D2CC] p-8 text-center text-[#726D6A] text-sm">
            Žiadne dokumenty. Nahrajte prvý dokument vyššie.
          </div>
        ) : (
          <ul className="divide-y divide-[#D9D2CC] rounded-xl border border-[#D9D2CC] bg-white">
            {docs.map((d) => {
              const Icon = iconFor(d.mime_type);
              const isImage = d.mime_type?.startsWith("image/");
              return (
                <li key={d.id} className="p-3 flex items-center gap-3">
                  <Icon className="h-6 w-6 text-[#726D6A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {d.title || d.file_name}
                    </div>
                    <div className="text-xs text-[#726D6A] truncate">
                      {DOCUMENT_TYPE_LABEL[d.document_type as DocumentType] || d.document_type} ·{" "}
                      {formatSize(d.file_size)} · {new Date(d.created_at).toLocaleString("sk-SK")}
                      {d.internal_note ? ` · ${d.internal_note}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isImage && (
                      <button
                        onClick={() => doPreview(d)}
                        title="Náhľad"
                        className="p-2 rounded-lg hover:bg-[#F5F1EC]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => doDownload(d.id)}
                      title="Stiahnuť"
                      className="p-2 rounded-lg hover:bg-[#F5F1EC]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditing(d)}
                      title="Upraviť"
                      className="p-2 rounded-lg hover:bg-[#F5F1EC]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => doDelete(d)}
                      title="Zmazať"
                      className="p-2 rounded-lg hover:bg-red-50 text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Generated contracts (auto-listed) */}
      <div>
        <h3 className="font-medium mb-3">Vygenerované zmluvy ({contracts.length})</h3>
        {contracts.length === 0 ? (
          <div className="text-sm text-[#726D6A]">
            Zatiaľ neboli vygenerované žiadne zmluvy. Vygenerujte ich v záložke „Pracovníci“.
          </div>
        ) : (
          <ul className="divide-y divide-[#D9D2CC] rounded-xl border border-[#D9D2CC] bg-white">
            {contracts.map((c) => (
              <li key={c.id} className="p-3 flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#726D6A] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {c.contract_type} – v{c.version}
                    {c.hostess ? ` · ${c.hostess.first_name} ${c.hostess.last_name}` : ""}
                  </div>
                  <div className="text-xs text-[#726D6A]">
                    {new Date(c.created_at).toLocaleString("sk-SK")}
                    {c.generated_by_email ? ` · ${c.generated_by_email}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => downloadContract(c.id)}
                  className="inline-flex items-center gap-1 text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5 hover:bg-[#F5F1EC]"
                >
                  <Download className="h-4 w-4" /> DOCX
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-10 right-0 text-white"
              onClick={() => {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewUrl}
              alt={previewName}
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium mb-4">Upraviť dokument</h3>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="block text-[#726D6A] mb-1">Názov</span>
                <input
                  value={editing.title || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-[#726D6A] mb-1">Názov súboru</span>
                <input
                  value={editing.file_name}
                  onChange={(e) =>
                    setEditing({ ...editing, file_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-[#726D6A] mb-1">Typ</span>
                <select
                  value={editing.document_type}
                  onChange={(e) =>
                    setEditing({ ...editing, document_type: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DOCUMENT_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-[#726D6A] mb-1">Interná poznámka</span>
                <textarea
                  value={editing.internal_note || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, internal_note: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[#D9D2CC] px-4 py-2 text-sm hover:bg-[#F5F1EC]"
              >
                Zrušiť
              </button>
              <button
                onClick={saveEdit}
                className="rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 text-sm"
              >
                Uložiť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* silence unused */}
      <span className="hidden">{contractDocIds.size}</span>
    </div>
  );
}
