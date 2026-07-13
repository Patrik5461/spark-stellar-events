import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Plus, Power, Trash2 } from "lucide-react";
import {
  createHostessInvite,
  listHostessInvites,
  setHostessInviteActive,
  deleteHostessInvite,
} from "@/lib/hostess.functions";

export const Route = createFileRoute("/admin/hostesses/invitations")({
  head: () => ({ meta: [{ title: "Pozvánky hostesiek — Admin" }, { name: "robots", content: "noindex" }] }),
  component: InvitationsPage,
});

type Invite = {
  id: string;
  label: string | null;
  internal_note: string | null;
  max_submissions: number;
  submission_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function InvitationsPage() {
  const list = useServerFn(listHostessInvites);
  const create = useServerFn(createHostessInvite);
  const setActive = useServerFn(setHostessInviteActive);
  const del = useServerFn(deleteHostessInvite);

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "",
    internal_note: "",
    max_submissions: 1,
    expires_at: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      const r = (await list()) as Invite[];
      setInvites(r);
    } catch (e: any) {
      toast.error(e?.message || "Načítanie zlyhalo");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await create({
        data: {
          label: form.label,
          internal_note: form.internal_note,
          max_submissions: Number(form.max_submissions) || 1,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        },
      });
      const url = `${window.location.origin}/hostess-form/${r.token}`;
      setNewLink(url);
      setForm({ label: "", internal_note: "", max_submissions: 1, expires_at: "" });
      setShowForm(false);
      await refresh();
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Odkaz vytvorený a skopírovaný");
      } catch {
        toast.success("Odkaz vytvorený");
      }
    } catch (e: any) {
      toast.error(e?.message || "Vytvorenie zlyhalo");
    }
  }

  function statusOf(inv: Invite): { label: string; className: string } {
    const expired = inv.expires_at && new Date(inv.expires_at).getTime() < Date.now();
    const exhausted = inv.submission_count >= inv.max_submissions;
    if (!inv.is_active) return { label: "Deaktivovaný", className: "bg-[#D9D2CC] text-[#726D6A]" };
    if (expired) return { label: "Expirovaný", className: "bg-amber-100 text-amber-800" };
    if (exhausted) return { label: "Vyčerpaný", className: "bg-amber-100 text-amber-800" };
    return { label: "Aktívny", className: "bg-emerald-100 text-emerald-800" };
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-[#383B3A]">Pozvánky hostesiek</h1>
          <p className="text-sm text-[#726D6A] mt-1">Vytvorte unikátny odkaz na registračný formulár.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" /> Nový odkaz
        </button>
      </div>

      {newLink && (
        <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-1">Nový odkaz</div>
          <div className="flex items-center gap-2">
            <input readOnly value={newLink} className="flex-1 rounded border border-emerald-200 bg-white px-3 py-2 text-sm font-mono" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(newLink);
                toast.success("Skopírované");
              }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-700 text-white px-3 py-2 text-xs"
            >
              <Copy className="h-3 w-3" /> Kopírovať
            </button>
          </div>
          <div className="text-xs text-emerald-800 mt-2">Odkaz sa už znova nezobrazí — uložte si ho.</div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs text-[#726D6A] mb-1">Názov / meno hostesky (voliteľné)</span>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs text-[#726D6A] mb-1">Interná poznámka</span>
              <input value={form.internal_note} onChange={(e) => setForm({ ...form, internal_note: e.target.value })} className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs text-[#726D6A] mb-1">Max. počet odoslaní</span>
              <input
                type="number"
                min={1}
                value={form.max_submissions}
                onChange={(e) => setForm({ ...form, max_submissions: Number(e.target.value) })}
                className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-[#726D6A] mb-1">Platnosť do (voliteľné)</span>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full rounded-lg border border-[#D9D2CC] bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2 text-sm">Vytvoriť</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-[#D9D2CC] px-5 py-2 text-sm">Zrušiť</button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[#D9D2CC] bg-[#F5F1EC] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#EBE6E2] text-[#726D6A] text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Názov</th>
              <th className="text-left px-4 py-3">Stav</th>
              <th className="text-left px-4 py-3">Odoslania</th>
              <th className="text-left px-4 py-3">Platnosť</th>
              <th className="text-left px-4 py-3">Vytvorené</th>
              <th className="text-right px-4 py-3">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-[#726D6A]">Načítavam…</td></tr>
            ) : invites.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-[#726D6A]">Zatiaľ žiadne pozvánky.</td></tr>
            ) : invites.map((inv) => {
              const s = statusOf(inv);
              return (
                <tr key={inv.id} className="border-t border-[#D9D2CC]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#383B3A]">{inv.label || "(bez názvu)"}</div>
                    {inv.internal_note && <div className="text-xs text-[#726D6A]">{inv.internal_note}</div>}
                  </td>
                  <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-xs ${s.className}`}>{s.label}</span></td>
                  <td className="px-4 py-3">{inv.submission_count} / {inv.max_submissions}</td>
                  <td className="px-4 py-3 text-xs text-[#726D6A]">{inv.expires_at ? new Date(inv.expires_at).toLocaleString("sk-SK") : "—"}</td>
                  <td className="px-4 py-3 text-xs text-[#726D6A]">{new Date(inv.created_at).toLocaleDateString("sk-SK")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={async () => {
                          try {
                            await setActive({ data: { id: inv.id, active: !inv.is_active } });
                            await refresh();
                          } catch (e: any) { toast.error(e?.message); }
                        }}
                        title={inv.is_active ? "Deaktivovať" : "Aktivovať"}
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-[#EBE6E2]"
                      >
                        <Power className={`h-4 w-4 ${inv.is_active ? "text-emerald-700" : "text-[#726D6A]"}`} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Zmazať tento odkaz?")) return;
                          try {
                            await del({ data: { id: inv.id } });
                            await refresh();
                          } catch (e: any) { toast.error(e?.message); }
                        }}
                        title="Zmazať"
                        className="h-8 w-8 grid place-items-center rounded-full hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link to="/admin/hostesses" className="text-sm text-[#726D6A] hover:text-[#383B3A]">← Späť na zoznam hostesiek</Link>
      </div>
    </div>
  );
}
