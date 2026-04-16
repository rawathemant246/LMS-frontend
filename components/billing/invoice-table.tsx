"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

interface InvoiceTableProps {
  data: any[];
  isLoading: boolean;
}

export function InvoiceTable({ data, isLoading }: InvoiceTableProps) {
  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>School</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-8">No invoices found</TableCell>
            </TableRow>
          ) : (
            data.map((inv: any) => (
              <TableRow key={inv.invoice_id}>
                <TableCell className="font-mono text-sm">INV-{inv.invoice_id}</TableCell>
                <TableCell>{inv.organization_name || `Org #${inv.org_id}`}</TableCell>
                <TableCell className="font-medium">{formatCurrency(inv.amount)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[inv.status] || "bg-gray-100 text-gray-700"}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500">{formatDate(inv.invoice_date || inv.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
