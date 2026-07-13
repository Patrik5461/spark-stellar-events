// Client-side shim: some pre-bundled TanStack Start deps reference
// `process.env.TSS_SERVER_FN_BASE` at module scope. In dev the plugin's
// define replacement doesn't always reach optimized deps, so ensure a
// minimal `process.env` exists on the client before those modules run.
if (typeof globalThis !== "undefined" && typeof (globalThis as any).process === "undefined") {
  (globalThis as any).process = { env: {} };
}
if (typeof globalThis !== "undefined") {
  const p = (globalThis as any).process;
  if (p && !p.env) p.env = {};
  if (p && p.env && !p.env.TSS_SERVER_FN_BASE) p.env.TSS_SERVER_FN_BASE = "/_serverFn";
}

import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";


export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
