// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Fallback define values in case the tanstack plugin's replacements don't reach
    // pre-bundled deps (avoids "process is not defined" from createClientRpc on the client).
    define: {
      "process.env.TSS_SERVER_FN_BASE": JSON.stringify("/_serverFn"),
      "process.env.TSS_ROUTER_BASEPATH": JSON.stringify("/"),
      "process.env.TSS_SHELL": JSON.stringify("false"),
      "process.env.TSS_DEV_SERVER": JSON.stringify("true"),
      "process.env.TSS_DEV_SSR_STYLES_ENABLED": JSON.stringify("false"),
      "process.env.TSS_DEV_SSR_STYLES_BASEPATH": JSON.stringify("/"),
      "process.env.TSS_INLINE_CSS_ENABLED": JSON.stringify("false"),
    },
    optimizeDeps: {
      exclude: [
        "@tanstack/start-client-core",
        "@tanstack/react-start",
      ],
    },
  },
});

