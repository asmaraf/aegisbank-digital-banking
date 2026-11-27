import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bankSettingsSchema, updatePinSchema } from "@/lib/validations";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      kycVerified: true,
      twoFactorEnabled: true,
      transactionPinHash: true,
    },
  });

  let bankSettings = null;
  if (session.user.role === "ADMIN") {
    const s = await prisma.bankSettings.findUnique({ where: { id: "default" } });
    if (s) {
      bankSettings = {
        defaultDailyTransferLimit: Number(s.defaultDailyTransferLimit),
        defaultMaxSingleTx: Number(s.defaultMaxSingleTx),
        defaultMinBalance: Number(s.defaultMinBalance),
        suspiciousAmountThreshold: Number(s.suspiciousAmountThreshold),
        transferFeePercent: s.transferFeePercent,
      };
    }
  }

  return NextResponse.json({
    profile: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          kycVerified: user.kycVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          hasPin: Boolean(user.transactionPinHash),
        }
      : null,
    bankSettings,
  });
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  try {
    const body = await req.json();

    // Update Bank-wide settings (Admin only)
    if (body.scope === "bank") {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only Admins can modify bank-wide settings" },
          { status: 403 }
        );
      }
      const parsed = bankSettingsSchema.safeParse(body.settings);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || "Invalid settings" },
          { status: 400 }
        );
      }

      const updated = await prisma.bankSettings.upsert({
        where: { id: "default" },
        update: parsed.data,
        create: { id: "default", ...parsed.data },
      });

      return NextResponse.json({
        bankSettings: {
          defaultDailyTransferLimit: Number(updated.defaultDailyTransferLimit),
          defaultMaxSingleTx: Number(updated.defaultMaxSingleTx),
          defaultMinBalance: Number(updated.defaultMinBalance),
          suspiciousAmountThreshold: Number(updated.suspiciousAmountThreshold),
          transferFeePercent: updated.transferFeePercent,
        },
      });
    }

    // Toggle 2FA for current user
    if (body.scope === "twoFactor") {
      const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorEnabled: Boolean(body.enabled) },
        select: { twoFactorEnabled: true },
      });
      return NextResponse.json({ twoFactorEnabled: updated.twoFactorEnabled });
    }

    // Update Transaction PIN for current user
    if (body.scope === "pin") {
      const parsed = updatePinSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || "Invalid PIN payload" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const validPassword = await bcrypt.compare(
        parsed.data.currentPassword,
        user.passwordHash
      );
      if (!validPassword) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 403 });
      }

      const newHash = await bcrypt.hash(parsed.data.newPin, 10);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { transactionPinHash: newHash },
      });

      return NextResponse.json({ message: "Transaction PIN updated successfully" });
    }

    return NextResponse.json({ error: "Invalid settings scope" }, { status: 400 });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
