import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, Image as ImageIcon, Settings, Wrench, MessageSquare, Activity, AlertTriangle, ArrowLeft } from "lucide-react";
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
  const isLogin = pathname === "/admin/login";
  const { loading, user, isAdmin, mustChangePassword } = useAdminAuth();

  useEffect(() => {
    if (isLogin) return;
    if (loading) return;
    if (!user || !isAdmin) navigate({ to: "/admin/login" });
  }, [loading, user, isAdmin, isLogin, navigate]);

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
    { to: "/admin/gallery", label: "Galéria", icon: ImageIcon },
    { to: "/admin/services", label: "Služby", icon: Wrench },
    { to: "/admin/messages", label: "Správy", icon: MessageSquare },
    { to: "/admin/settings", label: "Nastavenia", icon: Settings },
    { to: "/admin/health", label: "Stav systému", icon: Activity },
  ] as const;

  return (
    <div className="min-h-screen bg-[#EBE6E2] text-[#383B3A]">
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#F5F1EC] border-r border-[#D9D2CC] flex flex-col">
        <div className="px-6 py-6 border-b border-[#D9D2CC]">
          <Link to="/" className="font-display text-2xl">NU<span className="text-[#726D6A]">·</span>U</Link>
          <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A] mt-1">Admin</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#383B3A] hover:bg-[#EBE6E2] transition-colors"
              activeProps={{ className: "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-[#383B3A] text-[#F5F1EC]" }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#D9D2CC] space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#726D6A] hover:bg-[#EBE6E2] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Späť na web
          </Link>
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

      <main className="ml-64 p-8 md:p-10">
        {mustChangePassword && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-100/60 px-5 py-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="flex-1">
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
