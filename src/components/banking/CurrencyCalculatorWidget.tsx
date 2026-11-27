"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, Clock, ShieldCheck, ChevronDown, Check } from "lucide-react";

interface CountryOption {
  code: string;
  currency: string;
  name: string;
  flag: string;
  ratePerUSD: number;
  symbol: string;
  speed: string;
}

const DESTINATIONS: CountryOption[] = [
  {
    code: "BD",
    currency: "BDT",
    name: "Bangladesh",
    flag: "🇧🇩",
    ratePerUSD: 125.4,
    symbol: "৳",
    speed: "In 15 minutes",
  },
  {
    code: "IN",
    currency: "INR",
    name: "India",
    flag: "🇮🇳",
    ratePerUSD: 86.2,
    symbol: "₹",
    speed: "Instant to UPI/Bank",
  },
  {
    code: "GB",
    currency: "GBP",
    name: "United Kingdom",
    flag: "🇬🇧",
    ratePerUSD: 0.79,
    symbol: "£",
    speed: "Same day",
  },
  {
    code: "EU",
    currency: "EUR",
    name: "Eurozone",
    flag: "🇪🇺",
    ratePerUSD: 0.92,
    symbol: "€",
    speed: "Within 1 hour",
  },
  {
    code: "AE",
    currency: "AED",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    ratePerUSD: 3.67,
    symbol: "AED ",
    speed: "In 30 minutes",
  },
  {
    code: "SA",
    currency: "SAR",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    ratePerUSD: 3.75,
    symbol: "SAR ",
    speed: "Within 1 hour",
  },
  {
    code: "CA",
    currency: "CAD",
    name: "Canada",
    flag: "🇨🇦",
    ratePerUSD: 1.39,
    symbol: "CA$",
    speed: "Same day",
  },
];

export function CurrencyCalculatorWidget() {
  const [sendAmount, setSendAmount] = useState<number>(1000);
  const [selectedDest, setSelectedDest] = useState<CountryOption>(DESTINATIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fee calculation (transparent: 1% + $0.77 base, max $25)
  const fee = Math.min(25, +(sendAmount * 0.01 + 0.77).toFixed(2));
  const effectiveAmount = Math.max(0, sendAmount - fee);
  const recipientGets = (effectiveAmount * selectedDest.ratePerUSD).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-2xl transition-all">
      {/* Top Banner (Vibrant Emerald / Forest Gradient as in reference) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            Zero Hidden Margins
          </span>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            SEND SECURELY TO 140+ COUNTRIES
          </h3>
          <p className="mt-1 text-xs text-emerald-100/90">See live fees, speed, and real-time rates to:</p>

          {/* Destination Selector Pill */}
          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-slate-900 shadow-md transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{selectedDest.flag}</span>
                <span className="text-sm font-bold">{selectedDest.name}</span>
                <span className="text-xs font-semibold text-slate-500">({selectedDest.currency})</span>
              </div>
              <span className="flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Change
                <ChevronDown className="h-3 w-3" />
              </span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-2xl border bg-card p-1.5 shadow-2xl">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest.code}
                    type="button"
                    onClick={() => {
                      setSelectedDest(dest);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      dest.code === selectedDest.code
                        ? "bg-indigo-600/10 font-bold text-indigo-600 dark:text-indigo-400"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{dest.flag}</span>
                      <span>{dest.name}</span>
                      <span className="text-muted-foreground">({dest.currency})</span>
                    </div>
                    {dest.code === selectedDest.code && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-4">
        {/* Live Locked Rate Badge */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">
              1 USD = <span className="font-bold text-foreground">{selectedDest.ratePerUSD.toFixed(3)} {selectedDest.currency}</span>
            </span>
          </div>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Live Rate
          </span>
        </div>

        {/* You send exactly */}
        <div className="rounded-2xl border bg-background p-3.5 transition focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You send exactly</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">USD Account</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 text-sm font-bold text-foreground">
              <span>🇺🇸</span>
              <span>USD</span>
            </div>
            <input
              type="number"
              min="10"
              max="100000"
              value={sendAmount || ""}
              onChange={(e) => setSendAmount(Math.max(0, Number(e.target.value)))}
              className="w-full text-right font-mono text-2xl font-black tracking-tight text-foreground outline-none bg-transparent"
              placeholder="1,000.00"
            />
          </div>
        </div>

        {/* Tier Discount Note */}
        {sendAmount >= 25000 && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-3 py-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
            <span>✨</span>
            <span>Sending over $25,000 USD? Preferred institutional rate applied.</span>
          </div>
        )}

        {/* Recipient gets */}
        <div className="rounded-2xl border bg-background p-3.5 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Recipient gets</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Guaranteed delivery
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 text-sm font-bold text-foreground">
              <span>{selectedDest.flag}</span>
              <span>{selectedDest.currency}</span>
            </div>
            <p className="w-full text-right font-mono text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {recipientGets}
            </p>
          </div>
        </div>

        {/* Transparent Details Breakdown */}
        <div className="space-y-2 rounded-2xl border bg-muted/30 p-3.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>Speed</span>
            </div>
            <span className="font-semibold text-foreground">{selectedDest.speed}</span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>💳</span>
              <span>Total fees</span>
            </div>
            <span className="font-semibold text-foreground">
              ${fee.toFixed(2)} USD <span className="text-[10px] text-muted-foreground">(included)</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/customer/transfer"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
        >
          <span>Send money now</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
