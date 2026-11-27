"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
  const doc = new jsPDF();

  // Header
  doc.setFillColor(79, 70, 229); // Indigo #4F46E5
  doc.rect(0, 0, 210, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("AegisBank", 14, 18);
  doc.setFontSize(10);
  doc.text("Official Transaction Receipt", 14, 26);
  doc.text(`Ref: ${tx.transactionId}`, 196, 20, { align: "right" });

  // Body
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text("Transaction Summary", 14, 50);

  autoTable(doc, {
    startY: 56,
    theme: "grid",
    headStyles: { fillColor: [79, 70, 229] },
    body: [
      ["Transaction ID", tx.transactionId],
      ["Date & Time", formatDateTime(tx.createdAt)],
      ["Type", tx.type.replace("_", " ")],
      ["Status", tx.status],
      ["Sender Account", tx.senderAccountNumber || "External / System"],
      ["Receiver Account", tx.receiverAccountNumber || "External / System"],
      ["Amount", formatCurrency(tx.amount)],
      ["Fee", formatCurrency(tx.fee)],
      ["Total", formatCurrency(Number(tx.amount) + Number(tx.fee))],
      ["Description", tx.description],
    ],
  });

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "This is an electronically generated receipt from AegisBank Digital Banking Platform.",
    14,
    doc.internal.pageSize.height - 15
  );

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
  doc.text(`Current Balance: ${formatCurrency(balance)}`, 14, 62);

  autoTable(doc, {
    startY: 70,
    head: [["Date", "Transaction ID", "Type", "Description", "Amount", "Status"]],
    headStyles: { fillColor: [79, 70, 229] },
    body: transactions.map((tx) => [
      formatDateTime(tx.createdAt),
      tx.transactionId,
      tx.type.replace("_", " "),
      tx.description,
      formatCurrency(tx.amount),
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
