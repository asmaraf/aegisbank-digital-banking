"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, ArrowRight, Clock, ShieldCheck, ChevronDown, Check } from "lucide-react";

interface CountryOption {
  code: string;
  currency: string;
  name: string;
  flag: string;
  bdtPerUnit: number;
  symbol: string;
  speed: string;
}

const DESTINATIONS: CountryOption[] = [
  {
    code: "US",
    currency: "USD",
    name: "United States",
    flag: "🇺🇸",
    bdtPerUnit: 122.5,
    symbol: "$",
    speed: "Within 30 minutes",
  },
  {
    code: "GB",
    currency: "GBP",
    name: "United Kingdom",
    flag: "🇬🇧",
    bdtPerUnit: 155.2,
    symbol: "£",
    speed: "Same day",
  },
  {
    code: "EU",
    currency: "EUR",
    name: "Eurozone",
    flag: "🇪🇺",
    bdtPerUnit: 132.8,
    symbol: "€",
    speed: "Within 1 hour",
  },
  {
    code: "SA",
    currency: "SAR",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    bdtPerUnit: 32.65,
    symbol: "SAR ",
    speed: "In 15 minutes",
  },
  {
    code: "AE",
    currency: "AED",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    bdtPerUnit: 33.35,
    symbol: "AED ",
    speed: "In 30 minutes",
  },
  {
    code: "CA",
    currency: "CAD",
    name: "Canada",
    flag: "🇨🇦",
    bdtPerUnit: 88.5,
    symbol: "CA$",
    speed: "Same day",
  },
  {
    code: "IN",
    currency: "INR",
    name: "India",
    flag: "🇮🇳",
    bdtPerUnit: 1.42,
    symbol: "₹",
    speed: "Instant to UPI/Bank",
  },
  {
    code: "MY",
    currency: "MYR",
    name: "Malaysia",
    flag: "🇲🇾",
    bdtPerUnit: 27.8,
    symbol: "RM ",
    speed: "Within 1 hour",
  },
  {
    code: "SG",
    currency: "SGD",
    name: "Singapore",
    flag: "🇸🇬",
    bdtPerUnit: 91.5,
    symbol: "S$",
    speed: "Within 1 hour",
  },
  {
    code: "AU",
    currency: "AUD",
    name: "Australia",
    flag: "🇦🇺",
    bdtPerUnit: 79.2,
    symbol: "A$",
    speed: "Same day",
  },
];

export function CurrencyCalculatorWidget() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sendAmount, setSendAmount] = useState<number>(50000);
  const [selectedDest, setSelectedDest] = useState<CountryOption>(DESTINATIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSendMoney = () => {
    if (!session?.user) {
      toast.info("Customer account required", {
        description: "Sign in with a customer account to transfer funds.",
      });
      router.push("/login?callbackUrl=/customer/transfer");
      return;
    }
    if (session.user.role === "CUSTOMER") {
      router.push("/customer/transfer");
    } else {
      toast.info("Customer account required", {
        description: "Sign in with a customer account to transfer funds.",
      });
      router.push("/login?callbackUrl=/customer/transfer");
    }
  };

  // Fee calculation in BDT: 0.5% + ৳150 base, max ৳2,500
  const fee = Math.min(2500, +(sendAmount * 0.005 + 150).toFixed(2));
  const effectiveAmount = Math.max(0, sendAmount - fee);
  const recipientGets = (effectiveAmount / selectedDest.bdtPerUnit).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="relative mx-auto w-full max-w-md rounded-3xl border bg-card shadow-2xl transition-all">
      {/* Top Banner (Vibrant Emerald / Forest Gradient) */}
      <div className="relative rounded-t-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3" />
            Bangladesh Remittance Gateway
          </span>
          <h3 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            SEND GLOBALLY FROM BANGLADESH
          </h3>
          <p className="mt-1 text-xs text-emerald-100/90">Real-time exchange rates from BDT to:</p>

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
                <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border bg-card p-1.5 shadow-2xl ring-1 ring-black/10">
                  {DESTINATIONS.map((dest) => (
                    <button
                      key={dest.code}
                      type="button"
                      onClick={() => {
                        setSelectedDest(dest);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition ${
                        dest.code === selectedDest.code
                          ? "bg-emerald-600 font-bold text-white shadow-sm"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{dest.flag}</span>
                        <span className="font-semibold">{dest.name}</span>
                        <span className={dest.code === selectedDest.code ? "text-emerald-100" : "text-muted-foreground"}>
                          ({dest.currency})
                        </span>
                      </div>
                      {dest.code === selectedDest.code ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          1 {dest.currency} = ৳{dest.bdtPerUnit.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
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
              1 {selectedDest.currency} ={" "}
              <span className="font-bold text-foreground">
                ৳{selectedDest.bdtPerUnit.toFixed(2)} BDT
              </span>
            </span>
          </div>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Live Rate
          </span>
        </div>

        {/* You send exactly */}
        <div className="rounded-2xl border bg-background p-3.5 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>You send exactly</span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              BDT Account
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-1.5 text-sm font-bold text-foreground">
              <span>🇧🇩</span>
              <span>BDT</span>
            </div>
            <input
              type="number"
              min="500"
              max="5000000"
              value={sendAmount || ""}
              onChange={(e) => setSendAmount(Math.max(0, Number(e.target.value)))}
              className="w-full text-right font-mono text-2xl font-black tracking-tight text-foreground outline-none bg-transparent"
              placeholder="50,000"
            />
          </div>
        </div>

        {/* Tier Discount Note */}
        {sendAmount >= 200000 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            <span>✨</span>
            <span>Sending over ৳200,000 BDT? Preferred institutional rate applied.</span>
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
              {selectedDest.symbol}{recipientGets}
            </p>
          </div>
        </div>

        {/* Transparent Details Breakdown */}
        <div className="space-y-2 rounded-2xl border bg-muted/30 p-3.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
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
              ৳{fee.toFixed(2)} BDT <span className="text-[10px] text-muted-foreground">(included)</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSendMoney}
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
        >
          <span>Send money now</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
