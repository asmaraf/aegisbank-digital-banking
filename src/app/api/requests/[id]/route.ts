import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTransactionId } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth(["ADMIN", "STAFF"], true);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { decision, reviewNote } = body as {
      decision: "APPROVED" | "REJECTED";
      reviewNote?: string;
    };

    if (!["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const existing = await prisma.depositWithdrawRequest.findUnique({
      where: { id: params.id },
      include: { account: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (existing.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot approve or reject your own request" },
        { status: 403 }
      );
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request already ${existing.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (decision === "APPROVED") {
        if (existing.account.status !== "ACTIVE") {
          throw new Error(`BAD_REQUEST:Target account is ${existing.account.status}`);
        }

        const reqAmount = Number(existing.amount);
        if (existing.type === "WITHDRAWAL") {
          const available =
            Number(existing.account.balance) - Number(existing.account.minBalance);
          if (reqAmount > available) {
            throw new Error("BAD_REQUEST:Insufficient funds in customer account");
          }
          await tx.bankAccount.update({
            where: { id: existing.accountId },
            data: { balance: { decrement: existing.amount } },
          });
        } else {
          await tx.bankAccount.update({
            where: { id: existing.accountId },
            data: { balance: { increment: existing.amount } },
          });
        }

        await tx.transaction.create({
          data: {
            transactionId: generateTransactionId(),
            senderAccountId: existing.type === "WITHDRAWAL" ? existing.accountId : null,
            receiverAccountId: existing.type === "DEPOSIT" ? existing.accountId : null,
            type: existing.type,
            amount: existing.amount,
            fee: 0,
            status: "COMPLETED",
            description: existing.description,
            reviewedById: session.user.id,
          },
        });
      }

      const updatedReq = await tx.depositWithdrawRequest.update({
        where: { id: params.id },
        data: {
          status: decision,
          reviewedById: session.user.id,
          reviewNote: reviewNote || null,
        },
      });

      await tx.notification.create({
        data: {
          userId: existing.userId,
          title: `${existing.type === "DEPOSIT" ? "Deposit" : "Withdrawal"} ${
            decision === "APPROVED" ? "Approved" : "Rejected"
          }`,
          message: `Your ${existing.type.toLowerCase()} request of $${Number(
            existing.amount
          ).toFixed(2)} was ${decision.toLowerCase()}.${
            reviewNote ? ` Note: ${reviewNote}` : ""
          }`,
          type: decision === "APPROVED" ? "SUCCESS" : "ERROR",
        },
      });

      return updatedReq;
    });

    return NextResponse.json({
      request: { ...updated, amount: Number(updated.amount) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to process request";
    if (msg.startsWith("BAD_REQUEST:")) {
      return NextResponse.json({ error: msg.replace("BAD_REQUEST:", "") }, { status: 400 });
    }
    console.error("Process request error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
