import { PrismaClient, Role, AccountType, TransactionType, TransactionStatus, LoanType, LoanStatus, EmploymentStatus, RequestStatus, RepaymentStatus, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function monthsAgo(months: number, dayOffset = 0): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(Math.max(1, Math.min(28, 15 + dayOffset)));
  return d;
}

function monthsFromNow(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  console.log("Seeding AegisBank database...");

  // Clear existing data in dependency order
  await prisma.notification.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.depositWithdrawRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.bankSettings.deleteMany();

  await prisma.bankSettings.create({
    data: {
      id: "default",
      defaultDailyTransferLimit: 10000,
      defaultMaxSingleTx: 5000,
      defaultMinBalance: 50,
      suspiciousAmountThreshold: 5000,
      transferFeePercent: 0,
    },
  });

  const adminPass = await bcrypt.hash("Admin@123", 10);
  const staffPass = await bcrypt.hash("Staff@123", 10);
  const customerPass = await bcrypt.hash("Customer@123", 10);
  const defaultPin = await bcrypt.hash("1234", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Elena Vance",
      email: "admin@aegisbank.com",
      passwordHash: adminPass,
      phone: "+1 (415) 555-0100",
      address: "100 Montgomery St, San Francisco, CA",
      role: Role.ADMIN,
      kycVerified: true,
      transactionPinHash: defaultPin,
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: "Marcus Chen",
      email: "staff@aegisbank.com",
      passwordHash: staffPass,
      phone: "+1 (415) 555-0142",
      address: "250 Market St, San Francisco, CA",
      role: Role.STAFF,
      kycVerified: true,
      transactionPinHash: defaultPin,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: "Sophia Sterling",
      email: "customer@aegisbank.com",
      passwordHash: customerPass,
      phone: "+1 (415) 555-0199",
      address: "742 Evergreen Terrace, Austin, TX",
      dateOfBirth: "1992-05-14",
      role: Role.CUSTOMER,
      kycVerified: true,
      transactionPinHash: defaultPin,
      twoFactorEnabled: false,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "Liam O'Connor",
      email: "liam@aegisbank.com",
      passwordHash: customerPass,
      phone: "+1 (212) 555-0175",
      address: "88 Pine St, New York, NY",
      dateOfBirth: "1988-11-03",
      role: Role.CUSTOMER,
      kycVerified: true,
      transactionPinHash: defaultPin,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "Aria Patel",
      email: "aria@aegisbank.com",
      passwordHash: customerPass,
      phone: "+1 (312) 555-0164",
      address: "401 N Michigan Ave, Chicago, IL",
      dateOfBirth: "1995-02-22",
      role: Role.CUSTOMER,
      kycVerified: false,
      transactionPinHash: defaultPin,
    },
  });

  // Bank Accounts
  const sophiaSavings = await prisma.bankAccount.create({
    data: {
      accountNumber: "1001000001",
      userId: customer1.id,
      accountType: AccountType.SAVINGS,
      balance: 28450.0,
      dailyTransferLimit: 15000,
      maxSingleTransaction: 5000,
      minBalance: 100,
    },
  });

  const sophiaBusiness = await prisma.bankAccount.create({
    data: {
      accountNumber: "1001000002",
      userId: customer1.id,
      accountType: AccountType.BUSINESS,
      balance: 64200.5,
      dailyTransferLimit: 50000,
      maxSingleTransaction: 20000,
      minBalance: 500,
    },
  });

  const liamCurrent = await prisma.bankAccount.create({
    data: {
      accountNumber: "1001000003",
      userId: customer2.id,
      accountType: AccountType.CURRENT,
      balance: 14800.25,
      dailyTransferLimit: 10000,
      maxSingleTransaction: 5000,
      minBalance: 50,
    },
  });

  const ariaSavings = await prisma.bankAccount.create({
    data: {
      accountNumber: "1001000004",
      userId: customer3.id,
      accountType: AccountType.SAVINGS,
      balance: 5300.0,
      dailyTransferLimit: 10000,
      maxSingleTransaction: 5000,
      minBalance: 50,
    },
  });

  // Historical Transactions across 6 months for realistic charts
  const txSeed = [
    {
      transactionId: "TXN-202606-100001",
      receiverAccountId: sophiaSavings.id,
      type: TransactionType.DEPOSIT,
      amount: 12000,
      description: "Initial Treasury Deposit",
      createdAt: monthsAgo(5, -3),
    },
    {
      transactionId: "TXN-202606-100002",
      senderAccountId: sophiaSavings.id,
      type: TransactionType.WITHDRAWAL,
      amount: 1500,
      description: "ATM & Branch Withdrawal",
      createdAt: monthsAgo(5, 4),
    },
    {
      transactionId: "TXN-202607-100003",
      receiverAccountId: sophiaBusiness.id,
      type: TransactionType.DEPOSIT,
      amount: 24500,
      description: "Q3 Client Retainer Settlement",
      createdAt: monthsAgo(4, -5),
    },
    {
      transactionId: "TXN-202607-100004",
      senderAccountId: sophiaBusiness.id,
      receiverAccountId: liamCurrent.id,
      type: TransactionType.TRANSFER,
      amount: 3200,
      description: "Design & Advisory Invoice #402",
      createdAt: monthsAgo(4, 6),
    },
    {
      transactionId: "TXN-202608-100005",
      receiverAccountId: liamCurrent.id,
      type: TransactionType.DEPOSIT,
      amount: 8500,
      description: "Payroll Direct Deposit",
      createdAt: monthsAgo(3, -2),
    },
    {
      transactionId: "TXN-202608-100006",
      senderAccountId: sophiaSavings.id,
      type: TransactionType.WITHDRAWAL,
      amount: 2100,
      description: "Equipment Purchase Settlement",
      createdAt: monthsAgo(3, 5),
    },
    {
      transactionId: "TXN-202609-100007",
      receiverAccountId: sophiaSavings.id,
      type: TransactionType.DEPOSIT,
      amount: 9800,
      description: "Dividend & Interest Credit",
      createdAt: monthsAgo(2, -4),
    },
    {
      transactionId: "TXN-202609-100008",
      senderAccountId: sophiaBusiness.id,
      receiverAccountId: ariaSavings.id,
      type: TransactionType.TRANSFER,
      amount: 1850,
      description: "Contractor Milestone Payout",
      createdAt: monthsAgo(2, 3),
    },
    {
      transactionId: "TXN-202610-100009",
      receiverAccountId: sophiaBusiness.id,
      type: TransactionType.DEPOSIT,
      amount: 18000,
      description: "Enterprise SaaS Settlement",
      createdAt: monthsAgo(1, -6),
    },
    {
      transactionId: "TXN-202610-100010",
      senderAccountId: liamCurrent.id,
      type: TransactionType.WITHDRAWAL,
      amount: 1200,
      description: "Travel & Lodging Expense",
      createdAt: monthsAgo(1, 2),
    },
    {
      transactionId: "TXN-202611-100011",
      senderAccountId: sophiaSavings.id,
      receiverAccountId: liamCurrent.id,
      type: TransactionType.TRANSFER,
      amount: 6400,
      description: "High-Value Venture Allocation",
      isFlagged: true,
      flagReason: "Amount exceeds $5,000 automated monitoring threshold",
      createdAt: monthsAgo(0, -2),
    },
    {
      transactionId: "TXN-202611-100012",
      receiverAccountId: ariaSavings.id,
      type: TransactionType.DEPOSIT,
      amount: 4200,
      description: "Consulting Fee Deposit",
      createdAt: monthsAgo(0, -1),
    },
  ];

  for (const tx of txSeed) {
    await prisma.transaction.create({
      data: {
        transactionId: tx.transactionId,
        senderAccountId: tx.senderAccountId ?? null,
        receiverAccountId: tx.receiverAccountId ?? null,
        type: tx.type,
        amount: tx.amount,
        fee: 0,
        status: TransactionStatus.COMPLETED,
        description: tx.description,
        isFlagged: tx.isFlagged ?? false,
        flagReason: tx.flagReason ?? null,
        createdAt: tx.createdAt,
      },
    });
  }

  // Deposit & Withdrawal Requests
  await prisma.depositWithdrawRequest.createMany({
    data: [
      {
        userId: customer1.id,
        accountId: sophiaSavings.id,
        type: TransactionType.DEPOSIT,
        amount: 3500,
        description: "Wire check deposit from brokerage",
        status: RequestStatus.PENDING,
      },
      {
        userId: customer2.id,
        accountId: liamCurrent.id,
        type: TransactionType.WITHDRAWAL,
        amount: 950,
        description: "Branch cash withdrawal request",
        status: RequestStatus.PENDING,
      },
      {
        userId: customer1.id,
        accountId: sophiaBusiness.id,
        type: TransactionType.DEPOSIT,
        amount: 18000,
        description: "Enterprise SaaS Settlement",
        status: RequestStatus.APPROVED,
        reviewedById: staff.id,
        reviewNote: "Verified wire confirmation",
      },
    ],
  });

  // Active Loan with Repayment Schedule for Sophia
  const activeLoan = await prisma.loanApplication.create({
    data: {
      userId: customer1.id,
      accountId: sophiaBusiness.id,
      loanType: LoanType.BUSINESS,
      requestedAmount: 12000,
      approvedAmount: 12000,
      interestRate: 8.5,
      durationMonths: 12,
      monthlyIncome: 14500,
      employmentStatus: EmploymentStatus.BUSINESS_OWNER,
      description: "Working capital expansion for Q4 operations",
      status: LoanStatus.ACTIVE,
      staffNotes: "Strong cashflow and verified business account history.",
      forwardedById: staff.id,
      reviewedById: admin.id,
      remainingBalance: 10000,
      disbursedAt: monthsAgo(2),
    },
  });

  await prisma.transaction.create({
    data: {
      transactionId: "TXN-LOAN-DISB-001",
      receiverAccountId: sophiaBusiness.id,
      type: TransactionType.LOAN_DISBURSEMENT,
      amount: 12000,
      fee: 0,
      status: TransactionStatus.COMPLETED,
      description: `Loan Disbursement (${activeLoan.id.slice(0, 8)})`,
      createdAt: monthsAgo(2),
    },
  });

  // Create 12 monthly installments (2 paid, 10 upcoming)
  const monthlyPrincipal = 1000;
  const monthlyInterest = 85;
  for (let i = 1; i <= 12; i++) {
    const isPaid = i <= 2;
    await prisma.loanRepayment.create({
      data: {
        loanId: activeLoan.id,
        installmentNumber: i,
        amount: monthlyPrincipal + monthlyInterest,
        principalAmount: monthlyPrincipal,
        interestAmount: monthlyInterest,
        dueDate: i <= 2 ? monthsAgo(2 - i) : monthsFromNow(i - 2),
        paidAt: isPaid ? monthsAgo(2 - i) : null,
        status: isPaid ? RepaymentStatus.PAID : RepaymentStatus.UPCOMING,
        transactionId: isPaid ? `TXN-LOAN-REP-00${i}` : null,
      },
    });
  }

  // Pending & Under Review Loan Applications
  await prisma.loanApplication.create({
    data: {
      userId: customer2.id,
      accountId: liamCurrent.id,
      loanType: LoanType.PERSONAL,
      requestedAmount: 15000,
      interestRate: 9.2,
      durationMonths: 24,
      monthlyIncome: 7800,
      employmentStatus: EmploymentStatus.EMPLOYED,
      description: "Home office renovation and solar backup installation",
      status: LoanStatus.UNDER_REVIEW,
      staffNotes: "Income verified; forwarding to Admin for final credit approval.",
      forwardedById: staff.id,
    },
  });

  await prisma.loanApplication.create({
    data: {
      userId: customer3.id,
      accountId: ariaSavings.id,
      loanType: LoanType.EDUCATION,
      requestedAmount: 8000,
      interestRate: 6.5,
      durationMonths: 18,
      monthlyIncome: 4200,
      employmentStatus: EmploymentStatus.EMPLOYED,
      description: "Executive MBA tuition installment",
      status: LoanStatus.PENDING,
    },
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        title: "Loan Disbursed",
        message: "Your $12,000.00 Business Loan has been disbursed to account 1001000002.",
        type: NotificationType.SUCCESS,
      },
      {
        userId: customer1.id,
        title: "Deposit Request Pending",
        message: "Your $3,500.00 deposit request is awaiting staff verification.",
        type: NotificationType.INFO,
      },
      {
        userId: customer2.id,
        title: "Funds Received",
        message: "You received $6,400.00 in account 1001000003.",
        type: NotificationType.SUCCESS,
      },
      {
        userId: admin.id,
        title: "Suspicious Transaction Flagged",
        message: "TXN-202611-100011 ($6,400.00) exceeded the $5,000 monitoring threshold.",
        type: NotificationType.WARNING,
      },
    ],
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
