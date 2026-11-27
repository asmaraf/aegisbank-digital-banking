import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerCustomerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  dateOfBirth: z.string().optional(),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]).default("SAVINGS"),
  transactionPin: z
    .string()
    .regex(/^\d{4,6}$/, "Transaction PIN must be 4 to 6 digits"),
});

export const transferSchema = z.object({
  senderAccountId: z.string().min(1, "Source account is required"),
  recipientAccountNumber: z
    .string()
    .min(6, "Recipient account number is required")
    .trim(),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(1000000, "Amount exceeds maximum allowed"),
  description: z
    .string()
    .min(3, "Please provide a short description")
    .max(200, "Description too long"),
  transactionPin: z
    .string()
    .regex(/^\d{4,6}$/, "Valid 4-6 digit Transaction PIN is required"),
  twoFactorCode: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const depositWithdrawSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(500000, "Maximum single request is $500,000"),
  description: z
    .string()
    .min(3, "Description is required")
    .max(200, "Description too long"),
});

export const loanApplicationSchema = z.object({
  accountId: z.string().min(1, "Disbursement account is required"),
  loanType: z.enum(["PERSONAL", "HOME", "AUTO", "BUSINESS", "EDUCATION"]),
  requestedAmount: z.coerce
    .number()
    .min(500, "Minimum loan amount is $500")
    .max(500000, "Maximum loan amount is $500,000"),
  durationMonths: z.coerce
    .number()
    .int()
    .min(3, "Minimum duration is 3 months")
    .max(120, "Maximum duration is 120 months"),
  monthlyIncome: z.coerce
    .number()
    .positive("Monthly income must be greater than zero"),
  employmentStatus: z.enum([
    "EMPLOYED",
    "SELF_EMPLOYED",
    "BUSINESS_OWNER",
    "UNEMPLOYED",
    "STUDENT",
  ]),
  description: z
    .string()
    .min(10, "Please describe the purpose of your loan (min 10 characters)")
    .max(500, "Description too long"),
});

export const createAccountSchema = z.object({
  userId: z.string().min(1, "Customer is required"),
  accountType: z.enum(["SAVINGS", "CURRENT", "BUSINESS"]),
  initialDeposit: z.coerce.number().min(0).default(0),
  dailyTransferLimit: z.coerce.number().positive().default(10000),
  maxSingleTransaction: z.coerce.number().positive().default(5000),
  minBalance: z.coerce.number().min(0).default(0),
});

export const updateAccountLimitsSchema = z.object({
  dailyTransferLimit: z.coerce.number().positive(),
  maxSingleTransaction: z.coerce.number().positive(),
  minBalance: z.coerce.number().min(0),
});

export const bankSettingsSchema = z.object({
  defaultDailyTransferLimit: z.coerce.number().positive(),
  defaultMaxSingleTx: z.coerce.number().positive(),
  defaultMinBalance: z.coerce.number().min(0),
  suspiciousAmountThreshold: z.coerce.number().positive(),
  transferFeePercent: z.coerce.number().min(0).max(10),
});

export const updatePinSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits"),
});
