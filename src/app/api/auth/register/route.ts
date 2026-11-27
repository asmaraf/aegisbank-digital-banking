import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerCustomerSchema } from "@/lib/validations";
import { generateAccountNumber } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address, dateOfBirth, accountType, transactionPin } =
      parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const transactionPinHash = await bcrypt.hash(transactionPin, 10);

    const settings = await prisma.bankSettings.findUnique({
      where: { id: "default" },
    });

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          phone,
          address,
          dateOfBirth: dateOfBirth || null,
          role: "CUSTOMER",
          status: "ACTIVE",
          kycVerified: false,
          transactionPinHash,
        },
      });

      const accountNumber = generateAccountNumber();
      await tx.bankAccount.create({
        data: {
          accountNumber,
          userId: createdUser.id,
          accountType,
          balance: 0,
          dailyTransferLimit: settings?.defaultDailyTransferLimit ?? 10000,
          maxSingleTransaction: settings?.defaultMaxSingleTx ?? 5000,
          minBalance: settings?.defaultMinBalance ?? 0,
        },
      });

      await tx.notification.create({
        data: {
          userId: createdUser.id,
          title: "Welcome to AegisBank",
          message: `Your ${accountType} account (${accountNumber}) has been created.`,
          type: "SUCCESS",
        },
      });

      return createdUser;
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
