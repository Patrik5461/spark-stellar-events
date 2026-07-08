import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/lib/gallery-data";

const EASE = [0.22, 1, 0.36, 1] as const;

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
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
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
        {items.map((im, i) => (
          <motion.button
            type="button"
            onClick={() => setOpen(i)}
            key={i + im.src}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: EASE }}
            className="group relative block w-full mb-6 break-inside-avoid overflow-hidden rounded-[24px] border border-[#D9D2CC] soft-shadow cursor-zoom-in text-left"
            aria-label={`Otvoriť ${im.alt}`}
          >
            <img
              src={im.src}
              alt={im.alt}
              loading="lazy"
              decoding="async"
              className="h-auto w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#383B3A]/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="pointer-events-none absolute left-5 bottom-5 right-5 flex items-center justify-between text-[#F5F1EC] text-xs tracking-[0.2em] uppercase translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <span>{im.cap}</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-[100] bg-[#383B3A]/90 backdrop-blur-sm p-6 flex items-center justify-center"
            onClick={() => setOpen(null)}
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
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
              alt={items[open].alt}
              className="max-h-[86vh] max-w-[92vw] rounded-[24px] object-contain soft-shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 rounded-full bg-[#F5F1EC]/90 text-[#383B3A] h-12 w-12 grid place-items-center hover:bg-[#F5F1EC] transition-all hover:-translate-x-0.5 hover:-translate-y-[calc(50%+2px)]"
              aria-label="Predchádzajúci"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 rounded-full bg-[#F5F1EC]/90 text-[#383B3A] h-12 w-12 grid place-items-center hover:bg-[#F5F1EC] transition-all hover:translate-x-0.5 hover:-translate-y-[calc(50%+2px)]"
              aria-label="Ďalší"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(null); }}
              className="absolute top-6 right-6 rounded-full bg-[#F5F1EC] text-[#383B3A] h-11 w-11 grid place-items-center hover:bg-[#C9BAAE] transition-colors"
              aria-label="Zavrieť"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[#F5F1EC]/80 text-xs tracking-[0.3em] uppercase">
              {String(open + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")} · {items[open].cap}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
