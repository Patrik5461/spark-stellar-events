import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EBE6E2] px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl md:text-9xl text-[#383B3A]">404</h1>
        <h2 className="mt-4 font-display text-2xl text-[#383B3A]">Stránka sa nenašla</h2>
        <p className="mt-3 text-sm text-[#726D6A]">
          Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] px-6 py-3 text-sm text-[#F5F1EC] hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)] transition-shadow"
          >
            Späť na domov
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#EBE6E2" },
      { title: "NU-U — Hostessing, promotion a produkcia eventov" },
      { name: "description", content: "Profesionálny hostessing, promotéri, helperi a kompletné personálne zabezpečenie eventov na Slovensku aj v zahraničí. 10+ rokov skúseností, 500+ eventov." },
      { property: "og:title", content: "NU-U — Hostessing, promotion a produkcia eventov" },
      { property: "og:description", content: "Ľudia, ktorí robia rozdiel na každom evente. Hostesky, promotéri a produkcia eventov na Slovensku aj v zahraničí." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "sk_SK" },
      { property: "og:site_name", content: "NU-U Agency" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NU-U — Hostessing, promotion a produkcia eventov" },
      { name: "twitter:description", content: "Ľudia, ktorí robia rozdiel na každom evente. Hostessing, promotion a produkcia na Slovensku aj v zahraničí." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4412c0ab-9c41-4a60-891c-39b81e0739f0" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4412c0ab-9c41-4a60-891c-39b81e0739f0" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23383B3A'/><text x='50%25' y='54%25' text-anchor='middle' dominant-baseline='middle' font-family='Georgia,serif' font-size='30' font-weight='600' fill='%23F5F1EC'>N</text></svg>" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sk">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
