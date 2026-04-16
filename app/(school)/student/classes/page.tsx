"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import { useSubjects } from "@/hooks/use-academic";
import { useChapters } from "@/hooks/use-content";
import { useStudentProfile } from "@/hooks/use-student-context";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Layers,
  Library,
  Sparkles,
  User,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Subject gradient colors
// ---------------------------------------------------------------------------

const SUBJECT_GRADIENTS = [
  { from: "from-indigo-500", to: "to-violet-500", bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-200", bar: "bg-indigo-500" },
  { from: "from-emerald-500", to: "to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-200", bar: "bg-emerald-500" },
  { from: "from-rose-500", to: "to-pink-500", bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-200", bar: "bg-rose-500" },
  { from: "from-amber-500", to: "to-orange-500", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200", bar: "bg-amber-500" },
  { from: "from-sky-500", to: "to-cyan-500", bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-200", bar: "bg-sky-500" },
  { from: "from-purple-500", to: "to-fuchsia-500", bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200", bar: "bg-purple-500" },
];

function getGradient(idx: number) {
  return SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length];
}

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

const expandCollapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// Chapter expansion panel
// ---------------------------------------------------------------------------

function ChapterPanel({ subjectId, barColor }: { subjectId: string; barColor: string }) {
  const { data: chaptersData, isLoading } = useChapters(subjectId);
  const chapters = extractArray(chaptersData);

  if (isLoading) {
    return (
      <div className="px-5 pb-5 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="px-5 pb-5 text-sm text-muted-foreground/60 text-center py-4">
        No chapters added yet
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="px-5 pb-5 space-y-2"
    >
      {chapters.map((chapter: any, idx: number) => {
        const chapterName = chapter.chapter_name ?? chapter.name ?? "Untitled";
        const topicCount = chapter.topic_count ?? chapter.topics?.length ?? 0;
        // Simulated progress -- would come from mastery API in production
        const progress = chapter.mastery ?? chapter.progress ?? 0;

        return (
          <motion.div
            key={chapter.chapter_id ?? chapter.id ?? idx}
            variants={fadeSlideUp}
            whileHover={{ x: 2 }}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-white p-3 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 border border-border/30 text-xs font-bold text-muted-foreground">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{chapterName}</p>
              {topicCount > 0 && (
                <p className="text-[10px] text-muted-foreground/70">
                  {topicCount} topic{topicCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="w-24 flex-shrink-0">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page Banner
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Classes</h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Your enrolled subjects and learning progress
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Learn & Grow</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentClassesPage() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const { isLoading: studentLoading } = useStudentProfile();
  const { data: subjectsRaw, isLoading: subjectsLoading } = useSubjects();

  const subjects = useMemo(() => extractArray(subjectsRaw), [subjectsRaw]);

  const isLoading = studentLoading || subjectsLoading;

  const toggleExpand = (id: string) => {
    setExpandedSubject((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Library className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-semibold text-muted-foreground mb-1">No subjects found</p>
            <p className="text-xs text-muted-foreground/60">
              Subjects will appear here once your school adds them
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {subjects.map((subject: any, idx: number) => {
            const subjectId = String(subject.subject_id ?? subject.id ?? "");
            const subjectName = subject.subject_name ?? subject.name ?? "Subject";
            const teacherName = subject.teacher_name ?? subject.teacherName ?? null;
            const chapterCount = subject.chapter_count ?? subject.chapters?.length ?? 0;
            const mastery = subject.mastery ?? subject.progress ?? 0;
            const theme = getGradient(idx);
            const isExpanded = expandedSubject === subjectId;

            return (
              <motion.div key={subjectId} variants={fadeSlideUp} className="col-span-1">
                <motion.div whileHover={isExpanded ? {} : { y: -4, scale: 1.01 }}>
                  <Card
                    className={`relative overflow-hidden border transition-all duration-300 cursor-pointer ${
                      isExpanded
                        ? `${theme.border} shadow-lg ring-1 ring-${theme.border}`
                        : "border-border/60 bg-white hover:shadow-lg"
                    }`}
                    onClick={() => toggleExpand(subjectId)}
                  >
                    {/* Gradient accent top bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${theme.from} ${theme.to}`} />

                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${theme.from} ${theme.to} shadow-sm`}
                          >
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground leading-tight">
                              {subjectName}
                            </h3>
                            {teacherName && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3 text-muted-foreground/50" />
                                <span className="text-[11px] text-muted-foreground/70">
                                  {teacherName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground">
                            {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Mastery progress bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="font-medium">Mastery</span>
                          <span className={`font-bold ${theme.text}`}>{mastery}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(mastery, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${theme.bar}`}
                          />
                        </div>
                      </div>
                    </CardContent>

                    {/* Expanded chapters */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="chapters"
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={expandCollapse}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="border-t border-border/40" />
                          <div className="px-5 pt-3 pb-1">
                            <div className="flex items-center gap-1.5 mb-3">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Chapters
                              </span>
                            </div>
                          </div>
                          <ChapterPanel subjectId={subjectId} barColor={theme.bar} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Subtle glow accent */}
                    <div
                      className={`pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-3/4 rounded-full blur-xl opacity-20 ${theme.bar}`}
                    />
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
