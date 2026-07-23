import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer, BackToTop } from "@/components/site-chrome";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/sluzby/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("services")
      .select("id,title,description,detail_content,is_active,slug")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.is_active) throw notFound();
    return { service: data };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.service?.title ?? "Služba";
    const d = loaderData?.service?.description ?? "";
    const title = `${t} — NU-U`;
    return {
      meta: [
        { title },
        { name: "description", content: d },
        { property: "og:title", content: title },
        { property: "og:description", content: d },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#F5F1EC] text-[#383B3A]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-4xl mb-4">Služba nebola nájdená</h1>
        <Link to="/" className="underline">Späť na hlavnú stránku</Link>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-[#F5F1EC] text-[#383B3A]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl mb-4">Chyba pri načítaní</h1>
        <p className="text-sm text-[#726D6A]">{error?.message ?? "Skúste to prosím neskôr."}</p>
      </main>
      <Footer />
    </div>
  ),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-[#F5F1EC] text-[#383B3A]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-24">
        <Link
          to="/"
          hash="services"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#726D6A] hover:text-[#383B3A] mb-10"
        >
          <ArrowLeft className="h-4 w-4" /> Späť na služby
        </Link>
        <div className="text-xs uppercase tracking-[0.3em] text-[#726D6A] mb-6">Služba</div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.05] tracking-tight mb-8">
          {service.title}
        </h1>
        {service.description && (
          <p className="text-lg text-[#5A5552] leading-relaxed mb-10">{service.description}</p>
        )}
        {service.detail_content ? (
          <div className="prose prose-neutral max-w-none text-[#383B3A] leading-relaxed whitespace-pre-wrap">
            {service.detail_content}
          </div>
        ) : (
          <p className="text-[#726D6A] italic">Podrobný popis tejto služby pripravujeme.</p>
        )}
        <div className="mt-16 pt-10 border-t border-[#D9D2CC]">
          <Link
            to="/"
            hash="contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-6 py-3 text-sm uppercase tracking-[0.2em]"
          >
            Nezáväzný dopyt
          </Link>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
