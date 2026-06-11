import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Megaphone, HardHat, Users2, Clapperboard, Shirt,
  ArrowUpRight, Quote, Mail, Phone, MapPin, ChevronDown, Check,
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

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links = [
    ["Služby", "#services"],
    ["O nás", "#why"],
    ["Galéria", "#gallery"],
    ["Proces", "#process"],
    ["Kontakt", "#contact"],
  ];
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3 backdrop-blur-xl bg-black/60 border-b border-white/5" : "py-6"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <a href="#" className="font-display text-2xl tracking-tight">
          NU<span className="gold-text">·</span>U
        </a>
        <nav className="hidden md:flex items-center justify-center gap-10 text-sm text-white/70">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="hover:text-white transition-colors">{l}</a>
          ))}
        </nav>
        <a
          href="#contact"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white hover:text-black transition-all"
        >
          Nezáväzná ponuka <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  return (
    <section ref={ref} className="relative min-h-screen w-full overflow-hidden grain">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <img
          src={hero}
          alt="Elegantná hosteska na luxusnom evente"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-40 pb-28 min-h-screen flex flex-col justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/60"
        >
          <span className="h-px w-10 bg-gold" />
          Hostessing · Promo · Produkcia
        </motion.div>

        <div className="max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(2.75rem,7vw,6.5rem)] leading-[1.02] tracking-tight text-balance"
          >
            Eventy, ktoré majú <em className="italic gold-text">drive.</em>
            <br />
            Ľudia, ktorí majú <em className="italic gold-text">iskru.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 max-w-xl text-lg text-white/70 leading-relaxed"
          >
            Nerobíme len komparz. Tvoríme tímy, ktoré predávajú,
            reprezentujú a riešia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-medium text-black hover:bg-gold-soft transition-all"
            >
              Nezáväzná ponuka
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-4 text-sm hover:bg-white/5 transition-all"
            >
              Naše služby
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="flex items-end justify-between gap-6"
        >
          <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-white/50">
            <ChevronDown className="h-4 w-4 animate-scroll-hint" />
            Scroll
          </div>
          <div className="hidden md:block max-w-xs text-sm text-white/50">
            10+ rokov na trhu · 500+ eventov · Slovensko & zahraničie
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PartnersStrip() {
  const partners = [
    "RED BULL", "SAMSUNG", "L'ORÉAL", "BMW", "HEINEKEN",
    "ORANGE", "ZARA", "TATRA BANKA", "PEPSI", "MERCEDES",
  ];
  return (
    <section className="border-y border-white/5 bg-[#0d0d0d]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-[11px] tracking-[0.25em] uppercase text-white/30 mb-8">
          Dôverujú nám značky ako
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-5">
          {partners.map((p) => (
            <span
              key={p}
              className="font-display text-sm md:text-base tracking-[0.15em] uppercase text-white/40 hover:text-gold transition-colors duration-300 cursor-default"
            >
              {p}
            </span>
          ))}
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
  const row = [...clients, ...clients];
  return (
    <section className="border-y border-white/5 py-10 overflow-hidden">
      <div className="text-center text-xs tracking-[0.3em] uppercase text-white/40 mb-8">
        Dôverujú nám
      </div>
      <div className="flex gap-16 animate-marquee whitespace-nowrap">
        {row.map((c, i) => (
          <span key={i} className="font-display text-2xl md:text-3xl text-white/30 hover:text-white/70 transition-colors tracking-wider">
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const items = [
    { icon: Sparkles, title: "Hostessing", desc: "Reprezentatívne hostesky na eventy, veľtrhy a VIP recepcie." },
    { icon: Megaphone, title: "Promotéri", desc: "Aktívny tím, ktorý naozaj predáva a komunikuje vašu značku." },
    { icon: HardHat, title: "Helperi", desc: "Spoľahlivá ruka pre stavbu, logistiku a runner služby na mieste." },
    { icon: Users2, title: "Event Staff", desc: "Servis, registrácia, garderoba — celý prevádzkový tím v jednom." },
    { icon: Clapperboard, title: "Produkcia eventov", desc: "Od konceptu po realizáciu. Bez kompromisov, na čas." },
    { icon: Shirt, title: "Prenájom oblečenia", desc: "Vlastné kolekcie uniforiem v premium kvalite a strihu." },
  ];
  return (
    <section id="services" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="flex items-end justify-between flex-wrap gap-8 mb-20">
          <div>
            <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
              <span className="h-px w-10 bg-gold" /> 01 — Služby
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight max-w-3xl">
              Všetko, čo váš event <em className="italic gold-text">potrebuje.</em>
            </h2>
          </div>
          <p className="max-w-sm text-white/60">
            Šesť disciplín, jeden tím. Nemusíte koordinovať desať
            dodávateľov — my to máme pod jednou strechou.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group relative bg-[#0A0A0A] p-10 hover:bg-[#111] transition-colors duration-500 min-h-[280px] flex flex-col justify-between"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(217,185,142,0.08), transparent 40%)" }}
              />
              <div className="relative flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl border border-white/10 grid place-items-center group-hover:border-gold/40 group-hover:bg-gold/5 transition-all">
                  <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-white/30">0{i + 1}</span>
              </div>
              <div className="relative">
                <h3 className="font-display text-2xl mb-3">{title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500">
                  Viac <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </motion.div>
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
    <section id="why" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...fadeUp} className="relative">
          <div className="absolute -inset-4 bg-gold/10 blur-3xl rounded-full" />
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
            <img src={g4} alt="Profesionálna hosteska" loading="lazy" width={1024} height={1280} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-8 -right-4 glass rounded-2xl p-6 max-w-[240px] hidden md:block">
            <div className="font-display text-4xl gold-text">98%</div>
            <div className="text-xs text-white/60 mt-2">klientov sa k nám vracia</div>
          </div>
        </motion.div>

        <motion.div {...fadeUp}>
          <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
            <span className="h-px w-10 bg-gold" /> 02 — Prečo NU-U
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Nie agentúra. <em className="italic gold-text">Partner</em> pre vašu značku.
          </h2>
          <p className="mt-8 text-white/65 leading-relaxed max-w-lg">
            Vyberáme ľudí, ktorých by sme s pokojom poslali aj na vlastnú
            svadbu. Trénujeme ich, oblečieme a postavíme za nimi celý
            backoffice — vy len dostanete výsledok.
          </p>

          <ul className="mt-8 space-y-3">
            {["Osobný projektový manažér 24/7", "Vlastné premium uniformy", "Záložný tím pre každý event", "Reporting a foto z miesta"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-white/75">
                <Check className="h-4 w-4 text-gold shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {stats.map(([n, l]) => (
              <div key={l} className="bg-[#0A0A0A] p-6 md:p-8">
                <div className="font-display text-4xl md:text-5xl gold-text">{n}</div>
                <div className="text-xs text-white/55 mt-2 uppercase tracking-wider">{l}</div>
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
    { src: g1, h: "row-span-2", alt: "Hostesky na gala evente" },
    { src: g2, h: "", alt: "Pódium produktového launchu" },
    { src: g6, h: "", alt: "Champagne na gala večeri" },
    { src: g3, h: "", alt: "Promotéri na veľtrhu" },
    { src: g5, h: "row-span-2", alt: "Backstage produkcia" },
  ];
  return (
    <section id="gallery" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="flex items-end justify-between gap-8 mb-16 flex-wrap">
          <div>
            <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
              <span className="h-px w-10 bg-gold" /> 03 — Galéria
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight">
              Momenty, ktoré <em className="italic gold-text">hovoria.</em>
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-[200px] md:grid-rows-[260px] auto-rows-[200px] md:auto-rows-[260px] gap-4">
          {imgs.map((im, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-xl ${im.h}`}
            >
              <img
                src={im.src}
                alt={im.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
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
    <section id="process" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
            <span className="h-px w-10 bg-gold" /> 04 — Proces
          </div>
          <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight">
            Štyri kroky, <em className="italic gold-text">nula stresu.</em>
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-4 gap-8">
          <div className="absolute left-0 right-0 top-12 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent hidden md:block" />
          {steps.map(([n, t, d], i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative"
            >
              <div className="relative z-10 h-24 w-24 mx-auto mb-6 rounded-full glass grid place-items-center">
                <span className="font-display text-2xl gold-text">{n}</span>
              </div>
              <h3 className="font-display text-2xl text-center mb-3">{t}</h3>
              <p className="text-sm text-white/55 text-center leading-relaxed max-w-[240px] mx-auto">{d}</p>
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
    <section className="py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="mb-16">
          <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
            <span className="h-px w-10 bg-gold" /> 05 — Referencie
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl">
            Hovoria <em className="italic gold-text">za nás.</em>
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
              className="relative glass rounded-2xl p-8 flex flex-col justify-between min-h-[320px]"
            >
              <Quote className="h-10 w-10 text-gold/40" strokeWidth={1} />
              <p className="my-6 text-lg text-white/85 leading-relaxed font-display italic">"{x.q}"</p>
              <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold/40 grid place-items-center text-black font-medium text-sm">
                  {x.n.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{x.n}</div>
                  <div className="text-xs text-white/50">{x.r}</div>
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
        className="relative mx-auto max-w-6xl rounded-3xl overflow-hidden grain"
      >
        <img src={g2} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/60" />
        <div className="relative px-8 py-20 md:py-28 md:px-16 text-center">
          <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight max-w-4xl mx-auto text-balance">
            Váš úspech je <em className="italic gold-text">naša vizitka.</em>
          </h2>
          <p className="mt-6 text-white/65 max-w-xl mx-auto">
            Pošlite nám zadanie. Do 24 hodín dostanete návrh tímu, ceny
            a plán.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 text-sm font-medium text-black hover:bg-gold-soft transition-all"
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
    <section id="contact" className="py-32 px-6">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16">
        <motion.div {...fadeUp}>
          <div className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-white/50 mb-6">
            <span className="h-px w-10 bg-gold" /> 06 — Kontakt
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Povedzte nám o vašom <em className="italic gold-text">evente.</em>
          </h2>
          <p className="mt-6 text-white/65 max-w-md">
            Odpovedáme do 24 hodín. Bez šablón, bez auto-mailov —
            odpíše vám konkrétny človek.
          </p>

          <div className="mt-12 space-y-5">
            {[
              [Mail, "hello@nu-u.sk", "mailto:hello@nu-u.sk"],
              [Phone, "+421 900 000 000", "tel:+421900000000"],
              [MapPin, "Bratislava, Slovensko", "#"],
            ].map(([Icon, label, href], i) => {
              const I = Icon as typeof Mail;
              return (
                <a key={i} href={href as string} className="flex items-center gap-4 group">
                  <div className="h-11 w-11 rounded-full border border-white/10 grid place-items-center group-hover:border-gold/40 transition-colors">
                    <I className="h-4 w-4 text-gold" strokeWidth={1.5} />
                  </div>
                  <span className="text-white/80 group-hover:text-white transition-colors">{label as string}</span>
                </a>
              );
            })}
          </div>

          <div className="mt-10 aspect-[2/1] rounded-2xl overflow-hidden border border-white/10">
            <iframe
              title="Mapa"
              src="https://www.openstreetmap.org/export/embed.html?bbox=17.05%2C48.13%2C17.18%2C48.18&layer=mapnik"
              className="w-full h-full grayscale contrast-125 invert opacity-80"
              loading="lazy"
            />
          </div>
        </motion.div>

        <motion.form
          {...fadeUp}
          onSubmit={(e) => { e.preventDefault(); alert("Ďakujeme! Ozveme sa do 24h."); }}
          className="glass rounded-2xl p-8 md:p-10 h-fit"
        >
          <div className="space-y-6">
            {[
              { l: "Meno", t: "text", p: "Jana Nováková" },
              { l: "Email", t: "email", p: "jana@firma.sk" },
              { l: "Firma", t: "text", p: "Nepovinné" },
            ].map((f) => (
              <div key={f.l}>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">{f.l}</label>
                <input
                  type={f.t}
                  placeholder={f.p}
                  className="w-full bg-transparent border-b border-white/15 pb-3 text-white placeholder:text-white/30 focus:border-gold outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">O evente</label>
              <textarea
                rows={4}
                placeholder="Termín, lokácia, počet ľudí, typ eventu..."
                className="w-full bg-transparent border-b border-white/15 pb-3 text-white placeholder:text-white/30 focus:border-gold outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-3 rounded-full bg-gold px-8 py-4 text-sm font-medium text-black hover:bg-gold-soft transition-all"
            >
              Odoslať zadanie
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <p className="text-xs text-white/40 text-center">
              Odoslaním súhlasíte so spracovaním osobných údajov.
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-6">
        <div className="font-display text-2xl">NU<span className="gold-text">·</span>U</div>
        <div className="text-xs text-white/40">© {new Date().getFullYear()} NU-U Agency. Všetky práva vyhradené.</div>
        <div className="flex gap-6 text-xs text-white/50">
          <a href="#" className="hover:text-white">Instagram</a>
          <a href="#" className="hover:text-white">LinkedIn</a>
          <a href="#" className="hover:text-white">Facebook</a>
        </div>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <main className="bg-[#0A0A0A] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <PartnersStrip />
      <Services />
      <WhyUs />
      <Gallery />
      <Process />
      <Testimonials />
      <CTABanner />
      <Contact />
      <Footer />
    </main>
  );
}
