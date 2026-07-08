import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Prihlásenie — Admin NU-U" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [email, setEmail] = useState("admin@nu-u.sk");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth.loading && auth.user && auth.isAdmin) {
      navigate({ to: "/admin/gallery" });
    }
  }, [auth, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/admin/gallery" });
  };

  return (
    <div className="min-h-screen bg-[#EBE6E2] flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-[#F5F1EC] border border-[#D9D2CC] p-10 soft-shadow-lg"
      >
        <div className="text-xs uppercase tracking-[0.3em] text-[#726D6A]">Admin</div>
        <h1 className="mt-2 font-display text-4xl text-[#383B3A]">Prihlásenie</h1>
        <p className="mt-2 text-sm text-[#726D6A]">Prístup len pre administrátorov.</p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-[#726D6A]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-[#D9D2CC] bg-white/60 px-4 py-3 outline-none focus:border-[#383B3A]"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-[#726D6A]">Heslo</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-[#D9D2CC] bg-white/60 px-4 py-3 outline-none focus:border-[#383B3A]"
            />
          </label>
        </div>

        {error && <div className="mt-4 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={busy}
          className="mt-8 w-full rounded-full bg-[#383B3A] text-[#F5F1EC] py-3.5 text-sm font-medium disabled:opacity-60 hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)] transition-shadow"
        >
          {busy ? "Prihlasujem…" : "Prihlásiť sa"}
        </button>
      </form>
    </div>
  );
}
