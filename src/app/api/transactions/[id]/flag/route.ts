import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth(["ADMIN", "STAFF"]);
  if (error || !session) return error;

  try {
    const body = await req.json();
    const { action, flagReason } = body as {
      action: "FLAG" | "CLEAR" | "REVERSE";
      flagReason?: string;
    };

    const txRecord = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!txRecord) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (action === "FLAG") {
      const updated = await prisma.transaction.update({
        where: { id: params.id },
        data: {
          isFlagged: true,
          flagReason: flagReason || "Flagged by bank staff for admin review",
          reviewedById: session.user.id,
        },
      });
      return NextResponse.json({ transaction: { ...updated, amount: Number(updated.amount), fee: Number(updated.fee) } });
    }

    // Only Admin can CLEAR or REVERSE
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admins can clear flags or reverse transactions" },
        { status: 403 }
      );
    }

    if (action === "CLEAR") {
      const updated = await prisma.transaction.update({
        where: { id: params.id },
        data: {
          isFlagged: false,
          flagReason: null,
          reviewedById: session.user.id,
        },
      });
      return NextResponse.json({ transaction: { ...updated, amount: Number(updated.amount), fee: Number(updated.fee) } });
    }

    if (action === "REVERSE") {
      if (txRecord.status === "REVERSED") {
        return NextResponse.json({ error: "Transaction already reversed" }, { status: 400 });
      }
      if (txRecord.type !== "TRANSFER") {
        return NextResponse.json({ error: "Only transfers can be reversed" }, { status: 400 });
      }

      const reversed = await prisma.$transaction(async (tx) => {
        if (txRecord.receiverAccountId) {
          await tx.bankAccount.update({
            where: { id: txRecord.receiverAccountId },
            data: { balance: { decrement: txRecord.amount } },
          });
        }
        if (txRecord.senderAccountId) {
          await tx.bankAccount.update({
            where: { id: txRecord.senderAccountId },
            data: { balance: { increment: txRecord.amount } },
          });
        }
        return tx.transaction.update({
          where: { id: params.id },
          data: {
            status: "REVERSED",
            isFlagged: false,
            reviewedById: session.user.id,
          },
        });
      });

      return NextResponse.json({
        transaction: { ...reversed, amount: Number(reversed.amount), fee: Number(reversed.fee) },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Flag transaction error:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
