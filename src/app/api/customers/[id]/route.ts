import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(["ADMIN", "STAFF"]);
  if (error) return error;

  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      dateOfBirth: true,
      role: true,
      status: true,
      kycVerified: true,
      createdAt: true,
      accounts: true,
      loanApplications: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const accountIds = customer.accounts.map((a) => a.id);
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { senderAccountId: { in: accountIds } },
        { receiverAccountId: { in: accountIds } },
      ],
    },
    include: {
      senderAccount: { select: { accountNumber: true } },
      receiverAccount: { select: { accountNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    customer: {
      ...customer,
      accounts: customer.accounts.map((a) => ({
        ...a,
        balance: Number(a.balance),
        dailyTransferLimit: Number(a.dailyTransferLimit),
        maxSingleTransaction: Number(a.maxSingleTransaction),
        minBalance: Number(a.minBalance),
      })),
      loanApplications: customer.loanApplications.map((l) => ({
        ...l,
        requestedAmount: Number(l.requestedAmount),
        approvedAmount: l.approvedAmount ? Number(l.approvedAmount) : null,
        remainingBalance: Number(l.remainingBalance),
      })),
    },
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee),
      senderAccountNumber: t.senderAccount?.accountNumber ?? null,
      receiverAccountNumber: t.receiverAccount?.accountNumber ?? null,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth(["ADMIN", "STAFF"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { status, kycVerified } = body as {
      status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
      kycVerified?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admins can activate, deactivate, or block accounts" },
          { status: 403 }
        );
      }
      if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (kycVerified !== undefined) {
      updateData.kycVerified = Boolean(kycVerified);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        kycVerified: true,
      },
    });

    return NextResponse.json({ customer: updated });
  } catch (err) {
    console.error("Update customer error:", err);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}
