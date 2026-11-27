import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createStaffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(7, "Phone number is required"),
  address: z.string().min(4, "Office or residential address is required"),
});

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid staff details" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultPinHash = await bcrypt.hash("1234", 10);

    const created = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone,
        address,
        role: "STAFF",
        status: "ACTIVE",
        kycVerified: true,
        transactionPinHash: defaultPinHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff: created }, { status: 201 });
  } catch (err) {
    console.error("Create staff error:", err);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { id, status } = body as { id?: string; status?: "ACTIVE" | "INACTIVE" | "BLOCKED" };
    if (!id || !status || !["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id, role: "STAFF" },
      data: { status },
      select: { id: true, name: true, email: true, status: true },
    });

    return NextResponse.json({ staff: updated });
  } catch (err) {
    console.error("Update staff error:", err);
    return NextResponse.json({ error: "Failed to update staff status" }, { status: 500 });
  }
}
