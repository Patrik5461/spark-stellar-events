import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, X, ChevronLeft, ChevronRight, Shirt } from "lucide-react";
import { Navbar, Footer, BackToTop } from "@/components/site-chrome";
import { CLOTHING_CATEGORIES, type ClothingItem } from "@/lib/clothing-data";
import { useClothingImages } from "@/lib/use-clothing";

export const Route = createFileRoute("/prenajom-oblecenia")({
  head: () => ({
    meta: [
      { title: "Prenájom oblečenia — NU-U" },
      {
        name: "description",
        content:
          "Prenájom profesionálneho oblečenia — spoločenské šaty, saká, kabáty a doplnky pre hostesky a event staff.",
      },
      { property: "og:title", content: "Prenájom oblečenia — NU-U" },
      {
        property: "og:description",
        content:
          "Prenájom profesionálneho oblečenia — spoločenské šaty, saká, kabáty a doplnky pre hostesky a event staff.",
      },
    ],
    links: [{ rel: "canonical", href: "/prenajom-oblecenia" }],
  }),
  component: ClothingPage,
});

const EASE = [0.22, 1, 0.36, 1] as const;
type Filter = "all" | (typeof CLOTHING_CATEGORIES)[number]["value"];

function ClothingPage() {
  const { items, loading } = useClothingImages();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.category] = (c[it.category] ?? 0) + 1;
    return c;
  }, [items]);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [filter, items],
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="bg-[#EBE6E2] text-[#383B3A] overflow-x-hidden"
    >
      <Navbar />

      <section className="pt-40 md:pt-52 pb-12 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-6">
              <span className="h-px w-10 bg-[#726D6A]" /> Prenájom oblečenia
            </div>
            <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,6.5rem)] leading-[1] tracking-[-0.02em] text-[#383B3A] max-w-[18ch]">
              Prenájom oblečenia
            </h1>
            <p className="mt-8 max-w-[52ch] text-lg md:text-xl text-[#726D6A] leading-[1.7]">
              Výber oblečenia pre hostesky, event staff a spoločenské príležitosti.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-40">
        <div className="mx-auto max-w-7xl">
          {/* Filter row */}
          <div className="-mx-6 md:mx-0 mb-10">
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar px-6 md:px-0 md:flex-wrap snap-x snap-mandatory"
              role="tablist"
              aria-label="Kategórie oblečenia"
            >
              <FilterChip
                label="Všetko"
                count={counts.all ?? 0}
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              {CLOTHING_CATEGORIES.map((c) => (
                <FilterChip
                  key={c.value}
                  label={c.label}
                  count={counts[c.value] ?? 0}
                  active={filter === c.value}
                  onClick={() => setFilter(c.value)}
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-[#726D6A] py-24">Načítavam…</div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <ClothingGrid items={filtered} filterKey={filter} />
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

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`shrink-0 snap-start rounded-full px-4 md:px-5 py-2.5 text-sm transition-all border whitespace-nowrap ${
        active
          ? "bg-[#383B3A] text-[#F5F1EC] border-[#383B3A]"
          : "bg-transparent text-[#383B3A] border-[#D9D2CC] hover:bg-[#D4C7BD]/50"
      }`}
    >
      {label}
      <span className={`ml-2 text-xs ${active ? "text-[#F5F1EC]/70" : "text-[#726D6A]"}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mx-auto max-w-xl text-center py-16 md:py-24"
    >
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#D9D2CC] bg-[#F5F1EC] text-[#726D6A]">
        <Shirt className="h-7 w-7" strokeWidth={1.25} />
      </div>
      <h2 className="font-display text-3xl md:text-4xl text-[#383B3A]">
        Fotografie sa pripravujú
      </h2>
      <p className="mt-5 text-[#726D6A] leading-[1.7]">
        Do tejto kategórie momentálne pripravujeme fotografie.
      </p>
    </motion.div>
  );
}

function ClothingGrid({ items, filterKey }: { items: ClothingItem[]; filterKey: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const next = () => setOpen((v) => (v === null ? null : (v + 1) % items.length));
  const prev = () => setOpen((v) => (v === null ? null : (v - 1 + items.length) % items.length));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={filterKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
        >
          {items.map((im, i) => (
            <button
              type="button"
              onClick={() => setOpen(i)}
              key={im.id}
              className="group relative block w-full mb-6 break-inside-avoid overflow-hidden rounded-[24px] border border-[#D9D2CC] soft-shadow cursor-zoom-in text-left"
              aria-label={`Otvoriť ${im.title || "fotografiu"}`}
            >
              <img
                src={im.src}
                alt={im.title || "Prenájom oblečenia"}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#383B3A]/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {(im.title || im.description) && (
                <div className="pointer-events-none absolute left-5 bottom-5 right-5 flex items-center justify-between text-[#F5F1EC] text-xs tracking-[0.2em] uppercase translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="truncate">{im.title || im.description}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" />
                </div>
              )}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-[100] bg-[#383B3A]/90 backdrop-blur-sm p-6 flex items-center justify-center"
            onClick={() => setOpen(null)}
            onTouchStart={(e) => {
              touchStart.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStart.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStart.current;
              if (dx > 50) prev();
              else if (dx < -50) next();
              touchStart.current = null;
            }}
          >
            <motion.img
              key={open}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: EASE }}
              src={items[open].src}
              alt={items[open].title || "Prenájom oblečenia"}
              className="max-h-[86vh] max-w-[92vw] rounded-[24px] object-contain soft-shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full bg-[#F5F1EC]/90 text-[#383B3A] h-12 w-12 grid place-items-center hover:bg-[#F5F1EC] transition-all"
              aria-label="Predchádzajúci"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full bg-[#F5F1EC]/90 text-[#383B3A] h-12 w-12 grid place-items-center hover:bg-[#F5F1EC] transition-all"
              aria-label="Ďalší"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(null);
              }}
              className="absolute top-6 right-6 rounded-full bg-[#F5F1EC] text-[#383B3A] h-11 w-11 grid place-items-center hover:bg-[#C9BAAE] transition-colors"
              aria-label="Zavrieť"
            >
              <X className="h-4 w-4" />
            </button>
            {(items[open].title || items[open].description) && (
              <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[92vw] text-center text-[#F5F1EC]/85 text-xs md:text-sm px-4">
                {items[open].title && (
                  <div className="tracking-[0.2em] uppercase">{items[open].title}</div>
                )}
                {items[open].description && (
                  <div className="mt-1 text-[#F5F1EC]/70">{items[open].description}</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
