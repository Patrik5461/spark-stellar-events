import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createEvent } from "@/lib/events.functions";
import {
  EventForm,
  emptyEvent,
  toPayload,
} from "@/components/admin/EventForm";

export const Route = createFileRoute("/admin/events/new")({
  head: () => ({
    meta: [
      { title: "Nový event — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewEventPage,
});

function NewEventPage() {
  const nav = useNavigate();
  const create = useServerFn(createEvent);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="max-w-[1000px]">
      <Link
        to="/admin/events"
        className="inline-flex items-center gap-1 text-sm text-[#726D6A] hover:text-[#383B3A] mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Späť na zoznam
      </Link>
      <h1 className="text-2xl font-medium mb-6">Nový event</h1>
      <EventForm
        initial={emptyEvent}
        submitLabel="Vytvoriť event"
        submitting={submitting}
        onSubmit={async (v) => {
          setSubmitting(true);
          try {
            const row: any = await create({ data: toPayload(v) as any });
            toast.success("Event vytvorený.");
            nav({ to: "/admin/events/$id", params: { id: row.id } });
          } catch (e: any) {
            toast.error(e?.message || "Chyba pri vytváraní eventu.");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
