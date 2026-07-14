import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listEventAudit } from "@/lib/events.functions";

type Entry = {
  id: string;
  action: string;
  actor_email: string | null;
  created_at: string;
  details: any;
};

const ACTION_LABEL: Record<string, string> = {
  event_created: "Event vytvorený",
  event_updated: "Event upravený",
  assignment_added: "Priradená hosteska",
  assignment_added_substitute: "Pridaná náhradníčka",
  assignment_removed: "Odstránené priradenie",
  assignment_status_changed: "Zmena stavu priradenia",
};

export function EventHistoryTab({ eventId }: { eventId: string }) {
  const listFn = useServerFn(listEventAudit);
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await listFn({ data: { event_id: eventId } });
        setRows(r as Entry[]);
      } catch (e: any) {
        toast.error(e?.message || "Chyba pri načítaní histórie.");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, listFn]);

  if (loading) return <div className="text-sm text-[#726D6A]">Načítavam…</div>;
  if (!rows.length)
    return (
      <div className="bg-[#F5F1EC] border border-dashed border-[#D9D2CC] rounded-xl p-8 text-center text-sm text-[#726D6A]">
        Žiadne záznamy v histórii.
      </div>
    );

  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="bg-white border border-[#D9D2CC] rounded-xl p-4 text-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              {ACTION_LABEL[r.action] || r.action}
            </span>
            <span className="text-xs text-[#726D6A]">
              {new Date(r.created_at).toLocaleString("sk-SK")}
            </span>
          </div>
          <div className="text-xs text-[#726D6A] mt-1">
            {r.actor_email || "admin"}
            {r.details && Object.keys(r.details).length > 0 && (
              <span> · {JSON.stringify(r.details)}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
