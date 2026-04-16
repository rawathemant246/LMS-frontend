"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import { useSubjects } from "@/hooks/use-academic";
import {
  useChapters,
  useTopics,
  useLearningObjects,
} from "@/hooks/use-content";
import { useStudentProfile } from "@/hooks/use-student-context";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Link2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  FolderOpen,
  Library,
  Sparkles,
  ExternalLink,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTypeIcon(type?: string) {
  switch (type?.toLowerCase()) {
    case "video":
      return <Video className="h-4 w-4 text-blue-600" />;
    case "image":
      return <ImageIcon className="h-4 w-4 text-green-600" />;
    case "link":
      return <Link2 className="h-4 w-4 text-purple-600" />;
    default:
      return <FileText className="h-4 w-4 text-orange-600" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Subject gradient colors for the tree
const SUBJECT_GRADIENTS = [
  { from: "from-indigo-500", to: "to-violet-500", bg: "bg-indigo-500/10", text: "text-indigo-600" },
  { from: "from-emerald-500", to: "to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600" },
  { from: "from-rose-500", to: "to-pink-500", bg: "bg-rose-500/10", text: "text-rose-600" },
  { from: "from-amber-500", to: "to-orange-500", bg: "bg-amber-500/10", text: "text-amber-600" },
  { from: "from-sky-500", to: "to-cyan-500", bg: "bg-sky-500/10", text: "text-sky-600" },
  { from: "from-purple-500", to: "to-fuchsia-500", bg: "bg-purple-500/10", text: "text-purple-600" },
];

function getSubjectGradient(index: number) {
  return SUBJECT_GRADIENTS[index % SUBJECT_GRADIENTS.length];
}

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

const expandCollapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
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
// Topic list (lazy loaded inside chapters)
// ---------------------------------------------------------------------------

function TopicList({
  chapterId,
  subjectId,
  subjectName,
  chapterName,
  selectedTopicId,
  onSelectTopic,
}: {
  chapterId: string;
  subjectId: string;
  subjectName: string;
  chapterName: string;
  selectedTopicId: string | null;
  onSelectTopic: (topic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  }) => void;
}) {
  const { data: topicsData, isLoading } = useTopics(chapterId);
  const topics = extractArray(topicsData);

  if (isLoading) {
    return (
      <div className="pl-10 py-1 space-y-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-36" />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="pl-10 py-2 text-xs text-muted-foreground/60">
        No topics yet
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="pl-6">
      {topics.map((topic: any) => {
        const topicId = topic.topic_id ?? topic.id;
        const topicName = topic.topic_name ?? topic.name ?? "Untitled";
        const isSelected = selectedTopicId === topicId;
        const progress = topic.progress ?? topic.mastery ?? 0;

        return (
          <motion.button
            key={topicId}
            variants={staggerItem}
            whileHover={{ x: 2 }}
            onClick={() =>
              onSelectTopic({ subjectId, subjectName, chapterId, chapterName, topicId, topicName })
            }
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-brand-primary/10 to-violet-100 text-brand-primary font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate flex-1">{topicName}</span>
            {progress > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="h-1 w-8 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground/50">{progress}%</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chapter list (lazy loaded inside subjects)
// ---------------------------------------------------------------------------

function ChapterList({
  subjectId,
  subjectName,
  expandedChapters,
  onToggleChapter,
  selectedTopicId,
  onSelectTopic,
}: {
  subjectId: string;
  subjectName: string;
  expandedChapters: Set<string>;
  onToggleChapter: (id: string) => void;
  selectedTopicId: string | null;
  onSelectTopic: (topic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  }) => void;
}) {
  const { data: chaptersData, isLoading } = useChapters(subjectId);
  const chapters = extractArray(chaptersData);

  if (isLoading) {
    return (
      <div className="pl-7 py-1 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-40" />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="pl-7 py-2 text-xs text-muted-foreground/60">No chapters yet</div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="pl-3">
      {chapters.map((chapter: any) => {
        const chapterId = chapter.chapter_id ?? chapter.id;
        const chapterName = chapter.chapter_name ?? chapter.name ?? "Untitled";
        const isExpanded = expandedChapters.has(chapterId);

        return (
          <motion.div key={chapterId} variants={staggerItem}>
            <button
              onClick={() => onToggleChapter(chapterId)}
              className="flex items-center gap-1 w-full text-left rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-gray-50 transition-all duration-200"
            >
              <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </motion.div>
              <span className="truncate font-medium">{chapterName}</span>
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="topics"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={expandCollapse}
                  style={{ overflow: "hidden" }}
                >
                  <TopicList
                    chapterId={chapterId}
                    subjectId={subjectId}
                    subjectName={subjectName}
                    chapterName={chapterName}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={onSelectTopic}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Content Tree Sidebar (read-only -- no add/create buttons)
// ---------------------------------------------------------------------------

function ContentTree({
  subjects,
  isLoadingSubjects,
  expandedSubjects,
  expandedChapters,
  onToggleSubject,
  onToggleChapter,
  selectedTopicId,
  onSelectTopic,
}: {
  subjects: any[];
  isLoadingSubjects: boolean;
  expandedSubjects: Set<string>;
  expandedChapters: Set<string>;
  onToggleSubject: (id: string) => void;
  onToggleChapter: (id: string) => void;
  selectedTopicId: string | null;
  onSelectTopic: (topic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  }) => void;
}) {
  if (isLoadingSubjects) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="p-6 text-center">
        <Library className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground font-medium">No subjects available</p>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="p-2 space-y-0.5">
      {subjects.map((subject: any, idx: number) => {
        const subjectId = String(subject.subject_id ?? subject.id ?? "");
        const subjectName = subject.subject_name ?? subject.name ?? "Untitled";
        const isExpanded = expandedSubjects.has(subjectId);
        const theme = getSubjectGradient(idx);

        return (
          <motion.div key={subjectId} variants={staggerItem}>
            <button
              onClick={() => onToggleSubject(subjectId)}
              className={`flex items-center gap-2 w-full text-left rounded-xl px-2.5 py-2 text-sm font-semibold transition-all duration-200 ${
                isExpanded
                  ? `${theme.bg} ${theme.text}`
                  : "text-foreground hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${theme.from} ${theme.to} shadow-sm`}
              >
                <BookOpen className="h-3 w-3 text-white" />
              </div>
              <span className="truncate">{subjectName}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="ml-auto"
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.div>
            </button>
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
                  <ChapterList
                    subjectId={subjectId}
                    subjectName={subjectName}
                    expandedChapters={expandedChapters}
                    onToggleChapter={onToggleChapter}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={onSelectTopic}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Learning Objects Panel (read-only)
// ---------------------------------------------------------------------------

function LearningObjectsPanel({
  selectedTopic,
}: {
  selectedTopic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  } | null;
}) {
  if (!selectedTopic) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mx-auto">
            <FolderOpen className="h-10 w-10 text-brand-primary/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Select a topic</p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Choose a topic from the sidebar to browse learning materials
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <LearningObjectsList selectedTopic={selectedTopic} />;
}

function LearningObjectsList({
  selectedTopic,
}: {
  selectedTopic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  };
}) {
  const { data: loData, isLoading } = useLearningObjects(selectedTopic.topicId);
  const items = extractArray(loData);

  return (
    <div className="flex-1 min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 flex-wrap">
        <span className="font-semibold text-foreground">{selectedTopic.subjectName}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{selectedTopic.chapterName}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-brand-primary">{selectedTopic.topicName}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground">
          Learning Materials
          {!isLoading && items.length > 0 && (
            <span className="ml-1.5 text-muted-foreground font-normal">({items.length})</span>
          )}
        </h3>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No content yet</p>
              <p className="text-xs text-muted-foreground/60">
                Your teacher hasn&apos;t added materials for this topic yet
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2.5"
        >
          {items.map((item: any) => {
            const itemId = item.learning_object_id ?? item.id;
            const itemType = item.type ?? item.content_type ?? "document";
            const fileUrl = item.file_url ?? item.url ?? "";
            const progress = item.progress ?? 0;

            return (
              <motion.div key={itemId} variants={staggerItem} whileHover={{ x: 2, scale: 1.005 }}>
                <Card className="hover:shadow-md transition-all duration-200 border-border/50">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 border border-border/30 flex-shrink-0">
                      {getTypeIcon(itemType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.title ?? item.name ?? "Untitled"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground capitalize">{itemType}</span>
                        {item.file_size && (
                          <span className="text-xs text-muted-foreground/60">
                            {formatFileSize(item.file_size)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator */}
                    {progress > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {progress}%
                        </span>
                      </div>
                    )}

                    {/* View action */}
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 text-xs font-medium transition-colors duration-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 text-muted-foreground text-xs font-medium">
                        <Eye className="h-3 w-3" />
                        View
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Banner
// ---------------------------------------------------------------------------

function PageBanner({ subjectCount, isLoading }: { subjectCount: number; isLoading: boolean }) {
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
              <Library className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-56 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Content Browser</h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Browse chapters, topics, and learning materials across {subjectCount} subject
              {subjectCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Explore & Learn</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentContentPage() {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<{
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  const { isLoading: studentLoading } = useStudentProfile();
  const { data: subjectsRaw, isLoading: subjectsLoading } = useSubjects();

  const subjects = useMemo(() => extractArray(subjectsRaw), [subjectsRaw]);

  const toggleSubject = useCallback((id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isLoading = studentLoading || subjectsLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner subjectCount={subjects.length} isLoading={isLoading} />

      {/* Main Content: Tree + Detail Panel */}
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 260px)" }}>
        {/* Left Panel - Content Tree (read-only) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-[300px] flex-shrink-0 rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm overflow-y-auto shadow-sm"
        >
          <div className="p-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Subjects
              </h2>
              {subjects.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 ml-auto">
                  {subjects.length}
                </Badge>
              )}
            </div>
          </div>
          <ContentTree
            subjects={subjects}
            isLoadingSubjects={isLoading}
            expandedSubjects={expandedSubjects}
            expandedChapters={expandedChapters}
            onToggleSubject={toggleSubject}
            onToggleChapter={toggleChapter}
            selectedTopicId={selectedTopic?.topicId ?? null}
            onSelectTopic={setSelectedTopic}
          />
        </motion.div>

        {/* Right Panel - Learning Objects (read-only) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 flex flex-col rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm"
        >
          <LearningObjectsPanel selectedTopic={selectedTopic} />
        </motion.div>
      </div>
    </div>
  );
}
