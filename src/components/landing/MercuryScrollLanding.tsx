"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Send,
  FileText,
  TrendingUp,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

const FEATURE_TABS = [
  {
    id: "banking",
    title: "Business & personal banking",
    description:
      "Open Savings, Current, or Business accounts in seconds. Switch between accounts seamlessly with real-time balance tracking and downloadable PDF/CSV statements.",
    metric: "$92,650.50",
    metricLabel: "Combined Liquidity",
    items: [
      { label: "Savings Account • 1001000001", amount: "$28,450.00" },
      { label: "Business Account • 1001000002", amount: "$64,200.50" },
      { label: "Daily Transfer Limit", amount: "$50,000.00" },
    ],
  },
  {
    id: "transfers",
    title: "Atomic fund transfers",
    description:
      "Send money across internal or external accounts with server-side PIN validation, 2FA verification, idempotency protection, and instant PDF receipts.",
    metric: "< 120ms",
    metricLabel: "Atomic Settlement",
    items: [
      { label: "TXN-202611-100011 • Verified", amount: "-$6,400.00" },
      { label: "Q4 Client Retainer Credit", amount: "+$18,000.00" },
      { label: "Transfer Fee", amount: "$0.00" },
    ],
  },
  {
    id: "loans",
    title: "Loans & credit underwriting",
    description:
      "Apply for Personal, Business, Home, Auto, or Education loans. Staff review and forward applications; Admins approve and disburse directly to customer accounts.",
    metric: "8.5% APR",
    metricLabel: "Business Credit",
    items: [
      { label: "Working Capital Loan", amount: "$12,000.00" },
      { label: "Installments Paid", amount: "2 / 12" },
      { label: "Remaining Balance", amount: "$10,000.00" },
    ],
  },
  {
    id: "analytics",
    title: "Real-time risk & analytics",
    description:
      "Monitor monthly transaction volume, deposits vs withdrawals, and automated suspicious-activity flags across every customer and account.",
    metric: "100%",
    metricLabel: "Server-Enforced RBAC",
    items: [
      { label: "Automated Flagging Threshold", amount: "$5,000.00" },
      { label: "Active Monitored Accounts", amount: "4 Accounts" },
      { label: "Role Isolation", amount: "Admin / Staff / Customer" },
    ],
  },
];

export function MercuryScrollLanding() {
  const router = useRouter();
  const heroContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState("");

  const testimonialReveal = useInView(0.15);
  const bentoReveal = useInView(0.1);

  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = heroContainerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const raw = -rect.top / scrollable;
        setScrollProgress(Math.max(0, Math.min(1, raw)));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Clean, smooth Mercury-style scroll transforms (initial version)
  const heroOpacity = Math.max(0, 1 - scrollProgress * 2.2);
  const heroTranslateY = -scrollProgress * 90;
  const laptopScale = 0.86 + Math.min(1, scrollProgress * 1.4) * 0.18;
  const laptopTranslateY = Math.max(-24, 70 - scrollProgress * 140);
  const screenGlowOpacity = Math.min(1, 0.35 + scrollProgress * 0.9);

  const currentFeature = FEATURE_TABS[activeTab];

  const handleQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(email ? `/register?email=${encodeURIComponent(email)}` : "/register");
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white selection:bg-indigo-500/30">
      {/* Sticky Top Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B0D14]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              AEGISBANK
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white sm:text-sm"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Launch demo
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 sm:text-sm"
            >
              Open account
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Mercury-style Sticky Scroll Zoom Hero -> Dashboard */}
      <section
        ref={heroContainerRef}
        className="relative h-[220vh] w-full bg-[#0B0D14]"
      >
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
          {/* Scenic Background Image + Subtle Dark Overlay */}
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-100 will-change-transform"
            style={{
              backgroundImage: "url('/images/hero-bg.jpg')",
              transform: `scale(${1 + scrollProgress * 0.12})`,
              opacity: Math.max(0.18, 1 - scrollProgress * 0.9),
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B0D14]/65 via-[#0B0D14]/40 to-[#0B0D14]" />

          {/* Atmospheric Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 25%, rgba(79, 70, 229, 0.25), transparent 70%)",
              opacity: screenGlowOpacity,
            }}
          />

          {/* Hero Copy (Fades & lifts on scroll) */}
          <div
            className="relative z-10 mx-auto max-w-3xl text-center transition-transform duration-75 will-change-transform"
            style={{
              opacity: heroOpacity,
              transform: `translate3d(0, ${heroTranslateY}px, 0)`,
              pointerEvents: heroOpacity < 0.1 ? "none" : "auto",
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen Digital Banking Platform
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Radically different banking
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
              Apply in minutes to experience banking with atomic transfers,
              intelligent loan workflows, and real-time analytics.
            </p>

            <form
              onSubmit={handleQuickStart}
              className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 sm:flex-row sm:rounded-full sm:border sm:border-white/15 sm:bg-white/10 sm:p-1.5 sm:backdrop-blur-md"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none sm:border-0 sm:bg-transparent sm:py-1.5"
              />
              <button
                type="submit"
                className="w-full shrink-0 rounded-full bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 sm:w-auto sm:py-2"
              >
                Open account
              </button>
            </form>
          </div>

          {/* Laptop Mockup that Zooms & Scales In on Scroll */}
          <div
            className="relative z-20 mx-auto mt-4 w-full max-w-5xl will-change-transform"
            style={{
              transform: `translate3d(0, ${laptopTranslateY}px, 0) scale(${laptopScale})`,
            }}
          >
            <div className="rounded-[24px] border border-white/15 bg-[#121624] p-2.5 shadow-2xl shadow-indigo-950/60 sm:p-4">
              {/* Laptop Camera Notch */}
              <div className="mx-auto mb-2 h-1.5 w-16 rounded-full bg-white/10" />

              {/* Inside Screen: AegisBank Live UI Preview */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0F131F] p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs text-slate-400">Welcome back, Sophia</p>
                    <p className="text-lg font-semibold text-white">
                      AegisBank Treasury Overview
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                      Send Money
                    </span>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                      Request
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {/* Balance + Chart Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#151A2A] p-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Total Balance</p>
                        <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                          $92,650.50
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +14.2% this month
                      </span>
                    </div>

                    {/* Smooth SVG Area Sparkline */}
                    <svg
                      viewBox="0 0 400 100"
                      className="mt-4 h-24 w-full overflow-visible"
                    >
                      <defs>
                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 80 Q 50 75, 90 55 T 180 48 T 270 30 T 360 18 L 400 12 L 400 100 L 0 100 Z"
                        fill="url(#sparkGrad)"
                      />
                      <path
                        d="M0 80 Q 50 75, 90 55 T 180 48 T 270 30 T 360 18 L 400 12"
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>

                  {/* Accounts List Card */}
                  <div className="rounded-2xl border border-white/10 bg-[#151A2A] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Accounts
                    </p>
                    <div className="mt-3 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-slate-200">Savings • 0001</span>
                        <span className="font-semibold text-white">$28,450.00</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-slate-200">Business • 0002</span>
                        <span className="font-semibold text-white">$64,200.50</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-slate-200">Active Loan</span>
                        <span className="font-semibold text-amber-400">$10,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dark Interactive Feature Tabs ("Everything you do with money.") */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Everything you do with money.
            <span className="block text-slate-400">All in one place.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          {/* Interactive Tab List */}
          <div className="space-y-3 lg:col-span-5">
            {FEATURE_TABS.map((tab, idx) => {
              const isActive = idx === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    isActive
                      ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-950/30"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {tab.title}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full transition ${
                        isActive ? "bg-indigo-400" : "bg-white/20"
                      }`}
                    />
                  </div>
                  {isActive && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {tab.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Preview Panel */}
          <div className="rounded-3xl border border-white/10 bg-[#121624] p-6 shadow-2xl lg:col-span-7 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">
                  {currentFeature.metricLabel}
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {currentFeature.metric}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live Ledger Sync
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {currentFeature.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm transition hover:bg-white/[0.06]"
                >
                  <span className="text-slate-200">{item.label}</span>
                  <span className="font-mono font-semibold text-white">
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partner / Stack Strip */}
        <div className="mt-20 border-t border-white/10 pt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Powered by modern financial & cloud infrastructure
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold tracking-wide text-slate-400 sm:gap-14">
            <span>NEXT.JS 14</span>
            <span>PRISMA ORM</span>
            <span>NEON POSTGRES</span>
            <span>REDUX TOOLKIT</span>
            <span>RECHARTS</span>
          </div>
        </div>
      </section>

      {/* 3. Light Transition Section: Testimonial + Bento Grid (Scroll Reveal) */}
      <section className="bg-[#F8FAFC] py-24 text-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Testimonial Card */}
          <div
            ref={testimonialReveal.ref}
            className={`rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-700 sm:p-10 ${
              testimonialReveal.visible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <p className="max-w-3xl text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
              &ldquo;Unlike legacy banking tools, AegisBank is built on clean
              software architecture — atomic transfers, instant statements, and
              role-isolated underwriting in minutes.&rdquo;
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Elena Vance
            </p>
            <p className="text-xs text-slate-500">Chief Risk Officer, AegisBank</p>
          </div>

          {/* Bento Heading */}
          <div className="mt-20 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Banking shouldn&apos;t be a headache.
              <span className="block text-slate-500">
                Now, it&apos;s a head start.
              </span>
            </h2>
          </div>

          {/* 2x2 Bento Grid with Staggered Scroll Reveal */}
          <div
            ref={bentoReveal.ref}
            className="mt-10 grid gap-6 md:grid-cols-2"
          >
            {/* Card 1 */}
            <div
              className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-700 ${
                bentoReveal.visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
                <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">AEGIS BUSINESS</span>
                    <CreditCard className="h-4 w-4 text-indigo-300" />
                  </div>
                  <p className="mt-5 font-mono text-sm tracking-widest">
                    •••• •••• •••• 0002
                  </p>
                  <p className="mt-1 text-xs text-indigo-200">$64,200.50 Available</p>
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">
                Multi-account switching in seconds
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Manage Savings, Current, and Business accounts from a single
                unified dashboard with per-account transaction limits.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all delay-100 duration-700 ${
                bentoReveal.visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 p-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <Send className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-semibold">
                    Transfer $3,200.00 → 1001000003
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    PIN Verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-indigo-600" />
                  Atomic PostgreSQL Transaction
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">
                Zero-leakage atomic transfers
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Every transfer validates balance, limits, PIN, and 2FA
                server-side before executing an atomic debit and credit.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all delay-200 duration-700 ${
                bentoReveal.visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="flex h-44 flex-col items-center justify-center rounded-2xl bg-slate-100 p-6">
                <div className="w-full max-w-xs space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Loan Installment #3</span>
                    <span className="text-indigo-600">$1,085.00</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/3 rounded-full bg-indigo-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Remaining balance: $10,000.00
                  </p>
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">
                End-to-end loan lifecycle
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                From customer application to staff review, admin disbursement,
                and automated monthly repayment schedules.
              </p>
            </div>

            {/* Card 4 */}
            <div
              className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all delay-300 duration-700 ${
                bentoReveal.visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="flex h-44 flex-col items-center justify-center rounded-2xl bg-slate-100 p-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-semibold">
                      TXN-202611-100011-receipt.pdf
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ready for instant PDF & CSV export
                    </p>
                  </div>
                </div>
              </div>
              <h3 className="mt-5 text-lg font-semibold">
                Audit-ready PDF receipts & statements
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                Generate official PDF transaction receipts and full CSV or PDF
                account statements in one click.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#0B0D14] p-8 text-white sm:flex-row sm:p-12">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
                Admin • Bank Staff • Customer Portals
              </div>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
                Ready to explore AegisBank?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Sign in with one-click demo credentials or open a new customer
                account.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Launch Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
