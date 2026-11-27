"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Wallet,
  Users,
  ShieldAlert,
  Settings,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCheck,
  FileText,
  CreditCard,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from "@/store/api/bankingApi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS_BY_ROLE: Record<string, NavGroup[]> = {
  ADMIN: [
    {
      group: "Executive",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Customers", href: "/admin/customers", icon: Users },
        { label: "Bank Staff", href: "/admin/staff", icon: UserCheck },
        { label: "Bank Accounts", href: "/admin/accounts", icon: CreditCard },
      ],
    },
    {
      group: "Operations & Credit",
      items: [
        { label: "Transactions", href: "/admin/transactions", icon: ArrowLeftRight },
        { label: "Deposit / Withdraw", href: "/admin/requests", icon: Wallet },
        { label: "Loans & Credit", href: "/admin/loans", icon: Landmark },
      ],
    },
    {
      group: "Governance",
      items: [{ label: "Risk & Settings", href: "/admin/settings", icon: ShieldAlert }],
    },
  ],
  STAFF: [
    {
      group: "Operations",
      items: [
        { label: "Staff Dashboard", href: "/staff", icon: LayoutDashboard },
        { label: "Customers & KYC", href: "/staff/customers", icon: Users },
      ],
    },
    {
      group: "Queues & Review",
      items: [
        { label: "Transactions", href: "/staff/transactions", icon: ArrowLeftRight },
        { label: "Pending Requests", href: "/staff/requests", icon: Wallet },
        { label: "Loan Assistance", href: "/staff/loans", icon: Landmark },
      ],
    },
    {
      group: "Account",
      items: [{ label: "Security", href: "/staff/settings", icon: Settings }],
    },
  ],
  CUSTOMER: [
    {
      group: "Treasury",
      items: [
        { label: "Dashboard", href: "/customer", icon: LayoutDashboard },
        { label: "Accounts", href: "/customer/accounts", icon: CreditCard },
      ],
    },
    {
      group: "Payments & Credit",
      items: [
        { label: "Transfer Funds", href: "/customer/transfer", icon: ArrowLeftRight },
        { label: "Deposit / Withdraw", href: "/customer/requests", icon: Wallet },
        { label: "Transactions", href: "/customer/transactions", icon: FileText },
        { label: "Loans", href: "/customer/loans", icon: Landmark },
      ],
    },
    {
      group: "Preferences",
      items: [{ label: "Security & PIN", href: "/customer/settings", icon: Settings }],
    },
  ],
};

export function DashboardShell({
  children,
  onSearch,
}: {
  children: React.ReactNode;
  onSearch?: (q: string) => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const role = session?.user?.role || "CUSTOMER";
  const navGroups = NAV_GROUPS_BY_ROLE[role] || NAV_GROUPS_BY_ROLE.CUSTOMER;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  const { data: notifData } = useGetNotificationsQuery(undefined, {
    skip: !session?.user,
    pollingInterval: 120000,
  });
  const [markRead] = useMarkNotificationsReadMutation();

  const notifications = notifData?.notifications ?? [];
  const unreadCount = notifData?.unreadCount ?? 0;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex min-h-screen bg-background bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.07),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.05),transparent_45%)] text-foreground">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card/90 backdrop-blur-md transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen",
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Landmark className="h-4 w-4" strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight">AegisBank</span>
                <span className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                  {role.toLowerCase()}
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-medium text-muted-foreground/80">
                  {group.group}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-white"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId={`sidebarActive-${role}`}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0 rounded-xl bg-indigo-600"
                        />
                      )}
                      <Icon className="relative z-10 h-4 w-4 shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span className="relative z-10">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Scroll-Aware Dynamic Topbar */}
        <header
          className={cn(
            "sticky top-0 z-30 flex items-center justify-between gap-4 transition-[margin,border-radius,background-color,box-shadow] duration-200",
            isScrolled
              ? "mx-3 mt-3 h-14 rounded-2xl border bg-card/85 px-4 shadow-lg backdrop-blur-xl lg:mx-8 lg:px-6"
              : "h-16 border-b bg-card/70 px-4 backdrop-blur-md lg:px-8"
          )}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <span className="font-semibold text-foreground">AegisBank</span>
              {segments.map((seg) => (
                <React.Fragment key={seg}>
                  <span>/</span>
                  <span className="capitalize">{seg}</span>
                </React.Fragment>
              ))}
            </div>

            {onSearch && (
              <div className="relative hidden sm:block md:ml-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transactions, accounts..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-60 rounded-xl border bg-background py-1.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 lg:w-72"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
              title="Return to Public Landing Page"
            >
              <span>Public Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="relative rounded-xl border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-card p-3 shadow-xl sm:w-96">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markRead({ markAll: true })}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-muted-foreground">
                        No notifications yet
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && markRead({ id: n.id })}
                          className={cn(
                            "cursor-pointer rounded-xl p-2.5 text-xs transition",
                            n.isRead
                              ? "bg-background text-muted-foreground"
                              : "bg-indigo-500/10 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{n.title}</span>
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-indigo-600" />
                            )}
                          </div>
                          <p className="mt-1 leading-relaxed">{n.message}</p>
                          <p className="mt-1 text-[10px] opacity-70">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-left hover:bg-muted"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-semibold leading-none">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border bg-card p-2 shadow-xl">
                  <div className="border-b px-3 py-2">
                    <p className="text-xs font-semibold">{session?.user?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{role} Account</p>
                  </div>
                  <Link
                    href={`/${role.toLowerCase()}/settings`}
                    onClick={() => setProfileOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Security & Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
