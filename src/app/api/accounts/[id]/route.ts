import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const existing = await prisma.bankAccount.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status && ["ACTIVE", "FROZEN", "CLOSED"].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.accountType && ["SAVINGS", "CURRENT", "BUSINESS"].includes(body.accountType)) {
      updateData.accountType = body.accountType;
    }
    if (body.dailyTransferLimit !== undefined) {
      updateData.dailyTransferLimit = Number(body.dailyTransferLimit);
    }
    if (body.maxSingleTransaction !== undefined) {
      updateData.maxSingleTransaction = Number(body.maxSingleTransaction);
    }
    if (body.minBalance !== undefined) {
      updateData.minBalance = Number(body.minBalance);
    }

    const updated = await prisma.bankAccount.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (body.status && body.status !== existing.status) {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title: `Account ${body.status === "FROZEN" ? "Frozen" : "Status Updated"}`,
          message: `Account ${existing.accountNumber} status changed to ${body.status}.`,
          type: body.status === "FROZEN" ? "WARNING" : "INFO",
        },
      });
    }

    return NextResponse.json({
      account: {
        ...updated,
        balance: Number(updated.balance),
        dailyTransferLimit: Number(updated.dailyTransferLimit),
        maxSingleTransaction: Number(updated.maxSingleTransaction),
        minBalance: Number(updated.minBalance),
      },
    });
  } catch (err) {
    console.error("Update account error:", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
