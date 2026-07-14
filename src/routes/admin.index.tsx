import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar,
  CalendarRange,
  FolderOpen,
  Users,
  Clock,
  FileSignature,
  ClipboardList,
  UserPlus,
  AlertTriangle,
  Info,
  ArrowRight,
  Wallet,
  Coins,
  CheckCircle2,
} from "lucide-react";
import {
  getDashboardStats,
  getUpcomingEvents,
  getDashboardAlerts,
} from "@/lib/dashboard.functions";
import { EVENT_STATUS_LABEL, EVENT_STATUS_COLOR, type EventStatus } from "@/lib/event-constants";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

type Stats = {
  today: number;
  week: number;
  open: number;
  unfilled_slots: number;
  pending_confirmations: number;
  unsigned_contracts: number;
  missing_attendance: number;
  new_hostesses: number;
  unpaid_total: number;
  month_total: number;
  month_paid: number;
};
type UpcomingEvent = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  location: string;
  status: EventStatus;
  required_workers: number;
  assigned_count: number;
  client: { name: string } | null;
};
type Alert = {
  kind: string;
  severity: "warn" | "info" | "danger";
  message: string;
  event_id: string;
  assignment_id?: string;
};

function Tile({
  to,
  label,
  value,
  Icon,
  tone = "neutral",
}: {
  to: string;
  label: string;
  value: number | string;
  Icon: any;
  tone?: "neutral" | "warn" | "danger";
}) {
  const toneCls =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : "border-[#D9D2CC] bg-[#F5F1EC]";
  return (
    <Link
      to={to}
      className={`block rounded-2xl border ${toneCls} p-5 hover:shadow-sm transition`}
    >
      <div className="flex items-start justify-between">
        <Icon className="h-5 w-5 text-[#726D6A]" />
        <ArrowRight className="h-4 w-4 text-[#726D6A]" />
      </div>
      <div className="mt-4 text-3xl font-medium">{value}</div>
      <div className="text-sm text-[#726D6A] mt-1">{label}</div>
    </Link>
  );
}

function DashboardPage() {
  const statsFn = useServerFn(getDashboardStats);
  const upcomingFn = useServerFn(getUpcomingEvents);
  const alertsFn = useServerFn(getDashboardAlerts);
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, u, a] = await Promise.all([statsFn(), upcomingFn(), alertsFn()]);
        setStats(s as any);
        setUpcoming(u as any);
        setAlerts(a as any);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [statsFn, upcomingFn, alertsFn]);

  return (
    <section>
      <header className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Prehľad</div>
        <h1 className="font-display text-4xl">Dashboard</h1>
      </header>

      {loading || !stats ? (
        <div className="text-sm text-[#726D6A]">Načítavam prehľad…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile to="/admin/events" label="Dnešné eventy" value={stats.today} Icon={Calendar} />
            <Tile to="/admin/events" label="Eventy tento týždeň" value={stats.week} Icon={CalendarRange} />
            <Tile to="/admin/events" label="Otvorené eventy" value={stats.open} Icon={FolderOpen} />
            <Tile
              to="/admin/events"
              label="Neobsadené miesta"
              value={stats.unfilled_slots}
              Icon={Users}
              tone={stats.unfilled_slots > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/events"
              label="Čakajúce potvrdenia"
              value={stats.pending_confirmations}
              Icon={Clock}
              tone={stats.pending_confirmations > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/generated-contracts"
              label="Nepodpísané zmluvy"
              value={stats.unsigned_contracts}
              Icon={FileSignature}
              tone={stats.unsigned_contracts > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/events"
              label="Nevyplnená dochádzka"
              value={stats.missing_attendance}
              Icon={ClipboardList}
              tone={stats.missing_attendance > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/hostesses"
              label="Nové registrácie hostesiek"
              value={stats.new_hostesses}
              Icon={UserPlus}
              tone={stats.new_hostesses > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/finance"
              label="Neuhradené odmeny (€)"
              value={stats.unpaid_total.toLocaleString("sk-SK")}
              Icon={Wallet}
              tone={stats.unpaid_total > 0 ? "warn" : "neutral"}
            />
            <Tile
              to="/admin/finance"
              label="Odmeny tento mesiac (€)"
              value={stats.month_total.toLocaleString("sk-SK")}
              Icon={Coins}
            />
            <Tile
              to="/admin/finance"
              label="Uhradené tento mesiac (€)"
              value={stats.month_paid.toLocaleString("sk-SK")}
              Icon={CheckCircle2}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <div className="rounded-2xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Najbližšie eventy</h2>
                <Link to="/admin/events" className="text-sm text-[#726D6A] hover:text-[#383B3A]">
                  Všetky →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <div className="text-sm text-[#726D6A]">Žiadne nadchádzajúce eventy.</div>
              ) : (
                <ul className="divide-y divide-[#D9D2CC]">
                  {upcoming.map((e) => {
                    const filled = e.assigned_count >= e.required_workers;
                    return (
                      <li key={e.id}>
                        <Link
                          to="/admin/events/$id"
                          params={{ id: e.id }}
                          className="flex items-center gap-3 py-3 hover:bg-white/50 rounded-lg px-2 -mx-2"
                        >
                          <div className="text-xs text-[#726D6A] w-24 shrink-0">
                            {e.date_from === e.date_to
                              ? new Date(e.date_from).toLocaleDateString("sk-SK")
                              : `${new Date(e.date_from).toLocaleDateString("sk-SK")} – ${new Date(e.date_to).toLocaleDateString("sk-SK")}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{e.name}</div>
                            <div className="text-xs text-[#726D6A] truncate">
                              {e.client?.name ? `${e.client.name} · ` : ""}
                              {e.location}
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${filled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {e.assigned_count}/{e.required_workers}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${EVENT_STATUS_COLOR[e.status]}`}>
                            {EVENT_STATUS_LABEL[e.status]}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#D9D2CC] bg-[#F5F1EC] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium">Vyžaduje pozornosť</h2>
                <span className="text-sm text-[#726D6A]">{alerts.length}</span>
              </div>
              {alerts.length === 0 ? (
                <div className="text-sm text-[#726D6A]">Všetko v poriadku 🎉</div>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-auto">
                  {alerts.map((a, i) => {
                    const Icon = a.severity === "info" ? Info : AlertTriangle;
                    const cls =
                      a.severity === "danger"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : a.severity === "warn"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : "bg-white border-[#D9D2CC] text-[#383B3A]";
                    return (
                      <li key={i}>
                        <Link
                          to="/admin/events/$id"
                          params={{ id: a.event_id }}
                          className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm hover:shadow-sm transition ${cls}`}
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="flex-1">{a.message}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 opacity-60" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
