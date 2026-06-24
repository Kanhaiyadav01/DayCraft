import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // 1. Fast check if session already exists
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 2. If no session, check if we are in the middle of a Supabase OAuth hash redirect callback.
    // Supabase parses `#access_token=...` or `#error=...` asynchronously on load.
    if (
      !session &&
      typeof window !== "undefined" &&
      (window.location.hash.includes("access_token=") ||
        window.location.hash.includes("id_token=") ||
        window.location.href.includes("access_token="))
    ) {
      // Wait up to 1.5s for the client SDK to parse hash, update storage and login
      for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (currentSession) {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            return { user: data.user };
          }
        }
      }
    }

    // 3. Normal check / verification
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { mode: undefined } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
