"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import { useStudentAttendance, useStudentMastery } from "@/hooks/use-student-insights";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Brain,
  ArrowRight,
  BookOpen,
  Hash,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
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
              <Users className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                My Children
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              View profiles and progress of your children
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Family Overview</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ProgressBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xs font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ChildCard({
  child,
  index,
  isSingle,
}: {
  child: any;
  index: number;
  isSingle: boolean;
}) {
  const router = useRouter();
  const studentId = String(child.student_id ?? child.id ?? "");

  const { data: attendanceRaw, isLoading: attLoading } = useStudentAttendance(studentId || undefined);
  const { data: masteryRaw, isLoading: masteryLoading } = useStudentMastery(studentId || undefined);

  const firstName = child.first_name ?? child.firstName ?? "";
  const lastName = child.last_name ?? child.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Child";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
  const className = child.class_name ?? child.className ?? "";
  const sectionName = child.section_name ?? child.sectionName ?? "";
  const rollNumber = child.roll_number ?? child.rollNumber ?? child.roll_no ?? "";

  // Attendance %
  const attendancePct = useMemo(() => {
    const att = attendanceRaw;
    if (!att) return 0;
    const total = att.total_days ?? att.totalDays ?? 0;
    const present = att.present_days ?? att.presentDays ?? att.present ?? 0;
    if (total === 0) return 0;
    return Math.round((present / total) * 100);
  }, [attendanceRaw]);

  // Mastery %
  const masteryPct = useMemo(() => {
    const concepts = extractArray(masteryRaw);
    if (concepts.length === 0) return 0;
    const sum = concepts.reduce((acc: number, c: any) => {
      const pct = c.mastery_pct ?? c.masteryPct ?? c.mastery ?? c.percentage ?? 0;
      return acc + Number(pct);
    }, 0);
    return Math.round(sum / concepts.length);
  }, [masteryRaw]);

  const isLoading = attLoading || masteryLoading;

  const avatarGradients = [
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-pink-500 to-rose-500",
    "from-indigo-500 to-sky-500",
  ];
  const gradient = avatarGradients[index % avatarGradients.length];

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={isSingle ? "max-w-2xl mx-auto w-full" : ""}
    >
      <Card
        className="relative overflow-hidden border border-border/60 bg-white hover:shadow-xl cursor-pointer transition-all duration-300 group"
        onClick={() => router.push("/parent/attendance")}
      >
        <CardContent className={`${isSingle ? "p-8" : "p-6"}`}>
          <div className={`flex ${isSingle ? "flex-row items-start gap-8" : "flex-col gap-5"}`}>
            {/* Avatar + Identity */}
            <div className={`flex ${isSingle ? "flex-col items-center gap-3" : "flex-row items-center gap-4"}`}>
              <div
                className={`${isSingle ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg"} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} font-bold text-white shadow-lg`}
              >
                {initials}
              </div>
              <div className={isSingle ? "text-center" : ""}>
                <h3 className={`${isSingle ? "text-xl" : "text-base"} font-bold text-foreground leading-tight`}>
                  {fullName}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  {className && sectionName && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-50 text-[11px]"
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {className} - {sectionName}
                    </Badge>
                  )}
                  {rollNumber && (
                    <Badge
                      variant="outline"
                      className="border-transparent bg-gray-100 text-gray-600 hover:bg-gray-100 text-[11px]"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      Roll {rollNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className={`flex-1 ${isSingle ? "min-w-0" : ""} space-y-4`}>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              ) : (
                <>
                  <ProgressBar
                    value={attendancePct}
                    label="Attendance"
                    color="bg-gradient-to-r from-sky-400 to-blue-500"
                  />
                  <ProgressBar
                    value={masteryPct}
                    label="Mastery"
                    color="bg-gradient-to-r from-violet-400 to-purple-500"
                  />
                </>
              )}

              {/* Quick stats for expanded view */}
              {isSingle && !isLoading && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 rounded-lg bg-sky-50 p-3">
                    <ClipboardCheck className="h-4 w-4 text-sky-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <p className="text-sm font-bold text-foreground">{attendancePct}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-violet-50 p-3">
                    <Brain className="h-4 w-4 text-violet-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mastery</p>
                      <p className="text-sm font-bold text-foreground">{masteryPct}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* View link hint */}
          <div className="flex items-center justify-end mt-4 text-xs font-medium text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            View Details <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        </CardContent>

        {/* Hover accent bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function MyChildrenPage() {
  const { data: parent, isLoading: parentLoading } = useParentProfile();
  const parentId = parent?.id;
  const { data: childrenRaw, isLoading: childrenLoading } = useParentChildren(parentId);
  const children = useMemo(() => extractArray(childrenRaw), [childrenRaw]);

  const isLoading = parentLoading || childrenLoading;
  const isSingle = children.length === 1;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-base font-semibold text-muted-foreground">
              No children linked yet
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-sm">
              Please contact your school administration to link your children to your parent account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className={
            isSingle
              ? "flex flex-col"
              : "grid grid-cols-1 md:grid-cols-2 gap-6"
          }
        >
          {children.map((child: any, index: number) => (
            <ChildCard
              key={child.student_id ?? child.id ?? index}
              child={child}
              index={index}
              isSingle={isSingle}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
