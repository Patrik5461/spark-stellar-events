import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AdminAuthState = {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
  mustChangePassword: boolean;
};

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    loading: true,
    user: null,
    isAdmin: false,
    mustChangePassword: false,
  });

  useEffect(() => {
    let mounted = true;

    const check = async (user: User | null) => {
      if (!user) {
        if (mounted) setState({ loading: false, user: null, isAdmin: false, mustChangePassword: false });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
      if (mounted) {
        setState({
          loading: false,
          user,
          isAdmin: !!data,
          mustChangePassword: meta.must_change_password === true,
        });
      }
    };

    supabase.auth.getUser().then(({ data }) => check(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      check(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export const APP_VERSION = "1.0.0";
