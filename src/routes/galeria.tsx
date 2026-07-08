import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Navbar, Footer, BackToTop } from "@/components/site-chrome";
import { GalleryGrid } from "@/components/gallery-grid";
import { GALLERY_ITEMS, GALLERY_CATEGORIES } from "@/lib/gallery-data";
import { useGalleryImages } from "@/lib/use-gallery";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galéria — NU-U" },
      { name: "description", content: "Výber z eventov, promo aktivít a realizácií NU-U. Hostessing, promotion, produkcia a helperi na Slovensku aj v zahraničí." },
      { property: "og:title", content: "Galéria — NU-U" },
      { property: "og:description", content: "Výber z eventov, promo aktivít a realizácií NU-U." },
    ],
    links: [{ rel: "canonical", href: "/galeria" }],
  }),
  component: GaleriaPage,
});

const EASE = [0.22, 1, 0.36, 1] as const;

function GaleriaPage() {
  const [filter, setFilter] = useState<(typeof GALLERY_CATEGORIES)[number]>("Všetko");
  const items = useMemo(
    () => (filter === "Všetko" ? GALLERY_ITEMS : GALLERY_ITEMS.filter((g) => g.category === filter)),
    [filter],
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="bg-[#EBE6E2] text-[#383B3A] overflow-x-hidden"
    >
      <Navbar />

      <section className="pt-40 md:pt-52 pb-16 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-6">
              <span className="h-px w-10 bg-[#726D6A]" /> Galéria
            </div>
            <h1 className="font-display font-semibold text-[clamp(3rem,8vw,7rem)] leading-[1] tracking-[-0.02em] text-[#383B3A] max-w-[16ch]">
              Galéria
            </h1>
            <p className="mt-8 max-w-[52ch] text-lg md:text-xl text-[#726D6A] leading-[1.7]">
              Výber z eventov, promo aktivít a realizácií NU-U.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-40">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-12"
          >
            {GALLERY_CATEGORIES.map((c) => {
              const active = filter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-5 py-2.5 text-sm transition-all border ${
                    active
                      ? "bg-[#383B3A] text-[#F5F1EC] border-[#383B3A]"
                      : "bg-transparent text-[#383B3A] border-[#D9D2CC] hover:bg-[#D4C7BD]/50"
                  }`}
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
          </motion.div>

          <GalleryGrid items={items} />

          {items.length === 0 && (
            <p className="text-center text-[#726D6A] py-20">
              V tejto kategórii zatiaľ nemáme zverejnené žiadne fotografie.
            </p>
          )}

          <div className="mt-20 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-3 rounded-full border border-[#383B3A] px-8 py-4 text-sm text-[#383B3A] transition-colors hover:bg-[#D4C7BD]/50"
            >
              Späť na domov
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </motion.main>
  );
}
