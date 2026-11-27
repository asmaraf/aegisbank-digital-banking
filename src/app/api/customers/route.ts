import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerCustomerSchema } from "@/lib/validations";
import { generateAccountNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "STAFF"]);
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search")?.trim() || "";

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      dateOfBirth: true,
      status: true,
      kycVerified: true,
      createdAt: true,
      accounts: {
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          balance: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    customers: customers.map((c) => ({
      ...c,
      totalBalance: c.accounts.reduce((sum, a) => sum + Number(a.balance), 0),
      accounts: c.accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "STAFF"]);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = registerCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid customer details" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address, dateOfBirth, accountType, transactionPin } =
      parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const transactionPinHash = await bcrypt.hash(transactionPin, 10);

    const customer = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          phone,
          address,
          dateOfBirth: dateOfBirth || null,
          role: "CUSTOMER",
          status: "ACTIVE",
          kycVerified: true,
          transactionPinHash,
        },
      });

      const accountNumber = generateAccountNumber();
      await tx.bankAccount.create({
        data: {
          accountNumber,
          userId: created.id,
          accountType,
          balance: 0,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          status: customer.status,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create customer error:", err);
    return NextResponse.json({ error: "Failed to register customer" }, { status: 500 });
  }
}
