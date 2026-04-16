"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractArray, formatDate, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import {
  IndianRupee,
  Users,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Wallet,
  ExternalLink,
  FileText,
  ArrowUpRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageBanner({ isLoading }: { isLoading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px, 70px 70px",
        }}
      />
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Fees & Payments
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              View invoices, payment history, and outstanding balances
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Fee Management</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ChildSelector({
  children,
  selectedChildId,
  onSelect,
}: {
  children: any[];
  selectedChildId: string;
  onSelect: (id: string | null) => void;
}) {
  if (children.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex items-center gap-3 mb-6"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 shadow-sm">
        <Users className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Viewing for
        </span>
        <Select value={selectedChildId} onValueChange={onSelect}>
          <SelectTrigger className="w-64 bg-white/80 backdrop-blur-sm border-border/60 shadow-sm">
            <SelectValue placeholder="Select a child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child: any) => {
              const id = String(child.student_id ?? child.id ?? "");
              const name =
                `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() ||
                "Child";
              const cls = child.class_name ?? child.className ?? "";
              const sec = child.section_name ?? child.sectionName ?? "";
              return (
                <SelectItem key={id} value={id}>
                  {name} {cls && sec ? `(${cls} - ${sec})` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInvoiceStatus(inv: any): {
  label: string;
  color: string;
  bgColor: string;
} {
  const status = (inv.status ?? "").toLowerCase();
  const dueDate = inv.due_date ?? inv.dueDate ?? "";
  const isPastDue =
    dueDate && new Date(dueDate) < new Date() && status !== "paid";

  if (status === "paid")
    return { label: "Paid", color: "text-emerald-700", bgColor: "bg-emerald-100" };
  if (isPastDue || status === "overdue")
    return { label: "Overdue", color: "text-red-700", bgColor: "bg-red-100" };
  if (status === "partial")
    return { label: "Partial", color: "text-blue-700", bgColor: "bg-blue-100" };
  return { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-100" };
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ParentFeesPage() {
  const { data: parent, isLoading: parentLoading } = useParentProfile();
  const parentId = parent?.id;
  const { data: childrenRaw, isLoading: childrenLoading } =
    useParentChildren(parentId);
  const children = useMemo(() => extractArray(childrenRaw), [childrenRaw]);

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(
        String(children[0].student_id ?? children[0].id ?? "")
      );
    }
  }, [children, selectedChildId]);

  // Fetch invoices
  const { data: invoicesRaw, isLoading: invoicesLoading } = useQuery({
    queryKey: ["parent-child-invoices", selectedChildId],
    queryFn: () =>
      api.get<any>(`/api/v1/students/${selectedChildId}/invoices`),
    enabled: !!selectedChildId,
  });
  const invoices = useMemo(() => extractArray(invoicesRaw), [invoicesRaw]);

  // Derived totals
  const { totalFees, totalPaid, outstanding } = useMemo(() => {
    let total = 0;
    let paid = 0;

    invoices.forEach((inv: any) => {
      const amount = Number(
        inv.amount ?? inv.total ?? inv.total_amount ?? 0
      );
      const amountPaid = Number(inv.paid ?? inv.amount_paid ?? 0);
      const status = (inv.status ?? "").toLowerCase();
      total += amount;
      paid += status === "paid" ? amount : amountPaid;
    });

    return {
      totalFees: total,
      totalPaid: paid,
      outstanding: total - paid,
    };
  }, [invoices]);

  // Payment history: filter invoices that have been paid (fully or partially)
  const paymentHistory = useMemo(() => {
    return invoices.filter((inv: any) => {
      const status = (inv.status ?? "").toLowerCase();
      const amountPaid = Number(inv.paid ?? inv.amount_paid ?? 0);
      return status === "paid" || amountPaid > 0;
    });
  }, [invoices]);

  const isLoading = parentLoading || childrenLoading;
  const dataLoading = isLoading || invoicesLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={(v) => v && setSelectedChildId(v)}
      />

      {/* Summary Cards */}
      {dataLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {/* Total Fees */}
          <motion.div
            variants={fadeSlideUp}
            whileHover={{ scale: 1.03, y: -2 }}
          >
            <Card className="relative overflow-hidden border border-blue-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Total Fees
                    </p>
                    <p className="text-3xl font-extrabold tracking-tight text-foreground">
                      {totalFees > 0 ? formatCurrency(totalFees) : "--"}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 shadow-sm">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
              <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 bg-blue-100" />
            </Card>
          </motion.div>

          {/* Paid */}
          <motion.div
            variants={fadeSlideUp}
            whileHover={{ scale: 1.03, y: -2 }}
          >
            <Card className="relative overflow-hidden border border-emerald-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Paid
                    </p>
                    <p className="text-3xl font-extrabold tracking-tight text-emerald-600">
                      {totalPaid > 0 ? formatCurrency(totalPaid) : "--"}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
              <div className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 bg-emerald-100" />
            </Card>
          </motion.div>

          {/* Outstanding */}
          <motion.div
            variants={fadeSlideUp}
            whileHover={{ scale: 1.03, y: -2 }}
          >
            <Card
              className={`relative overflow-hidden border ${
                outstanding > 0 ? "border-red-100" : "border-emerald-100"
              } bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-shadow duration-300`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Outstanding
                    </p>
                    <p
                      className={`text-3xl font-extrabold tracking-tight ${
                        outstanding > 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {outstanding > 0
                        ? formatCurrency(outstanding)
                        : invoices.length > 0
                        ? "Nil"
                        : "--"}
                    </p>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                      outstanding > 0 ? "bg-red-100" : "bg-emerald-100"
                    }`}
                  >
                    {outstanding > 0 ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                </div>
              </CardContent>
              <div
                className={`pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-30 ${
                  outstanding > 0 ? "bg-red-100" : "bg-emerald-100"
                }`}
              />
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Invoice List */}
      <motion.div
        variants={fadeSlideUp}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-brand-primary" />
          <h2 className="text-lg font-bold text-foreground">Invoices</h2>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">
                No invoices found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
                Fee invoices will appear here once generated by the school
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            {invoices.map((inv: any, idx: number) => {
              const id = inv.id ?? inv.invoice_id ?? String(idx);
              const invoiceNumber =
                inv.invoice_number ??
                inv.invoiceNumber ??
                inv.number ??
                `INV-${String(idx + 1).padStart(3, "0")}`;
              const description =
                inv.description ?? inv.title ?? inv.name ?? "Fee Invoice";
              const amount = Number(
                inv.amount ?? inv.total ?? inv.total_amount ?? 0
              );
              const dueDate = inv.due_date ?? inv.dueDate ?? "";
              const createdDate =
                inv.date ?? inv.created_at ?? inv.invoice_date ?? "";
              const statusInfo = getInvoiceStatus(inv);
              const isPaid = statusInfo.label === "Paid";

              return (
                <motion.div
                  key={id}
                  variants={fadeSlideUp}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                      isPaid ? "bg-emerald-100" : "bg-amber-100"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {description}
                      </p>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        #{invoiceNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {createdDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(createdDate)}
                        </p>
                      )}
                      {dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(dueDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </Badge>
                    {!isPaid && (
                      <Button
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setPayDialogOpen(true);
                        }}
                      >
                        <CreditCard className="h-3 w-3" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <motion.div
          variants={fadeSlideUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">
              Payment History
            </h2>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {paymentHistory.map((inv: any, idx: number) => {
              const id = inv.id ?? inv.invoice_id ?? String(idx);
              const description =
                inv.description ?? inv.title ?? inv.name ?? "Fee Payment";
              const amount = Number(
                inv.amount ?? inv.total ?? inv.total_amount ?? 0
              );
              const paidAmount = Number(inv.paid ?? inv.amount_paid ?? amount);
              const paidDate =
                inv.paid_at ?? inv.payment_date ?? inv.updated_at ?? inv.created_at ?? "";

              return (
                <motion.div
                  key={`payment-${id}`}
                  variants={fadeSlideUp}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-xl border border-emerald-50 bg-emerald-50/30 p-3.5 transition-all duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {paidDate ? formatDate(paidDate) : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-emerald-600">
                    {formatCurrency(paidAmount)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Pay Now Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-primary" />
              Payment Information
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice
                ? `Invoice: ${
                    selectedInvoice.description ??
                    selectedInvoice.title ??
                    "Fee"
                  } - ${formatCurrency(
                    Number(
                      selectedInvoice.amount ??
                        selectedInvoice.total ??
                        0
                    )
                  )}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Card className="border border-blue-100 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Contact School Office
                    </p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Please contact the school office for payment or use the
                      payment link provided by the school. Online payment
                      integration is coming soon.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 px-1">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Online payment via Razorpay coming in v2
              </span>
            </div>
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
