# AegisBank — Advanced Digital Banking Management System

A full-stack, production-grade Digital Banking Management System built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Redux Toolkit + RTK Query**, **Recharts**, **NextAuth.js**, and **Prisma (PostgreSQL)**.

---

## Project Overview

AegisBank simulates a real-world multi-role banking organization with strict server-side authorization, atomic financial transactions, loan underwriting and repayment schedules, suspicious transaction monitoring, and interactive financial analytics.

---

## Application Features

- **Multi-Role Portals**: Separate, role-protected dashboards for **Admin**, **Bank Staff**, and **Customer**.
- **Atomic Fund Transfers**: Server-side PIN validation, optional 2FA verification, single/daily transaction limit enforcement, minimum balance protection, idempotency keys, and instant PDF receipts.
- **Deposit & Withdrawal Workflow**: Customers submit deposit/withdrawal requests; Staff/Admin approve or reject with atomic balance settlement.
- **Loan Lifecycle Management**: Customers apply for loans, view repayment schedules, and pay monthly installments; Staff add internal notes and forward applications; Admin approves (disbursing funds via a recorded banking transaction) or rejects.
- **Real-Time Data Visualization**: Recharts visualizations powered by live aggregated database queries (Monthly Volume, Deposits vs Withdrawals, Account Distribution, Loan Approval Statistics, Customer Cashflow).
- **Exports & Receipts**: Downloadable PDF transaction receipts (`jspdf`) and CSV/PDF account statements.
- **Notifications & Dark Mode**: Real-time notification bell with unread counts and full light/dark theme support.

---

## User Roles & Permissions

| Role | Capabilities | Restrictions |
| :--- | :--- | :--- |
| **Admin** | Full analytics, customer activation/blocking, account creation/freezing/limits, loan approval/rejection, transaction reversal, bank-wide risk settings | Server-enforced `ADMIN` role check on all admin endpoints |
| **Bank Staff** | Register customers, open accounts, verify KYC, process deposit/withdrawal requests, flag suspicious transactions, add loan notes & forward to Admin | Cannot approve/reject loans, cannot reverse transactions, cannot modify bank-wide settings |
| **Customer** | Multi-account switcher, view balances/statements (PDF/CSV), atomic fund transfers, deposit/withdrawal requests, apply & repay loans, PIN & 2FA security | Strictly scoped to own `userId` records; cannot approve own requests or access admin/staff routes |

---

## Redux Toolkit Architecture

State is organized into modular feature slices under `src/store/`:
- `src/store/slices/authSlice.ts`: Synchronized session identity, role, and auth loading/error states.
- `src/store/slices/accountSlice.ts`: Active customer account selection and account search state.
- `src/store/slices/transactionSlice.ts`: Search, type/status/date filters, flagged-only toggle, and pagination state.
- `src/store/slices/loanSlice.ts`: Selected loan and underwriting filter state.

---

## RTK Query Implementation

`src/store/api/bankingApi.ts` implements `createApi` with `fetchBaseQuery({ baseUrl: "/api" })` and tag-based cache invalidation (`Analytics`, `Accounts`, `Transactions`, `Requests`, `Loans`, `Customers`, `Notifications`, `Settings`). Any mutation (such as `transferFunds`, `processRequest`, `updateLoan`, or `repayLoan`) automatically invalidates affected tags so balances, charts, and notifications stay synchronized across the UI.

---

## Authentication Strategy

- **NextAuth.js** (`CredentialsProvider` + JWT strategy) configured in `src/lib/auth.ts`.
- Passwords and Transaction PINs are hashed using `bcryptjs`.
- `src/middleware.ts` enforces route-level protection for `/admin/*`, `/staff/*`, `/customer/*`, and `/dashboard`.
- Every API route calls `requireAuth(allowedRoles)` which verifies both the JWT session and the user's live `ACTIVE` status in PostgreSQL.

---

## Transaction Processing Logic

All financial mutations (`POST /api/transactions/transfer`, `PATCH /api/requests/[id]`, `PATCH /api/loans/[id]`, `POST /api/loans/[id]/repay`) execute inside `prisma.$transaction(async (tx) => { ... })`:
1. Validates account ownership, `ACTIVE` status, and sufficient available balance (`balance - minBalance`).
2. Enforces single-transaction and rolling 24-hour daily transfer limits.
3. Validates `transactionPinHash` (and 6-digit 2FA code if enabled) on transfers.
4. Checks `idempotencyKey` to prevent duplicate submissions.
5. Atomically debits sender and credits receiver, writes an immutable `Transaction` record with a unique `TXN-YYYYMMDD-XXXXXX` ID, flags amounts exceeding `suspiciousAmountThreshold`, and dispatches notifications.

---

## Database Structure

Defined in `prisma/schema.prisma` (PostgreSQL):
- `User` (roles, KYC status, hashed password & PIN, 2FA flag)
- `BankAccount` (`SAVINGS`, `CURRENT`, `BUSINESS`, balances, per-account limits)
- `Transaction` (immutable ledger with sender/receiver, fee, status, idempotency key, flag status)
- `DepositWithdrawRequest` (pending/approved/rejected workflow)
- `LoanApplication` & `LoanRepayment` (underwriting, disbursement, installment schedule)
- `Notification` (per-user alerts)
- `BankSettings` (global risk & limit defaults)

---

## Security Implementation

- Server-side balance, limit, and ownership validation (frontend values are never trusted).
- Database-level atomic transactions for all money movement.
- Self-approval prevention on deposit/withdrawal requests and loan applications.
- Role-based middleware + per-route `requireAuth()` enforcement.

---

## Environment Variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/aegisbank?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-secure-random-32-char-secret"
```

---

## Local Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure .env with your PostgreSQL / Neon connection string
cp .env.example .env

# 3. Generate Prisma Client & push schema
npx prisma generate
npx prisma db push

# 4. Seed demo data (Admin, Staff, Customers, Accounts, Transactions, Loans)
npm run db:seed

# 5. Start development server
npm run dev
```

---

## Deployment Instructions (Vercel + Neon PostgreSQL)

1. Provision a PostgreSQL database on **Neon** (or Supabase/Railway) and copy the `DATABASE_URL`.
2. Push this repository to a public GitHub repository.
3. Import the repository into **Vercel**, add `DATABASE_URL`, `NEXTAUTH_URL` (your Vercel domain), and `NEXTAUTH_SECRET` in Environment Variables.
4. Run `npx prisma db push && npm run db:seed` against your production `DATABASE_URL` to initialize tables and demo accounts.
5. Deploy on Vercel.

---

## Demo Credentials

| Role | Email | Password | Transaction PIN |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aegisbank.com` | `Admin@123` | `1234` |
| **Bank Staff** | `staff@aegisbank.com` | `Staff@123` | `1234` |
| **Customer** | `customer@aegisbank.com` | `Customer@123` | `1234` |
