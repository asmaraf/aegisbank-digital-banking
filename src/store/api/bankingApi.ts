import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface BankAccountDTO {
  id: string;
  accountNumber: string;
  userId: string;
  accountType: "SAVINGS" | "CURRENT" | "BUSINESS";
  balance: number;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  dailyTransferLimit: number;
  maxSingleTransaction: number;
  minBalance: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    status?: string;
    kycVerified?: boolean;
  };
}

export interface TransactionDTO {
  id: string;
  transactionId: string;
  senderAccountId: string | null;
  receiverAccountId: string | null;
  senderAccountNumber: string | null;
  receiverAccountNumber: string | null;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "LOAN_DISBURSEMENT" | "LOAN_REPAYMENT";
  amount: number;
  fee: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  description: string;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  senderAccount?: {
    id: string;
    accountNumber: string;
    user?: { name: string; email: string };
  } | null;
  receiverAccount?: {
    id: string;
    accountNumber: string;
    user?: { name: string; email: string };
  } | null;
}

export interface DepositWithdrawRequestDTO {
  id: string;
  userId: string;
  accountId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  account: { id: string; accountNumber: string; accountType: string; balance?: number };
}

export interface LoanRepaymentDTO {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  dueDate: string;
  paidAt: string | null;
  status: "UPCOMING" | "PAID" | "OVERDUE";
  transactionId: string | null;
}

export interface LoanApplicationDTO {
  id: string;
  userId: string;
  accountId: string;
  loanType: "PERSONAL" | "HOME" | "AUTO" | "BUSINESS" | "EDUCATION";
  requestedAmount: number;
  approvedAmount: number | null;
  interestRate: number;
  durationMonths: number;
  monthlyIncome: number;
  employmentStatus: string;
  description: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED";
  staffNotes: string | null;
  remainingBalance: number;
  disbursedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; kycVerified: boolean };
  account?: { id: string; accountNumber: string; accountType: string };
  repayments: LoanRepaymentDTO[];
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  kycVerified: boolean;
  createdAt: string;
  totalBalance: number;
  accounts: {
    id: string;
    accountNumber: string;
    accountType: string;
    balance: number;
    status: string;
  }[];
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  createdAt: string;
}

export const bankingApi = createApi({
  reducerPath: "bankingApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  tagTypes: [
    "Analytics",
    "Accounts",
    "Transactions",
    "Requests",
    "Loans",
    "Customers",
    "Notifications",
    "Settings",
  ],
  endpoints: (builder) => ({
    getAnalytics: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/analytics",
      providesTags: ["Analytics"],
    }),

    getAccounts: builder.query<{ accounts: BankAccountDTO[] }, { search?: string } | void>({
      query: (params) =>
        params?.search ? `/accounts?search=${encodeURIComponent(params.search)}` : "/accounts",
      providesTags: ["Accounts"],
    }),

    createAccount: builder.mutation<
      { account: BankAccountDTO },
      {
        userId: string;
        accountType: string;
        initialDeposit: number;
        dailyTransferLimit: number;
        maxSingleTransaction: number;
        minBalance: number;
      }
    >({
      query: (body) => ({ url: "/accounts", method: "POST", body }),
      invalidatesTags: ["Accounts", "Customers", "Analytics", "Transactions"],
    }),

    updateAccount: builder.mutation<
      { account: BankAccountDTO },
      {
        id: string;
        status?: string;
        accountType?: string;
        dailyTransferLimit?: number;
        maxSingleTransaction?: number;
        minBalance?: number;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/accounts/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Accounts", "Analytics", "Customers", "Notifications"],
    }),

    getTransactions: builder.query<
      {
        transactions: TransactionDTO[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      },
      {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        status?: string;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        flaggedOnly?: boolean;
      }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.page) sp.set("page", String(params.page));
        if (params.limit) sp.set("limit", String(params.limit));
        if (params.search) sp.set("search", params.search);
        if (params.type) sp.set("type", params.type);
        if (params.status) sp.set("status", params.status);
        if (params.accountId) sp.set("accountId", params.accountId);
        if (params.startDate) sp.set("startDate", params.startDate);
        if (params.endDate) sp.set("endDate", params.endDate);
        if (params.flaggedOnly) sp.set("flaggedOnly", "true");
        return `/transactions?${sp.toString()}`;
      },
      providesTags: ["Transactions"],
    }),

    transferFunds: builder.mutation<
      { message: string; transaction: TransactionDTO },
      {
        senderAccountId: string;
        recipientAccountNumber: string;
        amount: number;
        description: string;
        transactionPin: string;
        twoFactorCode?: string;
        idempotencyKey?: string;
      }
    >({
      query: (body) => ({ url: "/transactions/transfer", method: "POST", body }),
      invalidatesTags: ["Accounts", "Transactions", "Analytics", "Notifications"],
    }),

    flagTransaction: builder.mutation<
      { transaction: TransactionDTO },
      { id: string; action: "FLAG" | "CLEAR" | "REVERSE"; flagReason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/transactions/${id}/flag`, method: "PATCH", body }),
      invalidatesTags: ["Transactions", "Accounts", "Analytics"],
    }),

    getRequests: builder.query<{ requests: DepositWithdrawRequestDTO[] }, { status?: string } | void>({
      query: (params) =>
        params?.status ? `/requests?status=${params.status}` : "/requests",
      providesTags: ["Requests"],
    }),

    createRequest: builder.mutation<
      { request: DepositWithdrawRequestDTO },
      { accountId: string; type: "DEPOSIT" | "WITHDRAWAL"; amount: number; description: string }
    >({
      query: (body) => ({ url: "/requests", method: "POST", body }),
      invalidatesTags: ["Requests"],
    }),

    processRequest: builder.mutation<
      { request: DepositWithdrawRequestDTO },
      { id: string; decision: "APPROVED" | "REJECTED"; reviewNote?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/requests/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Requests", "Accounts", "Transactions", "Analytics", "Notifications"],
    }),

    getLoans: builder.query<{ loans: LoanApplicationDTO[] }, void>({
      query: () => "/loans",
      providesTags: ["Loans"],
    }),

    applyLoan: builder.mutation<
      { loan: LoanApplicationDTO },
      {
        accountId: string;
        loanType: string;
        requestedAmount: number;
        durationMonths: number;
        monthlyIncome: number;
        employmentStatus: string;
        description: string;
      }
    >({
      query: (body) => ({ url: "/loans", method: "POST", body }),
      invalidatesTags: ["Loans", "Analytics", "Notifications"],
    }),

    updateLoan: builder.mutation<
      { loan: LoanApplicationDTO },
      { id: string; action: "FORWARD" | "APPROVE" | "REJECT"; staffNotes?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/loans/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Loans", "Accounts", "Transactions", "Analytics", "Notifications"],
    }),

    repayLoan: builder.mutation<{ message: string }, { id: string; accountId?: string }>({
      query: ({ id, ...body }) => ({ url: `/loans/${id}/repay`, method: "POST", body }),
      invalidatesTags: ["Loans", "Accounts", "Transactions", "Analytics", "Notifications"],
    }),

    getCustomers: builder.query<{ customers: CustomerDTO[] }, { search?: string } | void>({
      query: (params) =>
        params?.search ? `/customers?search=${encodeURIComponent(params.search)}` : "/customers",
      providesTags: ["Customers"],
    }),

    registerCustomer: builder.mutation<
      { customer: { id: string; name: string; email: string } },
      Record<string, unknown>
    >({
      query: (body) => ({ url: "/customers", method: "POST", body }),
      invalidatesTags: ["Customers", "Accounts", "Analytics"],
    }),

    getCustomerDetail: builder.query<
      { customer: CustomerDTO & { loanApplications: LoanApplicationDTO[] }; transactions: TransactionDTO[] },
      string
    >({
      query: (id) => `/customers/${id}`,
      providesTags: ["Customers"],
    }),

    updateCustomer: builder.mutation<
      { customer: CustomerDTO },
      { id: string; status?: string; kycVerified?: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Customers", "Analytics"],
    }),

    getNotifications: builder.query<
      { notifications: NotificationDTO[]; unreadCount: number },
      void
    >({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),

    markNotificationsRead: builder.mutation<{ success: boolean }, { id?: string; markAll?: boolean }>({
      query: (body) => ({ url: "/notifications", method: "PATCH", body }),
      invalidatesTags: ["Notifications"],
    }),

    getSettings: builder.query<
      {
        profile: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string | null;
          role: string;
          kycVerified: boolean;
          twoFactorEnabled: boolean;
          hasPin: boolean;
        } | null;
        bankSettings: {
          defaultDailyTransferLimit: number;
          defaultMaxSingleTx: number;
          defaultMinBalance: number;
          suspiciousAmountThreshold: number;
          transferFeePercent: number;
        } | null;
      },
      void
    >({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetAnalyticsQuery,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useGetTransactionsQuery,
  useTransferFundsMutation,
  useFlagTransactionMutation,
  useGetRequestsQuery,
  useCreateRequestMutation,
  useProcessRequestMutation,
  useGetLoansQuery,
  useApplyLoanMutation,
  useUpdateLoanMutation,
  useRepayLoanMutation,
  useGetCustomersQuery,
  useRegisterCustomerMutation,
  useGetCustomerDetailQuery,
  useUpdateCustomerMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = bankingApi;
