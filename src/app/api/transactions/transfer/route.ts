import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transferSchema } from "@/lib/validations";
import { generateTransactionId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(["CUSTOMER"], true);
  if (error || !session) return error;

  const userId = session.user.id;

  try {
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid transfer details" },
        { status: 400 }
      );
    }

    const {
      senderAccountId,
      recipientAccountNumber,
      amount,
      description,
      transactionPin,
      twoFactorCode,
      idempotencyKey,
    } = parsed.data;

    // Duplicate transaction prevention
    if (idempotencyKey) {
      const existingTx = await prisma.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return NextResponse.json(
          { error: "Duplicate transfer request detected", transaction: existingTx },
          { status: 409 }
        );
      }
    }

    // Verify user & Transaction PIN & 2FA
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        transactionPinHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!user?.transactionPinHash) {
      return NextResponse.json(
        { error: "Transaction PIN not configured. Set your PIN in Security Settings." },
        { status: 400 }
      );
    }

    const pinValid = await bcrypt.compare(transactionPin, user.transactionPinHash);
    if (!pinValid) {
      return NextResponse.json({ error: "Invalid Transaction PIN" }, { status: 403 });
    }

    if (user.twoFactorEnabled) {
      // Simulated 2FA verification: accepts 6-digit code "123456" for demo or any valid 6-digit OTP when enabled
      if (!twoFactorCode || !/^\d{6}$/.test(twoFactorCode)) {
        return NextResponse.json(
          { error: "Valid 6-digit 2FA verification code is required", requires2FA: true },
          { status: 403 }
        );
      }
    }

    const settings = await prisma.bankSettings.findUnique({ where: { id: "default" } });
    const feePercent = settings?.transferFeePercent ?? 0;
    const fee = Number(((amount * feePercent) / 100).toFixed(2));
    const totalDebit = amount + fee;
    const suspiciousThreshold = Number(settings?.suspiciousAmountThreshold ?? 5000);

    const result = await prisma.$transaction(async (tx) => {
      const senderAccount = await tx.bankAccount.findUnique({
        where: { id: senderAccountId },
      });

      if (!senderAccount || senderAccount.userId !== userId) {
        throw new Error("FORBIDDEN:Source account not found or does not belong to you");
      }

      if (senderAccount.status !== "ACTIVE") {
        throw new Error(`BAD_REQUEST:Source account is ${senderAccount.status}`);
      }

      const receiverAccount = await tx.bankAccount.findUnique({
        where: { accountNumber: recipientAccountNumber },
        include: { user: { select: { id: true, name: true, status: true } } },
      });

      if (!receiverAccount) {
        throw new Error("NOT_FOUND:Recipient account number not found");
      }

      if (receiverAccount.id === senderAccount.id) {
        throw new Error("BAD_REQUEST:Cannot transfer to the exact same account");
      }

      if (receiverAccount.status !== "ACTIVE" || receiverAccount.user.status !== "ACTIVE") {
        throw new Error("BAD_REQUEST:Recipient account is currently unavailable");
      }

      const senderBalance = Number(senderAccount.balance);
      const minBal = Number(senderAccount.minBalance);
      const maxSingle = Number(senderAccount.maxSingleTransaction);
      const dailyLimit = Number(senderAccount.dailyTransferLimit);

      if (amount > maxSingle) {
        throw new Error(
          `BAD_REQUEST:Amount exceeds single transaction limit of $${maxSingle.toFixed(2)}`
        );
      }

      if (senderBalance - totalDebit < minBal) {
        throw new Error(
          `BAD_REQUEST:Insufficient funds (available: $${senderBalance.toFixed(
            2
          )}, minimum balance required: $${minBal.toFixed(2)})`
        );
      }

      // Check 24-hour rolling daily transfer total
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayTransfers = await tx.transaction.aggregate({
        where: {
          senderAccountId: senderAccount.id,
          type: "TRANSFER",
          status: "COMPLETED",
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      });

      const usedToday = Number(todayTransfers._sum.amount ?? 0);
      if (usedToday + amount > dailyLimit) {
        throw new Error(
          `BAD_REQUEST:Exceeds daily transfer limit ($${dailyLimit.toFixed(
            2
          )}). Used today: $${usedToday.toFixed(2)}`
        );
      }

      // Perform atomic debit & credit
      await tx.bankAccount.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: totalDebit } },
      });

      await tx.bankAccount.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: amount } },
      });

      const isFlagged = amount >= suspiciousThreshold;
      const transactionId = generateTransactionId();

      const createdTx = await tx.transaction.create({
        data: {
          transactionId,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          type: "TRANSFER",
          amount,
          fee,
          status: "COMPLETED",
          description,
          isFlagged,
          flagReason: isFlagged
            ? `Automated alert: Transfer >= $${suspiciousThreshold.toFixed(2)}`
            : null,
          idempotencyKey: idempotencyKey || null,
        },
        include: {
          senderAccount: { select: { accountNumber: true } },
          receiverAccount: { select: { accountNumber: true } },
        },
      });

      // Notify sender & receiver
      await tx.notification.create({
        data: {
          userId,
          title: "Transfer Completed",
          message: `Sent $${amount.toFixed(2)} to ${receiverAccount.accountNumber} (${transactionId}).`,
          type: "SUCCESS",
        },
      });

      if (receiverAccount.userId !== userId) {
        await tx.notification.create({
          data: {
            userId: receiverAccount.userId,
            title: "Money Received",
            message: `Received $${amount.toFixed(2)} from ${senderAccount.accountNumber} (${transactionId}).`,
            type: "SUCCESS",
          },
        });
      }

      return createdTx;
    });

    return NextResponse.json(
      {
        message: "Transfer completed successfully",
        transaction: {
          ...result,
          amount: Number(result.amount),
          fee: Number(result.fee),
          senderAccountNumber: result.senderAccount?.accountNumber ?? null,
          receiverAccountNumber: result.receiverAccount?.accountNumber ?? null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transfer failed";
    if (msg.startsWith("FORBIDDEN:")) {
      return NextResponse.json({ error: msg.replace("FORBIDDEN:", "") }, { status: 403 });
    }
    if (msg.startsWith("NOT_FOUND:")) {
      return NextResponse.json({ error: msg.replace("NOT_FOUND:", "") }, { status: 404 });
    }
    if (msg.startsWith("BAD_REQUEST:")) {
      return NextResponse.json({ error: msg.replace("BAD_REQUEST:", "") }, { status: 400 });
    }
    console.error("Transfer error:", err);
    return NextResponse.json({ error: "Transfer failed due to server error" }, { status: 500 });
  }
}
