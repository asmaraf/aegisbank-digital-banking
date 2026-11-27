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
    const { action, staffNotes } = body as {
      action: "FORWARD" | "APPROVE" | "REJECT";
      staffNotes?: string;
    };

    const loan = await prisma.loanApplication.findUnique({
      where: { id: params.id },
      include: { account: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan application not found" }, { status: 404 });
    }

    if (loan.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review or approve your own loan application" },
        { status: 403 }
      );
    }

    // Staff can only FORWARD with internal notes
    if (action === "FORWARD") {
      const updated = await prisma.loanApplication.update({
        where: { id: params.id },
        data: {
          status: "UNDER_REVIEW",
          staffNotes: staffNotes ?? loan.staffNotes,
          forwardedById: session.user.id,
        },
      });
      return NextResponse.json({ loan: { ...updated, requestedAmount: Number(updated.requestedAmount) } });
    }

    // Only Admin can APPROVE or REJECT
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admins can approve or reject loan applications" },
        { status: 403 }
      );
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(loan.status)) {
      return NextResponse.json(
        { error: `Loan is already ${loan.status}` },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const rejected = await prisma.$transaction(async (tx) => {
        const updated = await tx.loanApplication.update({
          where: { id: params.id },
          data: {
            status: "REJECTED",
            staffNotes: staffNotes ?? loan.staffNotes,
            reviewedById: session.user.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: loan.userId,
            title: "Loan Application Rejected",
            message: `Your ${loan.loanType} loan application for $${Number(
              loan.requestedAmount
            ).toFixed(2)} was declined.${staffNotes ? ` Note: ${staffNotes}` : ""}`,
            type: "ERROR",
          },
        });

        return updated;
      });

      return NextResponse.json({
        loan: { ...rejected, requestedAmount: Number(rejected.requestedAmount) },
      });
    }

    if (action === "APPROVE") {
      const principal = Number(loan.requestedAmount);
      const totalInterest = Number(
        ((principal * loan.interestRate * (loan.durationMonths / 12)) / 100).toFixed(2)
      );
      const totalPayable = Number((principal + totalInterest).toFixed(2));
      const monthlyPrincipal = Number((principal / loan.durationMonths).toFixed(2));
      const monthlyInterest = Number((totalInterest / loan.durationMonths).toFixed(2));

      const approved = await prisma.$transaction(async (tx) => {
        if (loan.account.status !== "ACTIVE") {
          throw new Error("BAD_REQUEST:Disbursement account is not active");
        }

        // Disburse funds to customer account
        await tx.bankAccount.update({
          where: { id: loan.accountId },
          data: { balance: { increment: principal } },
        });

        // Record banking transaction
        await tx.transaction.create({
          data: {
            transactionId: generateTransactionId(),
            receiverAccountId: loan.accountId,
            type: "LOAN_DISBURSEMENT",
            amount: principal,
            fee: 0,
            status: "COMPLETED",
            description: `${loan.loanType} Loan Disbursement`,
            reviewedById: session.user.id,
          },
        });

        // Update loan to ACTIVE
        const updatedLoan = await tx.loanApplication.update({
          where: { id: params.id },
          data: {
            status: "ACTIVE",
            approvedAmount: principal,
            remainingBalance: totalPayable,
            disbursedAt: new Date(),
            reviewedById: session.user.id,
            staffNotes: staffNotes ?? loan.staffNotes,
          },
        });

        // Generate monthly repayment schedule
        const repaymentsData = [];
        for (let i = 1; i <= loan.durationMonths; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          repaymentsData.push({
            loanId: loan.id,
            installmentNumber: i,
            amount: Number((monthlyPrincipal + monthlyInterest).toFixed(2)),
            principalAmount: monthlyPrincipal,
            interestAmount: monthlyInterest,
            dueDate,
            status: "UPCOMING" as const,
          });
        }
        await tx.loanRepayment.createMany({ data: repaymentsData });

        await tx.notification.create({
          data: {
            userId: loan.userId,
            title: "Loan Approved & Disbursed",
            message: `Your ${loan.loanType} loan of $${principal.toFixed(
              2
            )} has been approved and credited to account ${loan.account.accountNumber}.`,
            type: "SUCCESS",
          },
        });

        return updatedLoan;
      });

      return NextResponse.json({
        loan: {
          ...approved,
          requestedAmount: Number(approved.requestedAmount),
          approvedAmount: Number(approved.approvedAmount),
          remainingBalance: Number(approved.remainingBalance),
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update loan";
    if (msg.startsWith("BAD_REQUEST:")) {
      return NextResponse.json({ error: msg.replace("BAD_REQUEST:", "") }, { status: 400 });
    }
    console.error("Loan update error:", err);
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
  }
}
