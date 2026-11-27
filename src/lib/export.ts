"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTime } from "@/lib/utils";

function formatPDFCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  const safe = Number.isFinite(num) ? num : 0;
  return `BDT ${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface ExportTransaction {
  transactionId: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  description: string;
  createdAt: string;
  senderAccountNumber?: string | null;
  receiverAccountNumber?: string | null;
}

export function downloadTransactionReceiptPDF(tx: ExportTransaction) {
  // Compact modern digital banking receipt slip (105mm x 165mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 165],
  });

  const pageWidth = 105;

  // 1. Sleek Header Banner
  doc.setFillColor(79, 70, 229); // #4F46E5 Indigo
  doc.rect(0, 0, pageWidth, 26, "F");

  // Bank Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AEGISBANK", pageWidth / 2, 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(224, 231, 255);
  doc.text("OFFICIAL TRANSACTION SLIP", pageWidth / 2, 18, { align: "center" });

  // 2. Amount & Success Indicator
  const isFailed = tx.status === "FAILED" || tx.status === "REVERSED";
  const statusColor = isFailed ? [239, 68, 68] : [16, 185, 129]; // Red or Emerald

  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    isFailed ? "TRANSACTION UNSETTLED" : "PAYMENT SUCCESSFUL",
    pageWidth / 2,
    35,
    { align: "center" }
  );

  // Large Prominent Amount
  doc.setTextColor(17, 24, 39); // #111827 Dark text
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  doc.text(formatPDFCurrency(tx.amount), pageWidth / 2, 44, { align: "center" });

  // Transaction Type Pill
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(pageWidth / 2 - 18, 48, 36, 5.5, 2, 2, "F");
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text(tx.type.replace(/_/g, " "), pageWidth / 2, 52, { align: "center" });

  // 3. Compact Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(10, 58, pageWidth - 10, 58);
  doc.setLineDashPattern([], 0);

  // 4. Clean Key-Value Detail Rows
  const totalAmount = Number(tx.amount) + Number(tx.fee);
  const rows: [string, string][] = [
    ["Reference ID", tx.transactionId],
    ["Date & Time", formatDateTime(tx.createdAt)],
    ["Status", tx.status],
    ["Sender Account", tx.senderAccountNumber || "System / External"],
    ["Receiver Account", tx.receiverAccountNumber || "System / External"],
    ["Transfer Fee", formatPDFCurrency(tx.fee)],
    ["Total Settled", formatPDFCurrency(totalAmount)],
    ["Description", tx.description || "Digital banking transaction"],
  ];

  let currentY = 66;
  doc.setFontSize(7.5);

  rows.forEach(([label, value]) => {
    // Label (left)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128); // #6B7280 Muted gray
    doc.text(label, 12, currentY);

    // Value (right)
    doc.setFont(
      "helvetica",
      label === "Total Settled" || label === "Reference ID" ? "bold" : "normal"
    );
    if (label === "Status") {
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    } else if (label === "Total Settled") {
      doc.setTextColor(79, 70, 229);
    } else {
      doc.setTextColor(31, 41, 55);
    }

    const truncatedVal = value.length > 28 ? value.slice(0, 26) + "..." : value;
    doc.text(truncatedVal, pageWidth - 12, currentY, { align: "right" });

    currentY += 8.2;
  });

  // 5. Bottom Dotted Divider & Watermark
  doc.setDrawColor(229, 231, 235);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(10, 136, pageWidth - 10, 136);
  doc.setLineDashPattern([], 0);

  // Security Verification Note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(156, 163, 175);
  doc.text("VERIFIED & RECORDED IN DIGITAL BANKING CORE", pageWidth / 2, 143, { align: "center" });
  doc.text(
    "This electronic slip serves as official proof of settled transfer.",
    pageWidth / 2,
    148,
    { align: "center" }
  );

  // Bank Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text("aegisbank.com • 24/7 Digital Banking", pageWidth / 2, 155, { align: "center" });

  doc.save(`${tx.transactionId}-receipt.pdf`);
}

export function downloadAccountStatementPDF(
  accountNumber: string,
  accountType: string,
  holderName: string,
  balance: number,
  transactions: ExportTransaction[]
) {
  const doc = new jsPDF();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("AegisBank", 14, 18);
  doc.setFontSize(10);
  doc.text("Official Account Statement", 14, 26);
  doc.text(`Generated: ${formatDateTime(new Date())}`, 196, 20, { align: "right" });

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text(`Account Holder: ${holderName}`, 14, 48);
  doc.text(`Account Number: ${accountNumber} (${accountType})`, 14, 55);
  doc.text(`Current Balance: ${formatPDFCurrency(balance)}`, 14, 62);

  autoTable(doc, {
    startY: 70,
    head: [["Date", "Transaction ID", "Type", "Description", "Amount", "Status"]],
    headStyles: { fillColor: [79, 70, 229] },
    body: transactions.map((tx) => [
      formatDateTime(tx.createdAt),
      tx.transactionId,
      tx.type.replace("_", " "),
      tx.description,
      formatPDFCurrency(tx.amount),
      tx.status,
    ]),
    styles: { fontSize: 8 },
  });

  doc.save(`AegisBank-Statement-${accountNumber}.pdf`);
}

export function downloadAccountStatementCSV(
  accountNumber: string,
  transactions: ExportTransaction[]
) {
  const headers = [
    "Transaction ID",
    "Date",
    "Type",
    "Sender Account",
    "Receiver Account",
    "Amount",
    "Fee",
    "Status",
    "Description",
  ];
  const rows = transactions.map((tx) => [
    tx.transactionId,
    new Date(tx.createdAt).toISOString(),
    tx.type,
    tx.senderAccountNumber ?? "",
    tx.receiverAccountNumber ?? "",
    Number(tx.amount).toFixed(2),
    Number(tx.fee).toFixed(2),
    tx.status,
    `"${(tx.description || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `AegisBank-Statement-${accountNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
