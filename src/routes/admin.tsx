import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Image as ImageIcon, Settings, Wrench, MessageSquare, Activity, AlertTriangle, Shirt, Users, FileText, Calendar, LayoutDashboard, Wallet, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAdminAuth, signOut } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — NU-U" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/admin/login";
  const { loading, user, isAdmin, mustChangePassword } = useAdminAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!isAdminRoute) return;
    if (isLogin) return;
    if (loading) return;
    if (!user || !isAdmin) navigate({ to: "/admin/login" });
  }, [loading, user, isAdmin, isLogin, isAdminRoute, navigate]);

  useEffect(() => { setNavOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  if (isLogin) {
    return <Outlet />;
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#EBE6E2] grid place-items-center text-[#726D6A]">
        Overujem prístup…
      </div>
    );
  }

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/gallery", label: "Galéria", icon: ImageIcon },
    { to: "/admin/clothing", label: "Oblečenie", icon: Shirt },
    { to: "/admin/hostesses", label: "Hostesky", icon: Users },
    { to: "/admin/contracts", label: "Zmluvy", icon: FileText },
    { to: "/admin/generated-contracts", label: "Vygenerované zmluvy", icon: FileText },
    { to: "/admin/events", label: "Eventy", icon: Calendar },
    { to: "/admin/finance", label: "Financie", icon: Wallet },
    { to: "/admin/services", label: "Služby", icon: Wrench },
    { to: "/admin/messages", label: "Správy", icon: MessageSquare },
    { to: "/admin/settings", label: "Nastavenia", icon: Settings },
    { to: "/admin/health", label: "Stav systému", icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen bg-[#EBE6E2] text-[#383B3A]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 bg-[#F5F1EC]/95 backdrop-blur border-b border-[#D9D2CC]">
        <Link to="/" aria-label="NU-U — domov" className="inline-flex items-center gap-2 text-[#383B3A]">
          <Logo className="h-10 w-10" />
          <span className="text-xs uppercase tracking-[0.25em] text-[#726D6A]">Admin</span>
        </Link>
        <button
          type="button"
          aria-label={navOpen ? "Zavrieť menu" : "Otvoriť menu"}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
          className="h-10 w-10 grid place-items-center rounded-lg border border-[#D9D2CC] bg-[#F5F1EC]"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {navOpen && (
        <button
          type="button"
          aria-label="Zavrieť menu"
          onClick={() => setNavOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#F5F1EC] border-r border-[#D9D2CC] flex flex-col transition-transform duration-300 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-[#D9D2CC] flex items-center justify-between gap-2">
          <Link to="/" aria-label="NU-U — domov" className="inline-flex text-[#383B3A] hover:opacity-80 transition-opacity">
            <Logo className="h-16 w-16 lg:h-20 lg:w-20" />
          </Link>
          <button
            type="button"
            aria-label="Zavrieť menu"
            onClick={() => setNavOpen(false)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-[#EBE6E2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pt-2 pb-1 text-xs uppercase tracking-[0.25em] text-[#726D6A]">Admin</div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setNavOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#383B3A] hover:bg-[#EBE6E2] transition-colors"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-[#383B3A] text-[#F5F1EC]" }}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#D9D2CC] space-y-2">
          <div className="text-xs text-[#726D6A] truncate">{user.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
            className="w-full inline-flex items-center gap-2 rounded-lg border border-[#D9D2CC] px-3 py-2 text-sm hover:bg-[#EBE6E2] transition-colors"
          >
            <LogOut className="h-4 w-4" /> Odhlásiť
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-10 min-w-0">
        {mustChangePassword && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-100/60 px-4 sm:px-5 py-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-amber-900">Zmeňte prosím predvolené heslo.</div>
              <div className="text-amber-800/80">
                Používate prvotné heslo. Nastavte silné vlastné heslo v sekcii{" "}
                <Link to="/admin/settings" className="underline">Nastavenia</Link>.
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
