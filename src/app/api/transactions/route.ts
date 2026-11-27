import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { role, id: userId } = session.user;
  const sp = req.nextUrl.searchParams;

  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") || 10)));
  const search = sp.get("search")?.trim() || "";
  const type = sp.get("type") as TransactionType | null;
  const status = sp.get("status") as TransactionStatus | null;
  const accountId = sp.get("accountId") || "";
  const startDate = sp.get("startDate");
  const endDate = sp.get("endDate");
  const flaggedOnly = sp.get("flaggedOnly") === "true";

  const where: Prisma.TransactionWhereInput = {};

  if (role === "CUSTOMER") {
    const ownAccounts = await prisma.bankAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownIds = ownAccounts.map((a) => a.id);

    if (accountId && ownIds.includes(accountId)) {
      where.OR = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
    } else {
      where.OR = [
        { senderAccountId: { in: ownIds } },
        { receiverAccountId: { in: ownIds } },
      ];
    }
  } else if (accountId) {
    where.OR = [{ senderAccountId: accountId }, { receiverAccountId: accountId }];
  }

  if (search) {
    where.AND = [
      {
        OR: [
          { transactionId: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (type) where.type = type;
  if (status) where.status = status;
  if (flaggedOnly && role !== "CUSTOMER") where.isFlagged = true;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        senderAccount: {
          select: {
            id: true,
            accountNumber: true,
            user: { select: { name: true, email: true } },
          },
        },
        receiverAccount: {
          select: {
            id: true,
            accountNumber: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee),
      senderAccountNumber: t.senderAccount?.accountNumber ?? null,
      receiverAccountNumber: t.receiverAccount?.accountNumber ?? null,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
