import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loanApplicationSchema } from "@/lib/validations";

const INTEREST_RATES: Record<string, number> = {
  PERSONAL: 9.5,
  HOME: 6.25,
  AUTO: 7.5,
  BUSINESS: 8.5,
  EDUCATION: 5.5,
};

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { role, id: userId } = session.user;

  const loans = await prisma.loanApplication.findMany({
    where: role === "CUSTOMER" ? { userId } : {},
    include: {
      user: { select: { id: true, name: true, email: true, kycVerified: true } },
      account: { select: { id: true, accountNumber: true, accountType: true } },
      repayments: { orderBy: { installmentNumber: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    loans: loans.map((l) => ({
      ...l,
      requestedAmount: Number(l.requestedAmount),
      approvedAmount: l.approvedAmount ? Number(l.approvedAmount) : null,
      monthlyIncome: Number(l.monthlyIncome),
      remainingBalance: Number(l.remainingBalance),
      repayments: l.repayments.map((r) => ({
        ...r,
        amount: Number(r.amount),
        principalAmount: Number(r.principalAmount),
        interestAmount: Number(r.interestAmount),
      })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["CUSTOMER"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const parsed = loanApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid loan application" },
        { status: 400 }
      );
    }

    const {
      accountId,
      loanType,
      requestedAmount,
      durationMonths,
      monthlyIncome,
      employmentStatus,
      description,
    } = parsed.data;

    const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Disbursement account not found" }, { status: 404 });
    }
    if (account.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Selected account must be ACTIVE" },
        { status: 400 }
      );
    }

    const loan = await prisma.loanApplication.create({
      data: {
        userId: session.user.id,
        accountId,
        loanType,
        requestedAmount,
        interestRate: INTEREST_RATES[loanType] ?? 8.5,
        durationMonths,
        monthlyIncome,
        employmentStatus,
        description,
        status: "PENDING",
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Loan Application Submitted",
        message: `Your ${loanType} loan application for $${requestedAmount.toFixed(
          2
        )} is now under review.`,
        type: "INFO",
      },
    });

    return NextResponse.json(
      {
        loan: {
          ...loan,
          requestedAmount: Number(loan.requestedAmount),
          monthlyIncome: Number(loan.monthlyIncome),
          remainingBalance: Number(loan.remainingBalance),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Loan application error:", err);
    return NextResponse.json({ error: "Failed to submit loan application" }, { status: 500 });
  }
}
