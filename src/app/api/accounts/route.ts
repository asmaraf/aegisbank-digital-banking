import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccountSchema } from "@/lib/validations";
import { generateAccountNumber, generateTransactionId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { role, id: userId } = session.user;
  const search = req.nextUrl.searchParams.get("search")?.trim() || "";

  const where =
    role === "CUSTOMER"
      ? { userId }
      : search
        ? {
            OR: [
              { accountNumber: { contains: search, mode: "insensitive" as const } },
              { user: { name: { contains: search, mode: "insensitive" as const } } },
              { user: { email: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {};

  const accounts = await prisma.bankAccount.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, status: true, kycVerified: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      ...a,
      balance: Number(a.balance),
      dailyTransferLimit: Number(a.dailyTransferLimit),
      maxSingleTransaction: Number(a.maxSingleTransaction),
      minBalance: Number(a.minBalance),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "STAFF"]);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid account data" },
        { status: 400 }
      );
    }

    const {
      userId,
      accountType,
      initialDeposit,
      dailyTransferLimit,
      maxSingleTransaction,
      minBalance,
    } = parsed.data;

    const customer = await prisma.user.findUnique({ where: { id: userId } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const accountNumber = generateAccountNumber();

    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.bankAccount.create({
        data: {
          accountNumber,
          userId,
          accountType,
          balance: initialDeposit,
          dailyTransferLimit,
          maxSingleTransaction,
          minBalance,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (initialDeposit > 0) {
        await tx.transaction.create({
          data: {
            transactionId: generateTransactionId(),
            receiverAccountId: created.id,
            type: "DEPOSIT",
            amount: initialDeposit,
            fee: 0,
            status: "COMPLETED",
            description: "Opening Account Deposit",
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          title: "New Bank Account Opened",
          message: `Your new ${accountType} account (${accountNumber}) is now active.`,
          type: "SUCCESS",
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        account: {
          ...account,
          balance: Number(account.balance),
          dailyTransferLimit: Number(account.dailyTransferLimit),
          maxSingleTransaction: Number(account.maxSingleTransaction),
          minBalance: Number(account.minBalance),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create account error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
