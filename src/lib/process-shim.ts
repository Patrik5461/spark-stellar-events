// Ensures `process.env.TSS_SERVER_FN_BASE` exists on the client. Some
// pre-bundled TanStack Start deps reference it at module scope, and the
// plugin's define replacement doesn't always reach optimized deps in dev.
// Must be imported before any module that transitively loads a
// `.functions.ts` file (server functions become `createClientRpc(...)`
// calls at module scope on the client).
if (typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (typeof g.process === "undefined") g.process = { env: {} };
  if (!g.process.env) g.process.env = {};
  if (!g.process.env.TSS_SERVER_FN_BASE) g.process.env.TSS_SERVER_FN_BASE = "/_serverFn";
  if (!g.process.env.TSS_ROUTER_BASEPATH) g.process.env.TSS_ROUTER_BASEPATH = "/";
  if (!g.process.env.TSS_SHELL) g.process.env.TSS_SHELL = "false";
  if (!g.process.env.TSS_DEV_SERVER) g.process.env.TSS_DEV_SERVER = "true";
  if (!g.process.env.TSS_DEV_SSR_STYLES_ENABLED) g.process.env.TSS_DEV_SSR_STYLES_ENABLED = "false";
  if (!g.process.env.TSS_DEV_SSR_STYLES_BASEPATH) g.process.env.TSS_DEV_SSR_STYLES_BASEPATH = "/";
  if (!g.process.env.TSS_INLINE_CSS_ENABLED) g.process.env.TSS_INLINE_CSS_ENABLED = "false";
}
export {};
