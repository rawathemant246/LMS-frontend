"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Link2,
  ChevronRight,
  ChevronDown,
  Plus,
  Upload,
  GripVertical,
  BookOpen,
  FolderOpen,
  Sparkles,
  Library,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  useTeacherProfile,
  useMySubjects,
} from "@/hooks/use-teacher-context";
import {
  useChapters,
  useTopics,
  useLearningObjects,
  useCreateChapter,
  useCreateTopic,
  useCreateLearningObject,
  useUploadDirect,
} from "@/hooks/use-content";
import { formatRelativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

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

function detectType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext))
    return "image";
  if (
    ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(ext)
  )
    return "document";
  return "document";
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Subject gradient colors for the tree
const SUBJECT_GRADIENTS = [
  {
    from: "from-indigo-500",
    to: "to-violet-500",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  {
    from: "from-emerald-500",
    to: "to-teal-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    from: "from-rose-500",
    to: "to-pink-500",
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  {
    from: "from-amber-500",
    to: "to-orange-500",
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    from: "from-sky-500",
    to: "to-cyan-500",
    bg: "bg-sky-500/10",
    text: "text-sky-600",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  {
    from: "from-purple-500",
    to: "to-fuchsia-500",
    bg: "bg-purple-500/10",
    text: "text-purple-600",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
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
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
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
// Topic children (lazy loaded)
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
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="pl-6"
    >
      {topics.map((topic: any) => {
        const topicId = topic.topic_id ?? topic.id;
        const topicName = topic.topic_name ?? topic.name ?? "Untitled";
        const isSelected = selectedTopicId === topicId;

        return (
          <motion.button
            key={topicId}
            variants={staggerItem}
            whileHover={{ x: 2 }}
            onClick={() =>
              onSelectTopic({
                subjectId,
                subjectName,
                chapterId,
                chapterName,
                topicId,
                topicName,
              })
            }
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-r from-brand-primary/10 to-violet-100 text-brand-primary font-semibold shadow-sm"
                : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{topicName}</span>
            {topic.topic_order != null && (
              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                #{topic.topic_order}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Chapter children (lazy loaded)
// ---------------------------------------------------------------------------

function ChapterList({
  subjectId,
  subjectName,
  expandedChapters,
  onToggleChapter,
  selectedTopicId,
  onSelectTopic,
  onAddTopic,
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
  onAddTopic: (chapterId: string) => void;
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
      <div className="pl-7 py-2 text-xs text-muted-foreground/60">
        No chapters yet
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="pl-3"
    >
      {chapters.map((chapter: any) => {
        const chapterId = chapter.chapter_id ?? chapter.id;
        const chapterName = chapter.chapter_name ?? chapter.name ?? "Untitled";
        const isExpanded = expandedChapters.has(chapterId);

        return (
          <motion.div key={chapterId} variants={staggerItem}>
            <div className="group flex items-center gap-1 py-0.5">
              <button
                onClick={() => onToggleChapter(chapterId)}
                className="flex items-center gap-1 flex-1 text-left rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-gray-50 transition-all duration-200"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </motion.div>
                <span className="truncate font-medium">{chapterName}</span>
                {chapter.chapter_order != null && (
                  <span className="text-[10px] text-muted-foreground/50 ml-1">
                    #{chapter.chapter_order}
                  </span>
                )}
              </button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAddTopic(chapterId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100"
                title="Add Topic"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.button>
            </div>
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
// Add Chapter Dialog
// ---------------------------------------------------------------------------

function AddChapterDialog({
  open,
  onOpenChange,
  subjectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const mutation = useCreateChapter();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setName("");
      setOrder("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        chapter_name: name,
        chapter_order: order ? Number(order) : undefined,
        subject_id: subjectId,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-violet-500">
                <Plus className="h-4 w-4 text-white" />
              </div>
              Add Chapter
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div>
              <Label htmlFor="ch-name">Chapter Name</Label>
              <Input
                id="ch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Introduction to Algebra"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ch-order">Order (optional)</Label>
              <Input
                id="ch-order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="e.g. 1"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-primary to-violet-600 hover:from-brand-primary/90 hover:to-violet-600/90 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Add Chapter"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Topic Dialog
// ---------------------------------------------------------------------------

function AddTopicDialog({
  open,
  onOpenChange,
  chapterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
}) {
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const mutation = useCreateTopic();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setName("");
      setOrder("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        topic_name: name,
        topic_order: order ? Number(order) : undefined,
        chapter_id: chapterId,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <Plus className="h-4 w-4 text-white" />
              </div>
              Add Topic
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div>
              <Label htmlFor="tp-name">Topic Name</Label>
              <Input
                id="tp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Linear Equations"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tp-order">Order (optional)</Label>
              <Input
                id="tp-order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="e.g. 1"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Add Topic"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Upload Dialog
// ---------------------------------------------------------------------------

function UploadDialog({
  open,
  onOpenChange,
  topicId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
}) {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadDirect();
  const createMutation = useCreateLearningObject();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    },
    [title]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTitle("");
      setSelectedFile(null);
    }
  };

  const isUploading = uploadMutation.isPending || createMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const uploadResult = await uploadMutation.mutateAsync(selectedFile);
      await createMutation.mutateAsync({
        title,
        type: detectType(selectedFile.name),
        file_url:
          uploadResult.url ?? uploadResult.file_url ?? uploadResult.path,
        file_size: selectedFile.size,
        topic_id: topicId,
      });
      handleOpenChange(false);
    } catch {
      // errors handled by mutation onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500">
                <Upload className="h-4 w-4 text-white" />
              </div>
              Upload Content
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-brand-primary bg-brand-primary/5 shadow-md"
                  : selectedFile
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-border/60 hover:border-brand-primary/40 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-emerald-700">
                    {getTypeIcon(detectType(selectedFile.name))}
                    <span className="font-semibold text-sm">
                      {selectedFile.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} -- click or drag to
                    replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? "Drop file here"
                      : "Drag & drop a file, or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    PDF, video, images, documents
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="lo-title">Title</Label>
              <Input
                id="lo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Content title"
                required
                className="mt-1"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Detected type:</span>
                <Badge
                  variant="outline"
                  className="border-transparent bg-gray-100 text-foreground hover:bg-gray-100 capitalize"
                >
                  {detectType(selectedFile.name)}
                </Badge>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? "Uploading..." : "Upload & Create"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Learning Objects Panel
// ---------------------------------------------------------------------------

function LearningObjectsPanel({
  selectedTopic,
  onUpload,
}: {
  selectedTopic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  } | null;
  onUpload: () => void;
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
            <p className="text-sm font-semibold text-foreground mb-1">
              Select a topic
            </p>
            <p className="text-xs text-muted-foreground max-w-[250px] leading-relaxed">
              Choose a topic from the tree to view and manage its learning
              materials
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <LearningObjectsList selectedTopic={selectedTopic} onUpload={onUpload} />
  );
}

function LearningObjectsList({
  selectedTopic,
  onUpload,
}: {
  selectedTopic: {
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  };
  onUpload: () => void;
}) {
  const { data: loData, isLoading } = useLearningObjects(
    selectedTopic.topicId
  );
  const items = extractArray(loData);

  return (
    <div className="flex-1 min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
        <span className="font-semibold text-foreground">
          {selectedTopic.subjectName}
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">
          {selectedTopic.chapterName}
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-brand-primary">
          {selectedTopic.topicName}
        </span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-foreground">
          Learning Objects
          {!isLoading && items.length > 0 && (
            <span className="ml-1.5 text-muted-foreground font-normal">
              ({items.length})
            </span>
          )}
        </h3>
        <Button
          size="sm"
          onClick={onUpload}
          className="bg-gradient-to-r from-brand-primary to-violet-600 hover:from-brand-primary/90 hover:to-violet-600/90 text-white shadow-sm"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload
        </Button>
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No content yet
              </p>
              <p className="text-xs text-muted-foreground/60 mb-4">
                Upload files to get started with this topic
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onUpload}
                className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload First File
              </Button>
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
            const status = item.status ?? "draft";

            return (
              <motion.div
                key={itemId}
                variants={staggerItem}
                whileHover={{ x: 2, scale: 1.005 }}
              >
                <Card className="hover:shadow-md transition-all duration-200 border-border/50">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 cursor-grab" />
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gray-50 border border-border/30 flex-shrink-0">
                      {getTypeIcon(itemType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {item.title ?? item.name ?? "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {itemType}
                        {item.file_size
                          ? ` \u00B7 ${formatFileSize(item.file_size)}`
                          : ""}
                        {item.created_at
                          ? ` \u00B7 ${formatRelativeTime(item.created_at)}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-transparent text-xs ${
                        status === "published"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }`}
                    >
                      {status}
                    </Badge>
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
// Content Tree Sidebar
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
  onAddChapter,
  onAddTopic,
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
  onAddChapter: (subjectId: string) => void;
  onAddTopic: (chapterId: string) => void;
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
        <p className="text-xs text-muted-foreground font-medium">
          No subjects assigned
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Contact your admin to get subjects assigned
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="p-2 space-y-0.5"
    >
      {subjects.map((subject: any, idx: number) => {
        const subjectId = String(subject.subject_id ?? subject.id ?? "");
        const subjectName =
          subject.subject_name ?? subject.name ?? "Untitled";
        const isExpanded = expandedSubjects.has(subjectId);
        const theme = getSubjectGradient(idx);

        return (
          <motion.div key={subjectId} variants={staggerItem}>
            <div className="group flex items-center gap-1">
              <button
                onClick={() => onToggleSubject(subjectId)}
                className={`flex items-center gap-2 flex-1 text-left rounded-xl px-2.5 py-2 text-sm font-semibold transition-all duration-200 ${
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
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAddChapter(subjectId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-gray-100"
                title="Add Chapter"
              >
                + Ch
              </motion.button>
            </div>
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
                    onAddTopic={onAddTopic}
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
// Page Banner
// ---------------------------------------------------------------------------

function PageBanner({
  subjectCount,
  isLoading,
}: {
  subjectCount: number;
  isLoading: boolean;
}) {
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Content Library
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Manage chapters, topics, and learning materials for{" "}
              {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Organize & Upload</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TeacherContentPage() {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set()
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [selectedTopic, setSelectedTopic] = useState<{
    subjectId: string;
    subjectName: string;
    chapterId: string;
    chapterName: string;
    topicId: string;
    topicName: string;
  } | null>(null);

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [addToSubjectId, setAddToSubjectId] = useState("");
  const [addToChapterId, setAddToChapterId] = useState("");

  // Data hooks
  const { data: teacher, isLoading: teacherLoading } = useTeacherProfile();
  const teacherId = teacher?.id;
  const mySubjects = useMySubjects(teacherId);

  // Build subjects list from assignments
  const subjects = useMemo(() => {
    return mySubjects.map((a: any) => ({
      subject_id: a.subject_id ?? a.id,
      subject_name: a.subject_name ?? a.subjectName ?? a.name ?? "Subject",
    }));
  }, [mySubjects]);

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

  const handleAddChapter = useCallback((subjectId: string) => {
    setAddToSubjectId(subjectId);
    setShowAddChapter(true);
  }, []);

  const handleAddTopic = useCallback((chapterId: string) => {
    setAddToChapterId(chapterId);
    setShowAddTopic(true);
  }, []);

  const isLoading = teacherLoading;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Banner */}
      <PageBanner subjectCount={subjects.length} isLoading={isLoading} />

      {/* Main Content: Tree + Detail Panel */}
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 260px)" }}>
        {/* Left Panel - Content Tree */}
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
                My Subjects
              </h2>
              {subjects.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 ml-auto"
                >
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
            onAddChapter={handleAddChapter}
            onAddTopic={handleAddTopic}
          />
        </motion.div>

        {/* Right Panel - Learning Objects */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 flex flex-col rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm"
        >
          <LearningObjectsPanel
            selectedTopic={selectedTopic}
            onUpload={() => setShowUpload(true)}
          />
        </motion.div>
      </div>

      {/* Dialogs */}
      <AddChapterDialog
        open={showAddChapter}
        onOpenChange={setShowAddChapter}
        subjectId={addToSubjectId}
      />
      <AddTopicDialog
        open={showAddTopic}
        onOpenChange={setShowAddTopic}
        chapterId={addToChapterId}
      />
      {selectedTopic && (
        <UploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          topicId={selectedTopic.topicId}
        />
      )}
    </div>
  );
}
