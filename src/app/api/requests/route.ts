import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { depositWithdrawSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { role, id: userId } = session.user;
  const status = req.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (role === "CUSTOMER") where.userId = userId;
  if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    where.status = status;
  }

  const requests = await prisma.depositWithdrawRequest.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      account: { select: { id: true, accountNumber: true, accountType: true, balance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      amount: Number(r.amount),
      account: { ...r.account, balance: Number(r.account.balance) },
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["CUSTOMER"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const parsed = depositWithdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { accountId, type, amount, description } = parsed.data;

    const account = await prisma.bankAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (account.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Cannot submit request: account is ${account.status}` },
        { status: 400 }
      );
    }

    if (type === "WITHDRAWAL") {
      const available = Number(account.balance) - Number(account.minBalance);
      if (amount > available) {
        return NextResponse.json(
          { error: `Insufficient balance for withdrawal (available: $${available.toFixed(2)})` },
          { status: 400 }
        );
      }
    }

    const created = await prisma.depositWithdrawRequest.create({
      data: {
        userId: session.user.id,
        accountId,
        type,
        amount,
        description,
        status: "PENDING",
      },
      include: {
        account: { select: { accountNumber: true, accountType: true } },
      },
    });

    return NextResponse.json(
      { request: { ...created, amount: Number(created.amount) } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create deposit/withdraw request error:", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
