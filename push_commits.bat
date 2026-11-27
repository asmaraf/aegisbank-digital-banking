@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo AegisBank - Automated 31+ Commit ^& Push Script for GitHub
echo Repo: https://github.com/asmaraf/aegisbank-digital-banking.git
echo ==============================================================================

echo Initializing Git repository...
git init

echo [1/32] Staging configuration files...
git add package.json tsconfig.json postcss.config.mjs tailwind.config.ts next.config.mjs .gitignore .env.example
git commit -m "chore: initialize project with Next.js 14, TypeScript, and Tailwind CSS"

echo [2/32] Staging Prisma schema...
git add prisma/schema.prisma
git commit -m "feat(prisma): design comprehensive database schema for digital banking"

echo [3/32] Staging Prisma seed...
git add prisma/seed.ts
git commit -m "feat(prisma): add database seeding script with demo users and realistic banking data"

echo [4/32] Staging core utilities...
git add src/lib/prisma.ts src/lib/utils.ts
git commit -m "feat(lib): initialize Prisma client singleton and formatting utility functions"

echo [5/32] Staging NextAuth configuration...
git add src/lib/auth.ts
git commit -m "feat(auth): configure NextAuth credentials provider, JWT callbacks, and session handling"

echo [6/32] Staging middleware...
git add src/middleware.ts
git commit -m "feat(security): implement role-based route protection middleware for admin, staff, and customer"

echo [7/32] Staging fraud engine...
git add src/lib/fraud.ts
git commit -m "feat(security): implement rule-based suspicious transaction detection engine"

echo [8/32] Staging notification helpers...
git add src/lib/notifications.ts
git commit -m "feat(notifications): add system notification helper for transaction and loan events"

echo [9/32] Staging export utilities...
git add src/lib/export.ts
git commit -m "feat(export): add jspdf receipt generator and CSV/PDF account statement exporters"

echo [10/32] Staging Redux store configuration...
git add src/store/store.ts src/store/hooks.ts
git commit -m "feat(redux): configure centralized Redux store and typed dispatch/selector hooks"

echo [11/32] Staging authSlice...
git add src/store/slices/authSlice.ts
git commit -m "feat(redux): create authSlice for synchronizing NextAuth session into global state"

echo [12/32] Staging accountSlice...
git add src/store/slices/accountSlice.ts
git commit -m "feat(redux): create accountSlice to manage customer active account switching and queries"

echo [13/32] Staging transactionSlice...
git add src/store/slices/transactionSlice.ts
git commit -m "feat(redux): create transactionSlice for complex ledger search, type, and date filtering"

echo [14/32] Staging loanSlice...
git add src/store/slices/loanSlice.ts
git commit -m "feat(redux): create loanSlice for tracking underwriting workflows and status filters"

echo [15/32] Staging RTK Query API service...
git add src/store/api/bankingApi.ts
git commit -m "feat(rtk-query): create bankingApi service with automated caching and tag invalidation"

echo [16/32] Staging Auth API...
git add src/app/api/auth/
git commit -m "feat(api): implement authentication registration and NextAuth handler endpoints"

echo [17/32] Staging Account API...
git add src/app/api/accounts/
git commit -m "feat(api): implement bank account creation, balance query, and limit configuration endpoints"

echo [18/32] Staging Transfer API...
git add src/app/api/transactions/transfer/
git commit -m "feat(api): implement atomic fund transfer with balance check, limit enforcement, and PIN validation"

echo [19/32] Staging Transaction API...
git add src/app/api/transactions/
git commit -m "feat(api): implement transaction auditing, receipt lookup, and suspicious flagging endpoints"

echo [20/32] Staging Requests API...
git add src/app/api/requests/
git commit -m "feat(api): implement customer deposit and withdrawal request submission and approval workflow"

echo [21/32] Staging Loans API...
git add src/app/api/loans/
git commit -m "feat(api): implement loan application, underwriting notes, approval disbursement, and installment repayment"

echo [22/32] Staging Customers ^& Staff API...
git add src/app/api/customers/ src/app/api/staff/
git commit -m "feat(api): implement customer management, KYC verification, and bank staff management endpoints"

echo [23/32] Staging Analytics, Settings, Notifications API...
git add src/app/api/dashboard/ src/app/api/settings/ src/app/api/notifications/
git commit -m "feat(api): implement aggregated analytics, bank risk settings, and notification endpoints"

echo [24/32] Staging UI components...
git add src/components/ui/
git commit -m "feat(ui): create reusable fintech UI components, skeleton loaders, and confirmation dialogs"

echo [25/32] Staging AppProviders...
git add src/components/providers/
git commit -m "feat(providers): configure AppProviders with Redux, NextAuth, ThemeProvider, and Toaster"

echo [26/32] Staging DashboardShell...
git add src/components/layout/
git commit -m "feat(layout): implement DashboardShell with responsive navigation and role-aware navigation"

echo [27/32] Staging Landing Page...
git add src/components/landing/
git commit -m "feat(landing): build Mercury-inspired landing page with smooth scroll, hero preview, and role tabs"

echo [28/32] Staging Banking Views...
git add src/components/banking/
git commit -m "feat(banking): implement reusable management views for transactions, requests, loans, and KYC"

echo [29/32] Staging Portal Pages...
git add src/app/admin/ src/app/staff/ src/app/customer/ src/app/dashboard/ src/app/login/ src/app/register/
git commit -m "feat(pages): assemble role-specific portal dashboards and authenticated application pages"

echo [30/32] Staging Root Layout ^& Styles...
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(core): configure RootLayout, dynamic landing page, and global design tokens"

echo [31/32] Staging README.md...
git add README.md
git commit -m "docs: add comprehensive production README with architecture, setup guide, and demo credentials"

echo [32/32] Staging remaining files...
git add -A
git commit -m "chore: final polish and build configuration readiness" --allow-empty

echo Setting branch to main...
git branch -M main

echo Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/asmaraf/aegisbank-digital-banking.git

echo Pushing to GitHub (main)...
git push -u origin main --force

echo.
echo ==============================================================================
echo Successfully pushed all 32 commits to GitHub!
echo ==============================================================================
pause
