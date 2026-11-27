# ==============================================================================
# AegisBank - Automated 31+ Commit & Push Script for GitHub
# Repo: https://github.com/asmaraf/aegisbank-digital-banking.git
# ==============================================================================

Write-Host ">>> Initializing Git repository..." -ForegroundColor Cyan
git init

# Configure safe directory if needed
git config --global --add safe.directory $PSScriptRoot

# 1. Base Config & Dependencies
Write-Host ">>> [1/32] Staging configuration files..." -ForegroundColor Yellow
git add package.json tsconfig.json postcss.config.mjs tailwind.config.ts next.config.mjs .gitignore .env.example
git commit -m "chore: initialize project with Next.js 14, TypeScript, and Tailwind CSS"

# 2. Database Schema
Write-Host ">>> [2/32] Staging Prisma schema..." -ForegroundColor Yellow
git add prisma/schema.prisma
git commit -m "feat(prisma): design comprehensive database schema for digital banking"

# 3. Database Seed
Write-Host ">>> [3/32] Staging Prisma seed..." -ForegroundColor Yellow
git add prisma/seed.ts
git commit -m "feat(prisma): add database seeding script with demo users and realistic banking data"

# 4. Lib Core & Utilities
Write-Host ">>> [4/32] Staging core utilities..." -ForegroundColor Yellow
git add src/lib/prisma.ts src/lib/utils.ts
git commit -m "feat(lib): initialize Prisma client singleton and formatting utility functions"

# 5. Authentication Config
Write-Host ">>> [5/32] Staging NextAuth configuration..." -ForegroundColor Yellow
git add src/lib/auth.ts
git commit -m "feat(auth): configure NextAuth credentials provider, JWT callbacks, and session handling"

# 6. Route Security Middleware
Write-Host ">>> [6/32] Staging middleware..." -ForegroundColor Yellow
git add src/middleware.ts
git commit -m "feat(security): implement role-based route protection middleware for admin, staff, and customer"

# 7. Fraud Engine
Write-Host ">>> [7/32] Staging fraud engine..." -ForegroundColor Yellow
git add src/lib/fraud.ts
git commit -m "feat(security): implement rule-based suspicious transaction detection engine"

# 8. Notifications Lib
Write-Host ">>> [8/32] Staging notification helpers..." -ForegroundColor Yellow
git add src/lib/notifications.ts
git commit -m "feat(notifications): add system notification helper for transaction and loan events"

# 9. Statement & Receipt Exporters
Write-Host ">>> [9/32] Staging export utilities..." -ForegroundColor Yellow
git add src/lib/export.ts
git commit -m "feat(export): add jspdf receipt generator and CSV/PDF account statement exporters"

# 10. Redux Store & Hooks
Write-Host ">>> [10/32] Staging Redux store configuration..." -ForegroundColor Yellow
git add src/store/store.ts src/store/hooks.ts
git commit -m "feat(redux): configure centralized Redux store and typed dispatch/selector hooks"

# 11. Auth Slice
Write-Host ">>> [11/32] Staging authSlice..." -ForegroundColor Yellow
git add src/store/slices/authSlice.ts
git commit -m "feat(redux): create authSlice for synchronizing NextAuth session into global state"

# 12. Account Slice
Write-Host ">>> [12/32] Staging accountSlice..." -ForegroundColor Yellow
git add src/store/slices/accountSlice.ts
git commit -m "feat(redux): create accountSlice to manage customer active account switching and queries"

# 13. Transaction Slice
Write-Host ">>> [13/32] Staging transactionSlice..." -ForegroundColor Yellow
git add src/store/slices/transactionSlice.ts
git commit -m "feat(redux): create transactionSlice for complex ledger search, type, and date filtering"

# 14. Loan Slice
Write-Host ">>> [14/32] Staging loanSlice..." -ForegroundColor Yellow
git add src/store/slices/loanSlice.ts
git commit -m "feat(redux): create loanSlice for tracking underwriting workflows and status filters"

# 15. RTK Query Banking API
Write-Host ">>> [15/32] Staging RTK Query API service..." -ForegroundColor Yellow
git add src/store/api/bankingApi.ts
git commit -m "feat(rtk-query): create bankingApi service with automated caching and tag invalidation"

# 16. Auth API Endpoints
Write-Host ">>> [16/32] Staging Auth API..." -ForegroundColor Yellow
git add src/app/api/auth/
git commit -m "feat(api): implement authentication registration and NextAuth handler endpoints"

# 17. Account API Endpoints
Write-Host ">>> [17/32] Staging Account API..." -ForegroundColor Yellow
git add src/app/api/accounts/
git commit -m "feat(api): implement bank account creation, balance query, and limit configuration endpoints"

# 18. Transfer API Endpoint
Write-Host ">>> [18/32] Staging Transfer API..." -ForegroundColor Yellow
git add src/app/api/transactions/transfer/
git commit -m "feat(api): implement atomic fund transfer with balance check, limit enforcement, and PIN validation"

# 19. Transaction Ledger API Endpoints
Write-Host ">>> [19/32] Staging Transaction API..." -ForegroundColor Yellow
git add src/app/api/transactions/
git commit -m "feat(api): implement transaction auditing, receipt lookup, and suspicious flagging endpoints"

# 20. Deposit & Withdrawal Request API
Write-Host ">>> [20/32] Staging Requests API..." -ForegroundColor Yellow
git add src/app/api/requests/
git commit -m "feat(api): implement customer deposit and withdrawal request submission and approval workflow"

# 21. Loan Management API
Write-Host ">>> [21/32] Staging Loans API..." -ForegroundColor Yellow
git add src/app/api/loans/
git commit -m "feat(api): implement loan application, underwriting notes, approval disbursement, and installment repayment"

# 22. Customer & Staff API
Write-Host ">>> [22/32] Staging Customers & Staff API..." -ForegroundColor Yellow
git add src/app/api/customers/ src/app/api/staff/
git commit -m "feat(api): implement customer management, KYC verification, and bank staff management endpoints"

# 23. Analytics, Settings & Notifications API
Write-Host ">>> [23/32] Staging Analytics, Settings, Notifications API..." -ForegroundColor Yellow
git add src/app/api/dashboard/ src/app/api/settings/ src/app/api/notifications/
git commit -m "feat(api): implement aggregated analytics, bank risk settings, and notification endpoints"

# 24. Reusable UI Components
Write-Host ">>> [24/32] Staging UI components..." -ForegroundColor Yellow
git add src/components/ui/
git commit -m "feat(ui): create reusable fintech UI components, skeleton loaders, and confirmation dialogs"

# 25. App Providers
Write-Host ">>> [25/32] Staging AppProviders..." -ForegroundColor Yellow
git add src/components/providers/
git commit -m "feat(providers): configure AppProviders with Redux, NextAuth, ThemeProvider, and Toaster"

# 26. Layout Shell
Write-Host ">>> [26/32] Staging DashboardShell..." -ForegroundColor Yellow
git add src/components/layout/
git commit -m "feat(layout): implement DashboardShell with responsive navigation and role-aware navigation"

# 27. Landing Page
Write-Host ">>> [27/32] Staging Landing Page..." -ForegroundColor Yellow
git add src/components/landing/
git commit -m "feat(landing): build Mercury-inspired landing page with smooth scroll, hero preview, and role tabs"

# 28. Shared Banking Views
Write-Host ">>> [28/32] Staging Banking Views..." -ForegroundColor Yellow
git add src/components/banking/
git commit -m "feat(banking): implement reusable management views for transactions, requests, loans, and KYC"

# 29. Admin, Staff, and Customer Pages
Write-Host ">>> [29/32] Staging Portal Pages..." -ForegroundColor Yellow
git add src/app/admin/ src/app/staff/ src/app/customer/ src/app/dashboard/ src/app/login/ src/app/register/
git commit -m "feat(pages): assemble role-specific portal dashboards and authenticated application pages"

# 30. Root Layout & Styles
Write-Host ">>> [30/32] Staging Root Layout & Styles..." -ForegroundColor Yellow
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(core): configure RootLayout, dynamic landing page, and global design tokens"

# 31. Documentation & Media (README.md & Preview Assets)
Write-Host ">>> [31/32] Staging README.md and media preview assets..." -ForegroundColor Yellow
git add README.md public/
git commit -m "docs: add comprehensive production README with architecture, preview screenshot, and credentials"

# 32. Remaining Files & Final Polish
Write-Host ">>> [32/32] Staging remaining files..." -ForegroundColor Yellow
git add -A
git commit -m "chore: final polish and build configuration readiness" --allow-empty

# 33. Set branch and push to remote
Write-Host ">>> Setting branch to main..." -ForegroundColor Cyan
git branch -M main

Write-Host ">>> Setting remote origin to https://github.com/asmaraf/aegisbank-digital-banking.git..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/asmaraf/aegisbank-digital-banking.git

Write-Host ">>> Pushing to GitHub (main)..." -ForegroundColor Green
git push -u origin main --force

Write-Host ""
Write-Host ">>> Successfully pushed all 32 commits to GitHub!" -ForegroundColor Green
