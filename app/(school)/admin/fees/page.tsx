"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  useFeeHeads,
  useCreateFeeHead,
  useFeeStructures,
  useCreateFeeStructure,
  useDefaulters,
} from "@/hooks/use-fees";
import { useAcademicYears, useClasses } from "@/hooks/use-academic";
import { formatCurrency } from "@/lib/utils";

// ── Frequency badge ────────────────────────────────────────────────────────────

const FREQUENCY_COLORS: Record<string, string> = {
  one_time: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  monthly: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  quarterly: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  half_yearly: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  annual: "bg-green-100 text-green-700 hover:bg-green-100",
};

function FrequencyBadge({ frequency }: { frequency: string }) {
  const cls =
    FREQUENCY_COLORS[frequency?.toLowerCase()] ??
    "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return (
    <Badge
      variant="outline"
      className={`border-transparent capitalize ${cls}`}
    >
      {frequency?.replace(/_/g, " ")}
    </Badge>
  );
}

// ── Create Fee Head Dialog ─────────────────────────────────────────────────────

function CreateFeeHeadDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);

  const mutation = useCreateFeeHead();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setName("");
      setDescription("");
      setIsMandatory(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { name, description, is_mandatory: isMandatory },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setIsMandatory(true);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Fee Head
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Fee Head</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="fh-name">Name</Label>
            <Input
              id="fh-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tuition Fee"
              required
            />
          </div>
          <div>
            <Label htmlFor="fh-desc">Description</Label>
            <Input
              id="fh-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="fh-mandatory"
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="fh-mandatory">Mandatory</Label>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Fee Head"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Fee Heads Tab ──────────────────────────────────────────────────────────────

function FeeHeadsTab() {
  const { data: feeHeadsData, isLoading } = useFeeHeads();
  const feeHeads: any[] = Array.isArray(feeHeadsData)
    ? feeHeadsData
    : (feeHeadsData as any)?.items ?? (feeHeadsData as any)?.fee_heads ?? [];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <CreateFeeHeadDialog />
      </div>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : feeHeads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-500 py-12"
                >
                  No fee heads configured
                </TableCell>
              </TableRow>
            ) : (
              feeHeads.map((head: any) => (
                <TableRow key={head.fee_head_id ?? head.id}>
                  <TableCell className="font-medium">
                    {head.name ?? head.fee_head_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {head.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {head.is_mandatory ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        Mandatory
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-gray-100 text-gray-500 hover:bg-gray-100"
                      >
                        Optional
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {head.is_active !== false ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-gray-100 text-gray-500 hover:bg-gray-100"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Create Fee Structure Dialog ────────────────────────────────────────────────

function CreateFeeStructureDialog({
  academicYearId,
  classId,
}: {
  academicYearId: string;
  classId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [feeHeadId, setFeeHeadId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [lateFeePerDay, setLateFeePerDay] = useState("");

  const { data: feeHeadsData } = useFeeHeads();
  const feeHeads: any[] = Array.isArray(feeHeadsData)
    ? feeHeadsData
    : (feeHeadsData as any)?.items ?? (feeHeadsData as any)?.fee_heads ?? [];

  const mutation = useCreateFeeStructure();

  const reset = () => {
    setFeeHeadId("");
    setAmount("");
    setFrequency("");
    setDueDay("");
    setLateFeePerDay("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      fee_head_id: feeHeadId,
      amount: Number(amount),
      frequency,
      academic_year_id: academicYearId,
    };
    if (classId) payload.class_id = classId;
    if (dueDay) payload.due_day = Number(dueDay);
    if (lateFeePerDay) payload.late_fee_per_day = Number(lateFeePerDay);

    mutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Create Structure
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Fee Head</Label>
            <Select
              value={feeHeadId}
              onValueChange={(val) => setFeeHeadId(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select fee head" />
              </SelectTrigger>
              <SelectContent>
                {feeHeads.map((head: any) => (
                  <SelectItem
                    key={head.fee_head_id ?? head.id}
                    value={String(head.fee_head_id ?? head.id)}
                  >
                    {head.name ?? head.fee_head_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fs-amount">Amount (₹)</Label>
            <Input
              id="fs-amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>
          <div>
            <Label>Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(val) => setFrequency(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One Time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="half_yearly">Half Yearly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fs-due-day">Due Day (optional)</Label>
            <Input
              id="fs-due-day"
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <Label htmlFor="fs-late-fee">Late Fee Per Day ₹ (optional)</Label>
            <Input
              id="fs-late-fee"
              type="number"
              min="0"
              value={lateFeePerDay}
              onChange={(e) => setLateFeePerDay(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !feeHeadId || !frequency}
          >
            {mutation.isPending ? "Creating..." : "Create Structure"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Structures Tab ─────────────────────────────────────────────────────────────

function StructuresTab() {
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: yearsData } = useAcademicYears();
  const years: any[] = Array.isArray(yearsData)
    ? yearsData
    : (yearsData as any)?.items ?? (yearsData as any)?.academic_years ?? [];

  const { data: classesData } = useClasses(selectedYearId || undefined);
  const classes: any[] = Array.isArray(classesData)
    ? classesData
    : (classesData as any)?.items ?? (classesData as any)?.classes ?? [];

  const { data: structuresData, isLoading } = useFeeStructures(
    selectedYearId || undefined,
    selectedClassId || undefined
  );
  const structures: any[] = Array.isArray(structuresData)
    ? structuresData
    : (structuresData as any)?.items ??
      (structuresData as any)?.fee_structures ??
      [];

  const handleYearChange = (val: string | null) => {
    setSelectedYearId(val ?? "");
    setSelectedClassId("");
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap text-sm font-medium">
            Academic Year
          </Label>
          <Select value={selectedYearId} onValueChange={handleYearChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year: any) => (
                <SelectItem
                  key={year.academic_year_id ?? year.id}
                  value={String(year.academic_year_id ?? year.id)}
                >
                  {year.label ?? year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedYearId && (
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-sm font-medium">
              Class
            </Label>
            <Select
              value={selectedClassId}
              onValueChange={(val) => setSelectedClassId(val ?? "")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem
                    key={cls.class_id ?? cls.id}
                    value={String(cls.class_id ?? cls.id)}
                  >
                    {cls.class_name ?? cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedYearId && (
          <div className="ml-auto">
            <CreateFeeStructureDialog
              academicYearId={selectedYearId}
              classId={selectedClassId || undefined}
            />
          </div>
        )}
      </div>

      {!selectedYearId ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
          Select an academic year to view fee structures
        </div>
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Head</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Due Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))
              ) : structures.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-12"
                  >
                    No fee structures for selected filters
                  </TableCell>
                </TableRow>
              ) : (
                structures.map((s: any) => (
                  <TableRow key={s.fee_structure_id ?? s.id}>
                    <TableCell className="font-medium">
                      {s.fee_head_name ?? s.name ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(Number(s.amount ?? 0))}
                    </TableCell>
                    <TableCell>
                      {s.frequency ? (
                        <FrequencyBadge frequency={s.frequency} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {s.due_day ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Collection Tab ─────────────────────────────────────────────────────────────

function CollectionTab() {
  return (
    <Card>
      <CardContent className="p-12 text-center text-gray-500">
        Fee collection interface coming soon. Use the Defaulters tab to track
        outstanding payments.
      </CardContent>
    </Card>
  );
}

// ── Defaulters Tab ─────────────────────────────────────────────────────────────

function DefaultersTab() {
  const { data: defaultersData, isLoading } = useDefaulters();
  const raw: any[] = Array.isArray(defaultersData)
    ? defaultersData
    : (defaultersData as any)?.items ??
      (defaultersData as any)?.defaulters ??
      [];

  const now = new Date();

  // Sort by due_date ascending (most overdue first)
  const defaulters = [...raw].sort((a, b) => {
    const da = a.due_date ? new Date(a.due_date).getTime() : 0;
    const db = b.due_date ? new Date(b.due_date).getTime() : 0;
    return da - db;
  });

  const isOverdue30Days = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    return diffMs > 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : defaulters.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-gray-500 py-12"
              >
                No defaulters found
              </TableCell>
            </TableRow>
          ) : (
            defaulters.map((d: any, idx: number) => {
              const netAmount = Number(d.net_amount ?? d.total_amount ?? 0);
              const paidAmount = Number(d.paid_amount ?? d.amount_paid ?? 0);
              const outstanding = netAmount - paidAmount;
              const overdue30 = isOverdue30Days(d.due_date);

              return (
                <TableRow
                  key={d.invoice_id ?? d.id ?? idx}
                  className={overdue30 ? "bg-red-50" : undefined}
                >
                  <TableCell className="font-medium">
                    {d.student_name ??
                      d.name ??
                      d.admission_number ??
                      "Unknown"}
                  </TableCell>
                  <TableCell className="text-gray-500 font-mono text-xs">
                    {d.invoice_number ?? d.invoice_id ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(netAmount)}
                  </TableCell>
                  <TableCell className="tabular-nums text-gray-500">
                    {formatCurrency(paidAmount)}
                  </TableCell>
                  <TableCell className="tabular-nums font-bold text-red-600">
                    {formatCurrency(outstanding)}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {d.due_date
                      ? new Date(d.due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FeesPage() {
  return (
    <div>
      <PageHeader
        title="Fees"
        description="Manage fee heads, structures, collections, and defaulters"
      />
      <Tabs defaultValue="fee-heads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fee-heads">Fee Heads</TabsTrigger>
          <TabsTrigger value="structures">Structures</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
        </TabsList>
        <TabsContent value="fee-heads">
          <FeeHeadsTab />
        </TabsContent>
        <TabsContent value="structures">
          <StructuresTab />
        </TabsContent>
        <TabsContent value="collection">
          <CollectionTab />
        </TabsContent>
        <TabsContent value="defaulters">
          <DefaultersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
