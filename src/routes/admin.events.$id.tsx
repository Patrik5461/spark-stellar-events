import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import {
  getEvent,
  updateEvent,
  duplicateEvent,
  deleteEvent,
} from "@/lib/events.functions";
import {
  EventForm,
  emptyEvent,
  toPayload,
  fromRow,
  type EventFormValues,
} from "@/components/admin/EventForm";

export const Route = createFileRoute("/admin/events/$id")({
  head: () => ({
    meta: [
      { title: "Event — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditEventPage,
});

function EditEventPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const getFn = useServerFn(getEvent);
  const updateFn = useServerFn(updateEvent);
  const dupFn = useServerFn(duplicateEvent);
  const delFn = useServerFn(deleteEvent);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [initial, setInitial] = useState<EventFormValues>(emptyEvent);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const row: any = await getFn({ data: { id } });
        if (!row) {
          setNotFound(true);
        } else {
          setInitial(fromRow(row));
        }
      } catch (e: any) {
        toast.error(e?.message || "Nepodarilo sa načítať event.");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getFn]);

  if (loading) {
    return <div className="text-sm text-[#726D6A]">Načítavam event…</div>;
  }
  if (notFound) {
    return (
      <div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-[#726D6A] hover:text-[#383B3A] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Späť na zoznam
        </Link>
        <div className="bg-[#F5F1EC] border border-dashed border-[#D9D2CC] rounded-xl p-10 text-center text-[#726D6A]">
          Event sa nenašiel.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-1 text-sm text-[#726D6A] hover:text-[#383B3A]"
        >
          <ArrowLeft className="h-4 w-4" /> Späť na zoznam
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const row: any = await dupFn({ data: { id } });
                toast.success("Event duplikovaný.");
                nav({ to: "/admin/events/$id", params: { id: row.id } });
              } catch (e: any) {
                toast.error(e?.message || "Chyba pri duplikovaní.");
              }
            }}
            className="inline-flex items-center gap-1 text-sm rounded-lg border border-[#D9D2CC] px-3 py-1.5 hover:bg-[#F5F1EC]"
          >
            <Copy className="h-4 w-4" /> Duplikovať
          </button>
          <button
            onClick={async () => {
              if (!confirm("Zmazať tento event? Zmažú sa aj priradenia a dokumenty."))
                return;
              try {
                await delFn({ data: { id } });
                toast.success("Event zmazaný.");
                nav({ to: "/admin/events" });
              } catch (e: any) {
                toast.error(e?.message || "Chyba pri mazaní.");
              }
            }}
            className="inline-flex items-center gap-1 text-sm rounded-lg border border-red-200 text-red-700 px-3 py-1.5 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Zmazať
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-medium mb-2">{initial.name || "Event"}</h1>
      <p className="text-sm text-[#726D6A] mb-6">
        Ďalšie taby (Pracovníci, Dochádzka, Dokumenty, Poznámky, História) budú
        dostupné v ďalšej fáze.
      </p>

      <EventForm
        initial={initial}
        submitLabel="Uložiť zmeny"
        submitting={submitting}
        onSubmit={async (v) => {
          setSubmitting(true);
          try {
            await updateFn({ data: { id, ...(toPayload(v) as any) } });
            toast.success("Zmeny uložené.");
          } catch (e: any) {
            toast.error(e?.message || "Chyba pri ukladaní.");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
