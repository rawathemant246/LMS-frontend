"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useStudentReportCards } from "@/hooks/use-gradebook";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Eye,
  CalendarDays,
  Award,
  GraduationCap,
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
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusConfig(status: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "published") {
    return {
      label: "Published",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    };
  }
  if (s === "generated" || s === "draft") {
    return {
      label: s === "draft" ? "Draft" : "Generated",
      bg: "bg-amber-100",
      text: "text-amber-700",
    };
  }
  return {
    label: status || "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
}

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
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Report Cards
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              View and download your academic report cards
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Award className="h-4 w-4" />
          <span>Academic Records</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ReportCardItem({
  reportCard,
  onView,
  onDownload,
}: {
  reportCard: any;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  const title =
    reportCard.exam_name ??
    reportCard.examName ??
    reportCard.term_name ??
    reportCard.termName ??
    reportCard.title ??
    reportCard.name ??
    "Report Card";
  const generatedAt =
    reportCard.generated_at ??
    reportCard.generatedAt ??
    reportCard.created_at ??
    reportCard.createdAt ??
    "";
  const status =
    reportCard.status ?? "generated";
  const statusConfig = getStatusConfig(status);
  const reportCardId =
    reportCard.report_card_id ?? reportCard.id ?? "";

  return (
    <motion.div variants={fadeSlideUp} whileHover={{ y: -3 }}>
      <Card className="border border-border/60 bg-white hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 shadow-sm group-hover:shadow-md transition-shadow">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {title}
                </h3>
                <Badge
                  variant="outline"
                  className={`shrink-0 border-transparent text-[10px] px-2 ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {statusConfig.label}
                </Badge>
              </div>

              {generatedAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
                  <CalendarDays className="h-3 w-3" />
                  <span>Generated {formatDate(generatedAt)}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onView(reportCardId)}
                  className="h-8 text-xs rounded-lg bg-brand-primary hover:bg-brand-primary/90"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  View PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(reportCardId)}
                  className="h-8 text-xs rounded-lg border-border/60"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function PdfViewerDialog({
  pdfUrl,
  open,
  onOpenChange,
}: {
  pdfUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[85vh]">
        <DialogHeader>
          <DialogTitle>Report Card</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 -mx-4 -mb-4 rounded-b-xl overflow-hidden">
          {pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full min-h-[60vh]"
            >
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Unable to display PDF in browser
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(pdfUrl, "_blank")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </object>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentReportCardsPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const studentId = student?.student_id ?? student?.id;

  const { data: reportCardsRaw, isLoading: reportCardsLoading } =
    useStudentReportCards(studentId);

  const reportCards = useMemo(
    () => extractArray(reportCardsRaw),
    [reportCardsRaw]
  );

  const fetchPdf = useCallback(async (reportCardId: string): Promise<string | null> => {
    const token =
      document.cookie.match(/access_token=([^;]+)/)?.[1] || "";
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      }/api/v1/report-cards/${reportCardId}/pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      toast.error("Failed to load PDF");
      return null;
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, []);

  const handleView = useCallback(
    async (reportCardId: string) => {
      setLoadingPdf(reportCardId);
      const url = await fetchPdf(reportCardId);
      setLoadingPdf(null);
      if (url) {
        setPdfUrl(url);
        setShowPdf(true);
      }
    },
    [fetchPdf]
  );

  const handleDownload = useCallback(
    async (reportCardId: string) => {
      setLoadingPdf(reportCardId);
      const url = await fetchPdf(reportCardId);
      setLoadingPdf(null);
      if (url) {
        window.open(url, "_blank");
      }
    },
    [fetchPdf]
  );

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setShowPdf(open);
      if (!open && pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    },
    [pdfUrl]
  );

  const isLoading = studentLoading || reportCardsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : reportCards.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
              <GraduationCap className="h-8 w-8 text-brand-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              No report cards yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Report cards will appear here once they are generated by your
              school. Check back after exams!
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {reportCards.map((rc: any, index: number) => (
            <ReportCardItem
              key={rc.report_card_id ?? rc.id ?? index}
              reportCard={rc}
              onView={handleView}
              onDownload={handleDownload}
            />
          ))}
        </motion.div>
      )}

      {/* Loading overlay */}
      {loadingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="p-6">
            <CardContent className="flex items-center gap-3 p-0">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              <span className="text-sm font-medium text-foreground">
                Loading PDF...
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PDF Viewer Dialog */}
      <PdfViewerDialog
        pdfUrl={pdfUrl}
        open={showPdf}
        onOpenChange={handleDialogClose}
      />
    </div>
  );
}
