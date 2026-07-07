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
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

const INK = "#383B3A";
const IVORY = "#F5F1EC";

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
        scrolled ? "py-3 bg-[#EBE6E2]/85 backdrop-blur-xl border-b border-[#D9D2CC]" : "py-6"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <a href="#" className="font-display text-2xl tracking-tight text-[#383B3A]">
          NU<span className="text-[#726D6A]">·</span>U
        </a>
        <nav className="hidden md:flex items-center justify-center gap-10 text-sm text-[#726D6A]">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="hover:text-[#383B3A] transition-colors">{l}</a>
          ))}
        </nav>
        <a
          href="#contact"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#383B3A] text-[#F5F1EC] px-5 py-2.5 text-sm hover:bg-[#4a4d4c] transition-all"
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
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-20 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#726D6A] mb-10"
        >
          <span className="h-px w-10 bg-[#726D6A]" />
          Hostessing · Promo · Produkcia
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.75rem,8vw,7.5rem)] leading-[1.0] tracking-tight text-balance text-[#383B3A] max-w-6xl"
        >
          Eventy, ktoré majú <em className="italic text-[#726D6A]">drive.</em>
          <br />
          Ľudia, ktorí majú <em className="italic text-[#726D6A]">iskru.</em>
        </motion.h1>

        <div className="mt-12 grid md:grid-cols-2 gap-10 items-end">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-xl text-lg text-[#726D6A] leading-relaxed"
          >
            Nerobíme len komparz. Tvoríme tímy, ktoré predávajú,
            reprezentujú a riešia — s pokojom a precíznosťou.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap gap-4 md:justify-end"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 rounded-full bg-[#383B3A] px-7 py-4 text-sm font-medium text-[#F5F1EC] hover:bg-[#4a4d4c] hover:scale-[1.02] transition-all"
            >
              Nezáväzná ponuka
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-3 rounded-full border border-[#383B3A] px-7 py-4 text-sm text-[#383B3A] hover:bg-[#C9BAAE]/40 transition-all"
            >
              Naše služby
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="relative mt-20 rounded-[28px] overflow-hidden soft-shadow-lg border border-[#D9D2CC]"
        >
          <motion.div style={{ y }} className="aspect-[16/8] w-full">
            <img
              src={hero}
              alt="Elegantná hosteska na luxusnom evente"
              className="h-full w-full object-cover"
              width={1920}
              height={1080}
            />
          </motion.div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group relative card-surface rounded-[24px] p-10 min-h-[280px] flex flex-col justify-between transition-shadow hover:shadow-[0_30px_60px_-20px_rgba(56,59,58,0.18)]"
            >
              <div className="relative flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl border border-[#D9D2CC] bg-[#EBE6E2] grid place-items-center group-hover:bg-[#C9BAAE]/50 transition-colors">
                  <Icon className="h-5 w-5 text-[#383B3A]" strokeWidth={1.5} />
                </div>
                <span className="text-xs text-[#726D6A]/60">0{i + 1}</span>
              </div>
              <div className="relative mt-10">
                <h3 className="font-display text-2xl mb-3 text-[#383B3A]">{title}</h3>
                <p className="text-sm text-[#726D6A] leading-relaxed">{desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[#383B3A] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-500">
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
    <section id="why" className="relative py-32 px-6 bg-[#D4C7BD]/40">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div {...fadeUp} className="relative">
          <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden soft-shadow-lg border border-[#D9D2CC]">
            <img src={g4} alt="Profesionálna hosteska" loading="lazy" width={1024} height={1280} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-8 -right-4 card-surface rounded-2xl p-6 max-w-[240px] hidden md:block">
            <div className="font-display text-4xl text-[#383B3A]">98%</div>
            <div className="text-xs text-[#726D6A] mt-2">klientov sa k nám vracia</div>
          </div>
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
                <div className="font-display text-4xl md:text-5xl text-[#383B3A]">{n}</div>
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
            <SectionEyebrow n="03" label="Galéria" />
            <h2 className="font-display text-5xl md:text-7xl leading-[1.02] tracking-tight text-[#383B3A]">
              Momenty, ktoré <em className="italic text-[#726D6A]">hovoria.</em>
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
              transition={{ duration: 0.7, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-[24px] border border-[#D9D2CC] soft-shadow ${im.h}`}
            >
              <img
                src={im.src}
                alt={im.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
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
    <section id="process" className="relative py-32 px-6 bg-[#D4C7BD]/40">
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
    <section className="py-32 px-6">
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
    <section className="py-24 px-6">
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
    <section id="contact" className="py-32 px-6">
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

        <motion.form
          {...fadeUp}
          onSubmit={(e) => { e.preventDefault(); alert("Ďakujeme! Ozveme sa do 24h."); }}
          className="card-surface rounded-[28px] p-8 md:p-10 h-fit"
        >
          <div className="space-y-6">
            {[
              { l: "Meno", t: "text", p: "Jana Nováková" },
              { l: "Email", t: "email", p: "jana@firma.sk" },
              { l: "Telefón", t: "tel", p: "+421 900 000 000" },
            ].map((f) => (
              <div key={f.l}>
                <label className="block text-xs uppercase tracking-widest text-[#726D6A] mb-2">{f.l}</label>
                <input
                  type={f.t}
                  placeholder={f.p}
                  className="w-full bg-transparent border-b border-[#D9D2CC] pb-3 text-[#383B3A] placeholder:text-[#726D6A]/50 focus:border-[#383B3A] outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#726D6A] mb-2">Správa</label>
              <textarea
                rows={4}
                placeholder="Termín, lokácia, počet ľudí, typ eventu..."
                className="w-full bg-transparent border-b border-[#D9D2CC] pb-3 text-[#383B3A] placeholder:text-[#726D6A]/50 focus:border-[#383B3A] outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center gap-3 rounded-full bg-[#383B3A] px-8 py-4 text-sm font-medium text-[#F5F1EC] hover:bg-[#4a4d4c] transition-all"
            >
              Odoslať dopyt
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
            <p className="text-xs text-[#726D6A] text-center">
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
    <footer className="border-t border-[#D9D2CC] py-12 px-6 bg-[#EBE6E2]">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-6">
        <div className="font-display text-2xl text-[#383B3A]">NU<span className="text-[#726D6A]">·</span>U</div>
        <div className="text-xs text-[#726D6A]">© {new Date().getFullYear()} NU-U Agency · info@nu-u.sk · www.nu-u.sk</div>
        <div className="flex gap-6 text-xs text-[#726D6A]">
          <a href="#" className="hover:text-[#383B3A]">Instagram</a>
          <a href="#" className="hover:text-[#383B3A]">LinkedIn</a>
          <a href="#" className="hover:text-[#383B3A]">Facebook</a>
        </div>
      </div>
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
    </main>
  );
}
