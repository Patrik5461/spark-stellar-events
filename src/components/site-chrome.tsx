import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUp, Instagram, Linkedin, Facebook, Lock, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSiteSettings, pick } from "@/lib/use-site-settings";

const EASE = [0.22, 1, 0.36, 1] as const;

const NAV_LINKS: { label: string; href: string; kind: "hash" | "route" }[] = [
  { label: "O nás", href: "#why", kind: "hash" },
  { label: "Služby", href: "#services", kind: "hash" },
  { label: "Galéria", href: "/galeria", kind: "route" },
  { label: "Prenájom oblečenia", href: "/prenajom-oblecenia", kind: "route" },
  { label: "Kontakt", href: "#contact", kind: "hash" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    fn();
    window.addEventListener("scroll", fn);
    let io: IntersectionObserver | null = null;
    if (isHome) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive("#" + e.target.id);
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      NAV_LINKS.filter((l) => l.kind === "hash").forEach((l) => {
        const el = document.querySelector(l.href);
        if (el) io!.observe(el);
      });
    } else {
      setActive(pathname);
    }
    return () => {
      window.removeEventListener("scroll", fn);
      io?.disconnect();
    };
  }, [isHome, pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const resolveHref = (link: (typeof NAV_LINKS)[number]) => {
    if (link.kind === "route") return link.href;
    return isHome ? link.href : `/${link.href}`;
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled || open ? "py-3 bg-[#EBE6E2]/85 backdrop-blur-xl border-b border-[#D9D2CC]/70" : "py-4 md:py-6 bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr] items-center gap-4 md:gap-6">
        <Link
          to="/"
          aria-label="NU-U — domov"
          className="inline-flex items-center text-[#383B3A] hover:-translate-y-0.5 hover:opacity-80 transition-all duration-300"
        >
          <Logo className="h-16 w-16 sm:h-20 sm:w-20 md:h-[94px] md:w-[94px]" />
        </Link>
        <nav className="hidden md:flex items-center justify-center gap-2 text-sm text-[#726D6A]">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.kind === "route"
                ? pathname === link.href
                : isHome && active === link.href;
            const className = "relative px-4 py-2 transition-colors hover:text-[#383B3A]";
            const inner = (
              <>
                <span className={isActive ? "text-[#383B3A]" : ""}>{link.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-full bg-[#D4C7BD]/60"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </>
            );
            return link.kind === "route" ? (
              <Link key={link.href} to={link.href} className={className}>
                {inner}
              </Link>
            ) : (
              <a key={link.href} href={resolveHref(link)} className={className}>
                {inner}
              </a>
            );
          })}
        </nav>
        <button
          type="button"
          aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden col-start-3 justify-self-end h-11 w-11 -mr-2 grid place-items-center rounded-full text-[#383B3A] hover:bg-[#D4C7BD]/40 transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="md:hidden mx-6 mt-3 rounded-2xl border border-[#D9D2CC] bg-[#F5F1EC]/95 backdrop-blur-xl soft-shadow overflow-hidden"
          >
            <ul className="flex flex-col py-2">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.kind === "route"
                    ? pathname === link.href
                    : isHome && active === link.href;
                const cls = `block px-6 py-3 text-base transition-colors ${
                  isActive ? "text-[#383B3A] font-medium" : "text-[#726D6A] hover:text-[#383B3A]"
                }`;
                return (
                  <li key={link.href}>
                    {link.kind === "route" ? (
                      <Link to={link.href} className={cls} onClick={() => setOpen(false)}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={resolveHref(link)} className={cls} onClick={() => setOpen(false)}>
                        {link.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const settings = useSiteSettings();
  const prefix = (h: string) => (h.startsWith("#") ? (isHome ? h : `/${h}`) : h);
  const nav: [string, string][] = [
    ["O nás", prefix("#why")],
    ["Služby", prefix("#services")],
    ["Galéria", "/galeria"],
    ["Prenájom oblečenia", "/prenajom-oblecenia"],
    ["Kontakt", prefix("#contact")],
  ];
  const footerText = pick(settings, "footer_text", "Hostessing, promotion a produkcia eventov. Slovensko & zahraničie.");
  const contactPerson = pick(settings, "contact_person", "Jana Henčeková");
  const email = pick(settings, "email", "info@nu-u.sk");
  const phone = pick(settings, "phone", "+421 905 454 498");
  const address = pick(settings, "address", "Gazdovská 1901/7b, 900 41 Rovinka");
  const billingName = pick(settings, "billing_name", "nuu s.r.o.");
  const ico = pick(settings, "billing_ico", "550428872");
  const dic = pick(settings, "billing_dic", "2121851754");
  const icDph = pick(settings, "billing_ic_dph", "SK2121851754");
  const iban = pick(settings, "billing_iban", "SK39 8330 0000 0020 0248 9216");
  const igUrl = pick(settings, "instagram_url", "https://instagram.com");
  const liUrl = pick(settings, "linkedin_url", "https://linkedin.com");
  const fbUrl = pick(settings, "facebook_url", "https://facebook.com");
  const socials = [
    [Instagram, igUrl, "Instagram"],
    [Linkedin, liUrl, "LinkedIn"],
    [Facebook, fbUrl, "Facebook"],
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
            <Link to="/" aria-label="NU-U — domov" className="inline-flex text-[#383B3A] hover:opacity-80 transition-opacity"><Logo className="h-[72px] w-[72px]" /></Link>
            <p className="mt-4 text-sm text-[#726D6A] max-w-xs leading-relaxed">
              {footerText}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A] mb-4">Navigácia</div>
            <ul className="space-y-2 text-sm">
              {nav.map(([l, h]) => (
                <li key={h}>
                  {h.startsWith("/") && !h.includes("#") ? (
                    <Link to={h} className="text-[#383B3A] hover:text-[#726D6A] transition-colors">{l}</Link>
                  ) : (
                    <a href={h} className="text-[#383B3A] hover:text-[#726D6A] transition-colors">{l}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[#726D6A] mb-4">Kontakt</div>
            <ul className="space-y-2 text-sm text-[#383B3A]">
              <li className="font-medium">{contactPerson}</li>
              <li><a href={`mailto:${email}`} className="hover:text-[#726D6A] transition-colors">{email}</a></li>
              <li><a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-[#726D6A] transition-colors">{phone}</a></li>
              <li className="text-[#726D6A]">{address}</li>
            </ul>
            <div className="mt-5 text-xs text-[#726D6A] leading-relaxed">
              <span className="text-[#383B3A] font-medium">{billingName}</span> · IČO {ico} · DIČ {dic} · IČ DPH {icDph} · IBAN {iban}
            </div>
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
          <div>© {new Date().getFullYear()} {billingName} · nu-u.sk · IČO {ico}</div>
          <div className="flex items-center gap-3">
            <span>Handcrafted in Rovinka</span>
            <Link
              to="/admin/login"
              className="group relative inline-flex opacity-60 hover:opacity-100 hover:-translate-y-0.5 transition-all duration-200 text-[#726D6A]"
              aria-label="Administrácia"
            >
              <Lock className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#383B3A] px-2 py-1 text-[10px] text-[#F5F1EC] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Administrácia
              </span>
            </Link>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

export function BackToTop() {
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
