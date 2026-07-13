import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, ImageIcon, Upload } from "lucide-react";
import { Navbar, Footer, BackToTop } from "@/components/site-chrome";
import { GalleryGrid } from "@/components/gallery-grid";
import { useGalleryImages } from "@/lib/use-gallery";
import { useAdminAuth } from "@/lib/admin-auth";

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
  const { items, loading } = useGalleryImages();
  const { isAdmin } = useAdminAuth();

  const isEmpty = !loading && items.length === 0;

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
          {isEmpty ? (
            <GalleryEmptyState isAdmin={isAdmin} />
          ) : (
            <GalleryGrid items={items} />
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

function GalleryEmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
      className="mx-auto max-w-xl text-center py-16 md:py-24"
    >
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#D9D2CC] bg-[#F5F1EC] text-[#726D6A]">
        <ImageIcon className="h-7 w-7" strokeWidth={1.25} />
      </div>
      <h2 className="font-display text-3xl md:text-4xl text-[#383B3A]">
        Galéria sa pripravuje
      </h2>
      <p className="mt-5 text-[#726D6A] leading-[1.7]">
        Momentálne ešte nemáme zverejnené fotografie. Čoskoro tu nájdete ukážky našich realizácií.
      </p>
      {isAdmin && (
        <Link
          to="/admin/gallery"
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#383B3A] px-7 py-3.5 text-sm text-[#F5F1EC] transition-shadow hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)]"
        >
          <Upload className="h-4 w-4" strokeWidth={1.75} />
          Nahrať prvú fotografiu
        </Link>
      )}
    </motion.div>
  );
}
