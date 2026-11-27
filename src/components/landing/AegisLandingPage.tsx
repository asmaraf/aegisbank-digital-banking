"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import Lenis from "lenis";
import { CurrencyCalculatorWidget } from "@/components/banking/CurrencyCalculatorWidget";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const duration = 1200;
    let rafId = 0;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, prefersReduced]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "security", label: "Security" },
];

const STICKY_FEATURES = [
  {
    id: "transfers",
    badge: "01 / Transfers",
    title: "Send money with full checks",
    description:
      "Every transfer checks your available balance, daily limit, recipient status, and Transaction PIN on the server before updating both accounts together.",
    points: [
      "Transfer between your own accounts or to other customers",
      "Daily and single-transaction limits enforced per account",
      "Download a PDF receipt for any completed transfer",
    ],
  },
  {
    id: "analytics",
    badge: "02 / Analytics",
    title: "Clear view of every account",
    description:
      "Track deposits, withdrawals, monthly spending, and loan balances across Savings, Current, and Business accounts using live account data.",
    points: [
      "Monthly deposit and spending charts",
      "Switch between multiple accounts in one click",
      "Export CSV and PDF account statements",
    ],
  },
  {
    id: "governance",
    badge: "03 / Controls",
    title: "Separate access by role",
    description:
      "Customers, Bank Staff, and Admins each see only the pages and actions meant for their role, with every request verified on the server.",
    points: [
      "Staff cannot approve their own requests or change bank limits",
      "Unusual transfers are flagged for admin review",
      "Admins can freeze accounts or reverse transfers",
    ],
  },
];

const MARQUEE_ITEMS = [
  "SAVINGS ACCOUNTS",
  "CURRENT ACCOUNTS",
  "BUSINESS ACCOUNTS",
  "FUND TRANSFERS",
  "DEPOSIT & WITHDRAWAL",
  "LOAN SCHEDULES",
  "PDF STATEMENTS",
];

export function AegisLandingPage() {
  const { data: session, status } = useSession();
  const prefersReduced = useReducedMotion();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const isAuthenticated = mounted && status === "authenticated" && Boolean(session?.user);

  const dashboardHref =
    session?.user?.role === "ADMIN"
      ? "/admin"
      : session?.user?.role === "STAFF"
      ? "/staff"
      : "/customer";

  // Scroll-aware navbar state
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  const securityRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Lenis smooth scrolling
  useEffect(() => {
    if (prefersReduced) return;
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [prefersReduced]);

  // Global scroll tracking for floating pill navbar (always visible on scroll down & up)
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active section highlight with IntersectionObserver
  useEffect(() => {
    const sections = NAV_LINKS.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -45% 0px" }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  // Hero parallax transforms
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const disableParallax = prefersReduced || isMobile;
  const cardParallaxY = useTransform(heroScroll, [0, 1], disableParallax ? [0, 0] : [0, -55]);
  const mockupParallaxY = useTransform(heroScroll, [0, 1], disableParallax ? [0, 0] : [0, -25]);

  // Sticky features scroll progress & parallax
  const { scrollYProgress: stickyScroll } = useScroll({
    target: stickyRef,
    offset: ["start end", "end start"],
  });
  const featuresBgParallaxY = useTransform(
    stickyScroll,
    [0, 1],
    disableParallax ? [0, 0] : [-70, 70]
  );
  const featuresBgScale = useTransform(
    stickyScroll,
    [0, 1],
    disableParallax ? [1, 1] : [1.08, 1.18]
  );
  useMotionValueEvent(stickyScroll, "change", (latest) => {
    if (latest < 0.42) setActiveFeature(0);
    else if (latest < 0.68) setActiveFeature(1);
    else setActiveFeature(2);
  });

  // How it works progress line
  const { scrollYProgress: stepsScroll } = useScroll({
    target: stepsRef,
    offset: ["start 80%", "end 60%"],
  });

  // Security section lower-image parallax
  const { scrollYProgress: securityScroll } = useScroll({
    target: securityRef,
    offset: ["start end", "end start"],
  });
  const securityBgParallaxY = useTransform(
    securityScroll,
    [0, 1],
    disableParallax ? [0, 0] : [-40, 40]
  );

  const headlineWords = ["Digital", "banking", "built", "for", "daily", "operations."];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/20">
      {/* Scroll-Aware Floating Pill Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6">
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-300 ${isScrolled
              ? "mt-3 h-14 max-w-5xl rounded-full border bg-background/85 px-5 shadow-lg backdrop-blur-xl"
              : "h-16 max-w-6xl border-b border-transparent bg-transparent px-2"
            }`}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight">AegisBank</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((item) => {
              const active = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${active
                      ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full border p-2 text-muted-foreground transition hover:border-indigo-500/40 hover:text-foreground"
              aria-label="Toggle theme"
              title="Toggle Light/Dark Theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>

            {isAuthenticated && session?.user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={dashboardHref}
                  className="group flex items-center gap-2 rounded-full border border-border/80 bg-background/80 py-1 pl-1.5 pr-3 text-xs transition hover:border-indigo-500/50 hover:bg-muted"
                  title={`Signed in as ${session.user.name}`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow-sm">
                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="font-semibold text-foreground text-xs group-hover:text-indigo-500 transition-colors">
                    {session.user.name}
                  </span>
                </Link>

                <Link
                  href={dashboardHref}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut({ redirect: false });
                    window.location.href = "/";
                  }}
                  className="rounded-full border p-1.5 text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  Open Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border p-2 text-foreground md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Hamburger Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-2 max-w-md rounded-2xl border bg-card p-4 shadow-xl md:hidden"
            >
              <div className="flex flex-col space-y-1">
                {NAV_LINKS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium ${activeSection === item.id
                        ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">Theme</span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium"
                >
                  {mounted && theme === "dark" ? (
                    <>
                      <Sun className="h-3.5 w-3.5" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>

              {isAuthenticated && session?.user ? (
                <div className="mt-3 space-y-2.5 border-t pt-3">
                  <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
                      {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="font-semibold text-sm truncate">{session.user.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await signOut({ redirect: false });
                        window.location.href = "/";
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-center text-xs font-semibold text-muted-foreground transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border py-2 text-center text-xs font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-indigo-600 py-2 text-center text-xs font-semibold text-white"
                  >
                    Open Account
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 1. HERO: Gradient Mesh + Word-by-Word Reveal + Floating 3D Card & Dashboard Mockup */}
      <section
        ref={heroRef}
        className="relative overflow-hidden border-b pb-20 pt-28 lg:pb-28 lg:pt-36"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 18% 20%, rgba(79,70,229,0.14), transparent 45%), radial-gradient(circle at 82% 28%, rgba(16,185,129,0.12), transparent 42%)",
          }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {headlineWords.map((word, idx) => (
                <motion.span
                  key={word + idx}
                  initial={prefersReduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: prefersReduced ? 0 : idx * 0.07 }}
                  className="mr-3 inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Manage bank accounts, transfer funds, process deposit and
              withdrawal requests, and track loans across Customer, Staff, and
              Admin portals.
            </motion.p>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href={isAuthenticated ? dashboardHref : "/login"}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                {isAuthenticated && session?.user
                  ? `Go to ${session.user.role === "ADMIN" ? "Admin" : session.user.role === "STAFF" ? "Staff" : "Customer"} Portal`
                  : "Open Banking Portal"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-2xl border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted"
                >
                  Create Customer Account
                </Link>
              )}
            </motion.div>
          </div>

          <div className="relative lg:col-span-6">
            <motion.div
              style={{ y: mockupParallaxY }}
              initial={prefersReduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="rounded-3xl border bg-card/95 p-5 shadow-2xl backdrop-blur-md sm:p-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Combined Balance</p>
                  <p className="text-xl font-bold">৳92,650.50</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>

              <svg viewBox="0 0 360 90" className="mt-4 h-24 w-full overflow-visible">
                <defs>
                  <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 72 Q 50 66, 95 48 T 190 40 T 275 22 L 360 10 L 360 90 L 0 90 Z"
                  fill="url(#heroChartGrad)"
                />
                <path
                  d="M0 72 Q 50 66, 95 48 T 190 40 T 275 22 L 360 10"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                />
              </svg>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border bg-background p-3">
                  <p className="text-muted-foreground">Savings • 0001</p>
                  <p className="mt-1 font-bold">৳28,450.00</p>
                </div>
                <div className="rounded-xl border bg-background p-3">
                  <p className="text-muted-foreground">Business • 0002</p>
                  <p className="mt-1 font-bold">৳64,200.50</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              style={{ y: cardParallaxY }}
              initial={prefersReduced ? false : { opacity: 0, x: 20, rotate: -4 }}
              animate={{ opacity: 1, x: 0, rotate: -5 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              whileHover={prefersReduced ? undefined : { rotate: -1, scale: 1.02 }}
              className="ml-auto mt-4 w-72 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-5 text-white shadow-2xl shadow-indigo-950/40 sm:-mt-10 sm:mr-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold tracking-wider">AEGIS BUSINESS</span>
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px]">
                  BDT
                </span>
              </div>
              <p className="mt-5 font-mono text-sm tracking-widest">
                •••• •••• •••• 0002
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-100">
                <span>SOPHIA STERLING</span>
                <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-emerald-200">
                  ACTIVE
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP: Infinite Marquee + Animated Number Counters */}
      <section className="border-b bg-card/40 py-12">
        <div className="overflow-hidden border-b pb-8">
          <div className="animate-marquee gap-12 text-xs font-semibold tracking-widest text-muted-foreground">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-3 px-4">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 px-4 text-center sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              <AnimatedCounter target={99.99} decimals={2} suffix="%" />
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Transaction Consistency
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter target={2.4} decimals={1} prefix="$" suffix="B+" />
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Simulated Volume Capacity
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-3xl font-bold">
              <AnimatedCounter target={120} prefix="<" suffix="ms" />
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Average Transfer Time
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              <AnimatedCounter target={3} />
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Dedicated User Portals
            </p>
          </div>
        </div>
      </section>

      {/* 3. GLOBAL TRANSFERS & LIVE FX CALCULATOR */}
      <section
        id="features"
        ref={stickyRef}
        className="relative isolate overflow-clip bg-[#0B0D14] py-20 text-white sm:py-28"
      >
        <motion.div
          aria-hidden="true"
          style={{
            y: featuresBgParallaxY,
            scale: featuresBgScale,
            backgroundImage: "url('/images/banking-parallax.jpg')",
          }}
          className="pointer-events-none absolute -inset-y-24 inset-x-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[#0B0D14]/75 backdrop-blur-[2px]"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Context & Feature Highlights */}
            <div className="space-y-6 lg:col-span-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Global Remittance & Transfers
                </span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
                  Send securely to 140+ countries.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  Convert and send money worldwide with guaranteed real-time exchange rates, transparent low fees, and instant atomic settlement. Every transfer is backed by server-side PIN checks and downloadable PDF receipts.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {[
                  {
                    title: "Live Exchange Rate Guarantee",
                    desc: "Rates locked at transfer time with zero hidden spreads or weekend markups.",
                  },
                  {
                    title: "Multi-Currency Accounts",
                    desc: "Seamlessly switch between USD, EUR, GBP, and BDT accounts within one portal.",
                  },
                  {
                    title: "Atomic Ledger Consistency",
                    desc: "Money debits and credits simultaneously with automatic rollback on error.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                      <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-700"
                >
                  <span>Open Banking Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create Customer Account
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Live Currency Calculator Widget */}
            <div className="flex justify-center lg:col-span-6">
              <CurrencyCalculatorWidget />
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS: 3 Steps with Scroll-Triggered Progress Line */}
      <section id="how-it-works" ref={stepsRef} className="border-y bg-card/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              How It Works
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps from sign up to settlement
            </h2>
          </div>

          <div className="relative mt-14">
            <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-border md:block">
              <motion.div
                style={{ scaleX: prefersReduced ? 1 : stepsScroll, transformOrigin: "left" }}
                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500"
              />
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Open an account",
                  desc: "Customers sign up online or through Bank Staff to open Savings, Current, or Business accounts.",
                },
                {
                  step: "02",
                  title: "Deposit and transfer",
                  desc: "Submit deposit or withdrawal requests for review and send PIN-verified transfers to any account.",
                },
                {
                  step: "03",
                  title: "Review and approve",
                  desc: "Staff verify requests and forward loans; Admins approve disbursements and monitor flagged items.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="relative rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <span className="inline-block rounded-xl bg-indigo-600 px-3 py-1.5 font-mono text-xs font-bold text-white">
                    Step {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURITY: Dark Section with Lower Parallax Image + Animated Shield */}
      <section
        id="security"
        ref={securityRef}
        className="relative isolate overflow-hidden bg-[#0B0D14] py-24 text-white"
      >
        <motion.div
          aria-hidden="true"
          style={{
            y: securityBgParallaxY,
            backgroundImage: "url('/images/banking-parallax.jpg')",
            backgroundPosition: "center bottom",
          }}
          className="pointer-events-none absolute -inset-y-20 inset-x-0 z-0 scale-110 bg-cover bg-no-repeat"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-[#0B0D14]/65 backdrop-blur-[1px]"
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-white/15 bg-[#0B0D14]/65 p-10 text-center backdrop-blur-md lg:col-span-5"
          >
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600/20 text-indigo-400">
              {!prefersReduced && (
                <motion.span
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl border border-indigo-400/40"
                />
              )}
              <ShieldCheck className="h-12 w-12 text-emerald-400" />
            </div>
            <h3 className="mt-6 text-xl font-bold">Server-First Validation</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Balances, limits, PINs, and permissions are always checked on the
              server before any money moves.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {[
              {
                snippet: "$28,450.00 → $25,250.00",
                title: "Consistent transfers",
                desc: "Sender debit and receiver credit succeed or fail together in one database transaction.",
              },
              {
                snippet: "PIN •••• + 2FA 123456",
                title: "PIN and 2FA checks",
                desc: "Every transfer checks your hashed Transaction PIN and optional 6-digit 2FA code.",
              },
              {
                snippet: "Daily Cap: $10,000.00",
                title: "Account limits",
                desc: "Per-account daily limits, single-transfer caps, and minimum balances are enforced.",
              },
              {
                snippet: "Key: tx_98a7c2f1",
                title: "Duplicate prevention",
                desc: "Idempotency keys prevent double-charging if a transfer is submitted twice.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="inline-block rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
                  {item.snippet}
                </span>
                <h4 className="mt-3 text-sm font-semibold">{item.title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA + FOOTER */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white shadow-xl sm:flex-row sm:p-12"
        >
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Try AegisBank today
            </h2>
            <p className="mt-1.5 text-sm text-indigo-100">
              Sign in with demo accounts for Admin, Bank Staff, or Customer.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t bg-card/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Landmark className="h-4 w-4 text-indigo-600" />
            AegisBank
          </div>
          <p>Simulated digital banking application — no real financial transactions.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
