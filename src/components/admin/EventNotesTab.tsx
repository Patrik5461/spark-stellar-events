import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  listEventNotes,
  addEventNote,
  deleteEventNote,
} from "@/lib/events.functions";

type Note = {
  id: string;
  event_id: string;
  note: string;
  created_at: string;
  created_by_email: string | null;
};

export function EventNotesTab({ eventId }: { eventId: string }) {
  const listFn = useServerFn(listEventNotes);
  const addFn = useServerFn(addEventNote);
  const delFn = useServerFn(deleteEventNote);

  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await listFn({ data: { event_id: eventId } });
      setNotes(r as Note[]);
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri načítaní poznámok.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function add() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addFn({ data: { event_id: eventId, note: text } });
      setText("");
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba pri pridávaní poznámky.");
    } finally {
      setBusy(false);
    }
  }
  async function del(id: string) {
    if (!confirm("Zmazať poznámku?")) return;
    try {
      await delFn({ data: { id } });
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || "Chyba.");
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-[#F5F1EC] border border-[#D9D2CC] rounded-xl p-5">
        <h3 className="text-sm uppercase tracking-wider text-[#726D6A] mb-3">
          Nová poznámka
        </h3>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Napíšte poznámku k eventu…"
          className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm outline-none focus:border-[#383B3A]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={add}
            disabled={busy || !text.trim()}
            className="inline-flex items-center gap-1 text-sm rounded-lg bg-[#383B3A] text-[#F5F1EC] px-4 py-2 hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Pridať
          </button>
        </div>
      </section>

      {loading ? (
        <div className="text-sm text-[#726D6A]">Načítavam…</div>
      ) : notes.length === 0 ? (
        <div className="bg-[#F5F1EC] border border-dashed border-[#D9D2CC] rounded-xl p-8 text-center text-sm text-[#726D6A]">
          Zatiaľ žiadne poznámky.
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="bg-white border border-[#D9D2CC] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="whitespace-pre-wrap text-sm">{n.note}</div>
                <button
                  onClick={() => del(n.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-red-700"
                  title="Zmazať"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-[#726D6A] mt-2">
                {n.created_by_email || "admin"} ·{" "}
                {new Date(n.created_at).toLocaleString("sk-SK")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
