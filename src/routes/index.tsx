import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useInView, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Megaphone, HardHat, Users2, Clapperboard, Shirt,
  ArrowUpRight, Quote, Mail, Phone, MapPin, ChevronDown, Check,
  Instagram, Linkedin, Facebook, ArrowUp, X, ChevronLeft, ChevronRight,
} from "lucide-react";

import hero from "@/assets/hero.jpg";
import g1 from "@/assets/g1.jpg";
import g2 from "@/assets/g2.jpg";
import g3 from "@/assets/g3.jpg";
import g4 from "@/assets/g4.jpg";
import g5 from "@/assets/g5.jpg";
import g6 from "@/assets/g6.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NU-U — Hostessing & Event Staffing Agency" },
      { name: "description", content: "Eventy, ktoré majú drive. Ľudia, ktorí majú iskru. Premium hostessing, promo a produkcia eventov." },
      { property: "og:title", content: "NU-U — Premium Hostessing Agency" },
      { property: "og:description", content: "Nerobíme len komparz. Tvoríme tímy, ktoré predávajú, reprezentujú a riešia." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8, ease: EASE },
};

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState<string>(value);
  useEffect(() => {
    const match = value.match(/^(\d+)(.*)$/);
    if (!match) { setDisplay(value); return; }
    if (!inView) { setDisplay("0" + match[2]); return; }
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const controls = animate(0, target, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.round(v) + suffix),
    });
    return () => controls.stop();
  }, [inView, value]);
  return <span ref={ref}>{display}</span>;
}

function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <h1 className={className} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} className="inline-block overflow-hidden align-baseline mr-[0.25em] last:mr-0">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.05, delay: 0.25 + wi * 0.06, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}


function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const links: [string, string][] = [
    ["O nás", "#why"],
    ["Služby", "#services"],
    ["Galéria", "#gallery"],
    ["Kontakt", "#contact"],
  ];
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive("#" + e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    links.forEach(([, h]) => {
      const el = document.querySelector(h);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", fn);
      io.disconnect();
    };
  }, []);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3 bg-[#EBE6E2]/75 backdrop-blur-xl border-b border-[#D9D2CC]/70" : "py-6 bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <motion.a
          href="#"
          whileHover={{ letterSpacing: "0.08em" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="font-display text-2xl tracking-tight text-[#383B3A] inline-block"
        >
          NU<motion.span className="text-[#726D6A] inline-block" whileHover={{ rotate: 180 }} transition={{ duration: 0.6, ease: EASE }}>·</motion.span>U
        </motion.a>
        <nav className="hidden md:flex items-center justify-center gap-2 text-sm text-[#726D6A]">
          {links.map(([l, h]) => {
            const isActive = active === h;
            return (
              <a
                key={h}
                href={h}
                className="relative px-4 py-2 transition-colors hover:text-[#383B3A]"
              >
                <span className={isActive ? "text-[#383B3A]" : ""}>{l}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-[#D4C7BD]/60"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>
        <a
          href="#contact"
          className="group hidden sm:inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm transition-all hover:shadow-[0_10px_30px_-10px_rgba(56,59,58,0.5)] hover:-translate-y-0.5"
        >
          Kontakt <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </header>
  );
}


function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  return (
    <section ref={ref} className="relative min-h-[96vh] flex flex-col pt-36 md:pt-44 pb-16 px-6">
      <div className="mx-auto max-w-7xl w-full flex-1 flex flex-col">
        <motion.div
          style={{ y: textY }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-12"
        >
          <span className="h-px w-10 bg-[#726D6A]" />
          Hostessing · Promo · Produkcia
        </motion.div>

        <motion.div style={{ y: textY }}>
          <AnimatedHeadline
            text="Ľudia, ktorí robia rozdiel na každom evente."
            className="font-display font-semibold text-[clamp(3rem,9vw,8.5rem)] leading-[0.98] tracking-[-0.02em] text-balance text-[#383B3A] max-w-[18ch]"
          />
        </motion.div>

        <div className="mt-16 grid md:grid-cols-2 gap-10 items-end">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-[52ch] text-lg md:text-xl text-[#726D6A] leading-[1.7]"
          >
            Profesionálny hostessing, promotéri, helperi a kompletné
            personálne zabezpečenie eventov na Slovensku aj v zahraničí.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-4 md:justify-end"
          >
            <motion.a
              href="#contact"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 rounded-full bg-[#383B3A] px-8 py-4 text-sm font-medium text-[#F5F1EC] transition-shadow duration-500 hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)]"
            >
              Kontaktujte nás
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
            <motion.a
              href="#services"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 rounded-full border border-[#383B3A] px-8 py-4 text-sm text-[#383B3A] transition-colors hover:bg-[#D4C7BD]/50"
            >
              Naše služby
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 rounded-[28px] overflow-hidden soft-shadow-lg border border-[#D9D2CC]"
        >
          <div className="relative aspect-[16/8] w-full overflow-hidden">
            <motion.img
              src={hero}
              alt="Elegantná hosteska na luxusnom evente"
              style={{ y: imgY, scale: imgScale }}
              className="h-full w-full object-cover will-change-transform"
              width={1920}
              height={1080}
              loading="eager"
              decoding="async"
              // @ts-expect-error valid HTML hint
              fetchpriority="high"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#383B3A]/[0.08]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#383B3A]/25 to-transparent" />
          </div>
        </motion.div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-[#726D6A]">
            <ChevronDown className="h-4 w-4 animate-scroll-hint" />
            Scroll
          </div>
          <div className="hidden md:block max-w-xs text-sm text-[#726D6A] text-right">
            10+ rokov na trhu · 500+ eventov · Slovensko & zahraničie
          </div>
        </div>
      </div>
    </section>
  );
}


function Marquee() {
  const clients = [
    "RED BULL", "SAMSUNG", "L'ORÉAL", "BMW", "HEINEKEN", "ORANGE",
    "ZARA", "TATRA BANKA", "PEPSI", "MERCEDES", "VOLKSWAGEN", "ESET",
  ];
  const row = [...clients, ...clients, ...clients];
  return (
    <section className="border-y border-[#D9D2CC] py-12 overflow-hidden bg-[#EBE6E2]">
      <div className="text-center text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-8">
        Dôverujú nám
      </div>
      <div className="flex gap-16 animate-marquee whitespace-nowrap mb-6">
        {row.map((c, i) => (
          <span key={i} className="font-display text-2xl md:text-3xl text-[#726D6A]/50 hover:text-[#383B3A] transition-colors tracking-wider select-none">
            {c}
          </span>
        ))}
      </div>
      <div className="flex gap-16 animate-marquee-reverse whitespace-nowrap">
        {[...row].reverse().map((c, i) => (
          <span key={i} className="font-display text-2xl md:text-3xl text-[#726D6A]/35 hover:text-[#383B3A] transition-colors tracking-wider select-none">
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

function SectionEyebrow({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-6">
      <span className="h-px w-10 bg-[#726D6A]" /> {n} — {label}
    </div>
  );
}

function Services() {
  const items = [
    { icon: Sparkles, title: "Hostessing", desc: "Profesionálne hostesky pre konferencie, výstavy, firemné akcie a spoločenské podujatia.", img: g1, span: "md:col-span-2 lg:row-span-2 min-h-[360px] lg:min-h-[520px]" },
    { icon: Megaphone, title: "Promotion", desc: "Promotéri pre sampling, promo kampane a prezentáciu značiek.", img: g3, span: "min-h-[280px] lg:min-h-[250px]" },
    { icon: HardHat, title: "Helperi", desc: "Spoľahlivý personál pre montáže, logistiku a realizáciu eventov.", img: g5, span: "min-h-[280px] lg:min-h-[250px]" },
    { icon: Clapperboard, title: "Produkcia", desc: "Kompletná organizačná podpora a produkcia eventov.", img: g2, span: "min-h-[280px] lg:min-h-[250px] lg:col-span-1" },
    { icon: Shirt, title: "Prenájom oblečenia", desc: "Prenájom profesionálneho oblečenia pre hostesky a event staff.", img: g6, span: "min-h-[280px] lg:min-h-[250px]" },
    { icon: Users2, title: "Ostatné", desc: "Individuálne personálne riešenia podľa požiadaviek klienta.", img: g4, span: "min-h-[280px] lg:min-h-[250px]" },
  ];
  return (
    <section id="services" className="relative py-40 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="flex items-end justify-between flex-wrap gap-8 mb-20">
          <div>
            <SectionEyebrow n="01" label="Služby" />
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight max-w-3xl text-[#383B3A]">
              Všetko, čo váš event <em className="italic text-[#726D6A]">potrebuje.</em>
            </h2>
          </div>
          <p className="max-w-sm text-[#726D6A]">
            Šesť disciplín, jeden tím. Nemusíte koordinovať desať
            dodávateľov — my to máme pod jednou strechou.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
          {items.map(({ icon: Icon, title, desc, img, span }, i) => (
            <motion.a
              href="#contact"
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
              whileHover={{ y: -6 }}
              className={`group relative card-surface rounded-[24px] p-10 flex flex-col justify-between overflow-hidden transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(56,59,58,0.22)] ${span}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[900ms] ease-out"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(245,241,236,0.86) 0%, rgba(245,241,236,0.72) 60%, rgba(245,241,236,0.9) 100%), url(${img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl border border-[#D9D2CC] bg-[#EBE6E2]/70 grid place-items-center group-hover:bg-[#F5F1EC] group-hover:border-[#C9BAAE] transition-colors duration-500">
                  <Icon className="h-5 w-5 text-[#383B3A]" strokeWidth={1.25} />
                </div>
                <span className="font-display text-sm text-[#726D6A]/70 tracking-widest">0{i + 1}</span>
              </div>
              <div className="relative mt-10">
                <h3 className="font-display text-2xl md:text-3xl mb-3 text-[#383B3A]">{title}</h3>
                <p className="text-sm md:text-base text-[#726D6A] leading-relaxed max-w-[46ch]">{desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#383B3A]">
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">Viac informácií</span>
                  <span className="inline-block transition-transform duration-500 ease-out group-hover:translate-x-1">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const stats = [
    ["10+", "rokov skúseností"],
    ["500+", "úspešných eventov"],
    ["1000+", "personálnych obsadení"],
    ["SK & EU", "Slovensko & zahraničie"],
  ];
  return (
    <section id="why" className="relative py-40 px-6 bg-[#D4C7BD]/40">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...fadeUp} className="relative">
          <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden soft-shadow-lg border border-[#D9D2CC]">
            <img src={g4} alt="Profesionálna hosteska" loading="lazy" width={1024} height={1280} className="h-full w-full object-cover" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="absolute -bottom-8 -right-4 card-surface rounded-2xl p-6 max-w-[240px] hidden md:block"
          >
            <div className="font-display text-4xl text-[#383B3A]"><AnimatedNumber value="98%" /></div>
            <div className="text-xs text-[#726D6A] mt-2">klientov sa k nám vracia</div>
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp}>
          <SectionEyebrow n="02" label="Prečo NU-U" />
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight text-[#383B3A]">
            Nie agentúra. <em className="italic text-[#726D6A]">Partner</em> pre vašu značku.
          </h2>
          <p className="mt-8 text-[#726D6A] leading-relaxed max-w-lg">
            Vyberáme ľudí, ktorých by sme s pokojom poslali aj na vlastnú
            svadbu. Trénujeme ich, oblečieme a postavíme za nimi celý
            backoffice — vy len dostanete výsledok.
          </p>

          <ul className="mt-8 space-y-3">
            {["Osobný projektový manažér 24/7", "Vlastné premium uniformy", "Záložný tím pre každý event", "Reporting a foto z miesta"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-[#383B3A]">
                <Check className="h-4 w-4 text-[#383B3A] shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {stats.map(([n, l]) => (
              <div key={l} className="card-surface rounded-2xl p-6 md:p-8">
                <div className="font-display text-4xl md:text-5xl text-[#383B3A]">
                  {/^\d+/.test(n) ? <AnimatedNumber value={n} /> : n}
                </div>
                <div className="text-xs text-[#726D6A] mt-2 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Gallery() {
  const imgs = [
    { src: g1, alt: "Hostesky na gala evente", cap: "Gala večer · Bratislava" },
    { src: g2, alt: "Pódium produktového launchu", cap: "Product launch · Viedeň" },
    { src: g6, alt: "Champagne na gala večeri", cap: "VIP recepcia" },
    { src: g3, alt: "Promotéri na veľtrhu", cap: "Veľtrh · Praha" },
    { src: g5, alt: "Backstage produkcia", cap: "Backstage · Produkcia" },
    { src: g4, alt: "Portrét hostesky", cap: "Editorial portrét" },
  ];
  const [open, setOpen] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const next = () => setOpen((v) => (v === null ? null : (v + 1) % imgs.length));
  const prev = () => setOpen((v) => (v === null ? null : (v - 1 + imgs.length) % imgs.length));
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
  }, [open]);
  return (
    <section id="gallery" className="relative py-40 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="flex items-end justify-between gap-8 mb-16 flex-wrap">
          <div>
            <SectionEyebrow n="03" label="Galéria" />
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight text-[#383B3A]">
              Momenty, ktoré <em className="italic text-[#726D6A]">hovoria.</em>
            </h2>
          </div>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {imgs.map((im, i) => (
            <motion.button
              type="button"
              onClick={() => setOpen(i)}
              key={i}
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
              src={imgs[open].src}
              alt={imgs[open].alt}
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
              {String(open + 1).padStart(2, "0")} / {String(imgs.length).padStart(2, "0")} · {imgs[open].cap}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


function Process() {
  const steps = [
    ["01", "Brief", "Zistíme cieľ, publikum a tonalitu. Žiadne formuláre — len rozhovor."],
    ["02", "Výber tímu", "Castingujeme ľudí presne na váš event a značku."],
    ["03", "Realizácia", "Sme na mieste, koordinujeme a riešime všetko za vás."],
    ["04", "Vyhodnotenie", "Report, fotky, feedback. A plán pre ďalší event."],
  ];
  return (
    <section id="process" className="relative py-40 px-6 bg-[#D4C7BD]/40">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-6">
            <span className="h-px w-10 bg-[#726D6A]" /> 04 — Proces
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight text-[#383B3A]">
            Štyri kroky, <em className="italic text-[#726D6A]">nula stresu.</em>
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-4 gap-8">
          <div className="absolute left-0 right-0 top-12 h-px bg-[#D9D2CC] hidden md:block" />
          {steps.map(([n, t, d], i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative"
            >
              <div className="relative z-10 h-24 w-24 mx-auto mb-6 rounded-full bg-[#F5F1EC] border border-[#D9D2CC] grid place-items-center soft-shadow">
                <span className="font-display text-2xl text-[#383B3A]">{n}</span>
              </div>
              <h3 className="font-display text-2xl text-center mb-3 text-[#383B3A]">{t}</h3>
              <p className="text-sm text-[#726D6A] text-center leading-relaxed max-w-[240px] mx-auto">{d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "NU-U je jediná agentúra, s ktorou už neriešim, či to dopadne. Tím je vždy pripravený, milý a profesionálny.", n: "Lucia K.", r: "Brand Manager, FMCG" },
    { q: "Spravili nám produkciu launchu na poslednú chvíľu a vyzeralo to ako rok plánovania. Klobúk dole.", n: "Martin P.", r: "Marketing Director" },
    { q: "Hostesky, ktoré naozaj predávajú. Zdvojnásobili sme leady oproti minulému roku na rovnakom veľtrhu.", n: "Eva S.", r: "Event Lead, Automotive" },
  ];
  return (
    <section className="py-40 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="mb-16">
          <SectionEyebrow n="05" label="Referencie" />
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl text-[#383B3A]">
            Hovoria <em className="italic text-[#726D6A]">za nás.</em>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {t.map((x, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative card-surface rounded-[24px] p-8 flex flex-col justify-between min-h-[320px]"
            >
              <Quote className="h-10 w-10 text-[#C9BAAE]" strokeWidth={1} />
              <p className="my-6 text-lg text-[#383B3A] leading-relaxed font-display italic">"{x.q}"</p>
              <div className="flex items-center gap-3 pt-6 border-t border-[#D9D2CC]">
                <div className="h-10 w-10 rounded-full bg-[#383B3A] grid place-items-center text-[#F5F1EC] font-medium text-sm">
                  {x.n.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#383B3A]">{x.n}</div>
                  <div className="text-xs text-[#726D6A]">{x.r}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner() {
  return (
    <section className="py-32 px-6">
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-6xl rounded-[28px] overflow-hidden bg-[#383B3A] soft-shadow-lg"
      >
        <div className="relative px-8 py-20 md:py-28 md:px-16 text-center">
          <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight max-w-4xl mx-auto text-balance text-[#F5F1EC]">
            Váš úspech je <em className="italic text-[#C9BAAE]">naša vizitka.</em>
          </h2>
          <p className="mt-6 text-[#F5F1EC]/70 max-w-xl mx-auto">
            Pošlite nám zadanie. Do 24 hodín dostanete návrh tímu, ceny a plán.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#F5F1EC] px-8 py-4 text-sm font-medium text-[#383B3A] hover:bg-[#C9BAAE] transition-all"
          >
            Poďme do toho spolu
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="py-40 px-6">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16">
        <motion.div {...fadeUp}>
          <SectionEyebrow n="06" label="Kontakt" />
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight text-[#383B3A]">
            Povedzte nám o vašom <em className="italic text-[#726D6A]">evente.</em>
          </h2>
          <p className="mt-6 text-[#726D6A] max-w-md">
            Odpovedáme do 24 hodín. Bez šablón, bez auto-mailov — odpíše vám konkrétny človek.
          </p>

          <div className="mt-12 space-y-5">
            {[
              [Mail, "info@nu-u.sk", "mailto:info@nu-u.sk"],
              [Phone, "+421 900 000 000", "tel:+421900000000"],
              [MapPin, "Bratislava, Slovensko", "#"],
            ].map(([Icon, label, href], i) => {
              const I = Icon as typeof Mail;
              return (
                <a key={i} href={href as string} className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-full border border-[#D9D2CC] bg-[#F5F1EC] grid place-items-center group-hover:bg-[#C9BAAE]/50 transition-colors">
                    <I className="h-4 w-4 text-[#383B3A]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[#383B3A] group-hover:text-[#726D6A] transition-colors">{label as string}</span>
                </a>
              );
            })}
          </div>

          <div className="mt-10 aspect-[2/1] rounded-[24px] overflow-hidden border border-[#D9D2CC] soft-shadow">
            <iframe
              title="Mapa"
              src="https://www.openstreetmap.org/export/embed.html?bbox=17.05%2C48.13%2C17.18%2C48.18&layer=mapnik"
              className="w-full h-full"
              style={{ filter: "grayscale(1) contrast(0.95) sepia(0.15)" }}
              loading="lazy"
            />
          </div>
        </motion.div>

        <ContactForm />

      </div>
    </section>
  );
}

function FloatingField({
  label, type = "text", as = "input", name,
}: { label: string; type?: string; as?: "input" | "textarea"; name: string }) {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const active = focus || val.length > 0;
  const common = "peer w-full bg-transparent px-5 pt-7 pb-3 text-[#383B3A] outline-none placeholder-transparent";
  return (
    <label className="relative block rounded-2xl border border-[#D9D2CC] bg-[#F5F1EC]/60 transition-all duration-300 focus-within:border-[#383B3A] focus-within:bg-[#F5F1EC] focus-within:shadow-[0_10px_30px_-15px_rgba(56,59,58,0.25)]">
      {as === "textarea" ? (
        <textarea
          name={name} rows={4} placeholder={label}
          value={val} onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          className={common + " resize-none"}
        />
      ) : (
        <input
          type={type} name={name} placeholder={label}
          value={val} onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          className={common}
        />
      )}
      <span
        className={`pointer-events-none absolute left-5 transition-all duration-300 ${
          active ? "top-2 text-[10px] tracking-[0.25em] uppercase text-[#726D6A]" : "top-5 text-base text-[#726D6A]/70"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <motion.form
      {...fadeUp}
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="relative card-surface rounded-[28px] p-8 md:p-10 h-fit overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="py-16 text-center"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto h-16 w-16 rounded-full bg-[#383B3A] grid place-items-center"
            >
              <Check className="h-7 w-7 text-[#F5F1EC]" strokeWidth={1.75} />
            </motion.div>
            <h3 className="mt-6 font-display text-3xl text-[#383B3A]">Ďakujeme.</h3>
            <p className="mt-3 text-[#726D6A] max-w-sm mx-auto">
              Vaša správa je u nás. Odpíše vám konkrétny človek do 24 hodín.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-8 text-xs uppercase tracking-[0.25em] text-[#726D6A] hover:text-[#383B3A] transition-colors"
            >
              Nová správa
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <FloatingField label="Meno" name="name" />
            <FloatingField label="Email" name="email" type="email" />
            <FloatingField label="Telefón" name="phone" type="tel" />
            <FloatingField label="Správa" name="message" as="textarea" />
            <motion.button
              type="submit"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group w-full inline-flex items-center justify-center gap-3 rounded-full bg-[#383B3A] px-8 py-4 text-sm font-medium text-[#F5F1EC] transition-shadow duration-500 hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)]"
            >
              Odoslať dopyt
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>
            <p className="text-xs text-[#726D6A] text-center">
              Odoslaním súhlasíte so spracovaním osobných údajov.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 600);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.35, ease: EASE }}
          aria-label="Späť hore"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-[#383B3A] text-[#F5F1EC] grid place-items-center soft-shadow hover:shadow-[0_20px_50px_-15px_rgba(56,59,58,0.55)] transition-shadow"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Footer() {
  const nav: [string, string][] = [
    ["O nás", "#why"],
    ["Služby", "#services"],
    ["Galéria", "#gallery"],
    ["Kontakt", "#contact"],
  ];
  const socials = [
    [Instagram, "https://instagram.com", "Instagram"],
    [Linkedin, "https://linkedin.com", "LinkedIn"],
    [Facebook, "https://facebook.com", "Facebook"],
  ] as const;
  return (
    <footer className="border-t border-[#D9D2CC] pt-20 pb-10 px-6 bg-[#EBE6E2]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mx-auto max-w-7xl"
      >
        <div className="grid md:grid-cols-3 gap-10 pb-14 border-b border-[#D9D2CC]">
          <div>
            <div className="font-display text-3xl text-[#383B3A]">NU<span className="text-[#726D6A]">·</span>U</div>
            <p className="mt-4 text-sm text-[#726D6A] max-w-xs leading-relaxed">
              Hostessing, promotion a produkcia eventov. Slovensko & zahraničie.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A] mb-4">Navigácia</div>
            <ul className="space-y-2 text-sm">
              {nav.map(([l, h]) => (
                <li key={h}><a href={h} className="text-[#383B3A] hover:text-[#726D6A] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A] mb-4">Kontakt</div>
            <ul className="space-y-2 text-sm text-[#383B3A]">
              <li><a href="mailto:info@nu-u.sk" className="hover:text-[#726D6A] transition-colors">info@nu-u.sk</a></li>
              <li><a href="tel:+421900000000" className="hover:text-[#726D6A] transition-colors">+421 900 000 000</a></li>
              <li className="text-[#726D6A]">Bratislava, Slovensko</li>
            </ul>
            <div className="mt-5 flex gap-3">
              {socials.map(([Icon, href, label]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-10 w-10 rounded-full border border-[#D9D2CC] bg-[#F5F1EC] grid place-items-center text-[#383B3A] hover:bg-[#C9BAAE]/50 hover:-translate-y-0.5 transition-all"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[#726D6A]">
          <div>© {new Date().getFullYear()} NU-U Agency · www.nu-u.sk</div>
          <div>Handcrafted in Bratislava</div>
        </div>
      </motion.div>
    </footer>
  );
}




function Home() {
  return (
    <main className="bg-[#EBE6E2] text-[#383B3A] overflow-x-hidden">
      <Navbar />
      <Hero />
      <Marquee />
      <Services />
      <WhyUs />
      <Gallery />
      <Process />
      <Testimonials />
      <CTABanner />
      <Contact />
      <Footer />
      <BackToTop />
    </main>
  );
}
