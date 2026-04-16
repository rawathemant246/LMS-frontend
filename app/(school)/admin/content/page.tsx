"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  useChapters,
  useTopics,
  useLearningObjects,
  useCreateChapter,
  useCreateTopic,
  useCreateLearningObject,
  useUploadDirect,
} from "@/hooks/use-content";
import { useSubjects } from "@/hooks/use-academic";
import { formatRelativeTime } from "@/lib/utils";

// ── Animation variants ──────────────────────────────────────────────────────

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.15, ease: "easeIn" as const } },
};

const dialogSpring = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  return (data as any)?.data?.items ?? (data as any)?.data ?? [];
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
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return "image";
  if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(ext)) return "document";
  return "document";
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Topic children (lazy loaded) ────────────────────────────────────────────

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
      <div className="pl-10 py-2 text-xs text-gray-400">No topics yet</div>
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
            className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              isSelected
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{topicName}</span>
            {topic.topic_order != null && (
              <span className="text-[10px] text-gray-400 ml-auto">
                #{topic.topic_order}
              </span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ── Chapter children (lazy loaded) ──────────────────────────────────────────

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
      <div className="pl-7 py-2 text-xs text-gray-400">No chapters yet</div>
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
            <div className="group flex items-center gap-1 py-1">
              <button
                onClick={() => onToggleChapter(chapterId)}
                className="flex items-center gap-1 flex-1 text-left rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                )}
                <span className="truncate font-medium">{chapterName}</span>
                {chapter.chapter_order != null && (
                  <span className="text-[10px] text-gray-400 ml-1">
                    #{chapter.chapter_order}
                  </span>
                )}
              </button>
              <button
                onClick={() => onAddTopic(chapterId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100"
                title="Add Topic"
              >
                <Plus className="h-3.5 w-3.5 text-gray-400" />
              </button>
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

// ── Add Chapter Dialog ──────────────────────────────────────────────────────

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
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Chapter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="ch-name">Chapter Name</Label>
            <Input
              id="ch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Introduction to Algebra"
              required
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Add Chapter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Topic Dialog ────────────────────────────────────────────────────────

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
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Topic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="tp-name">Topic Name</Label>
            <Input
              id="tp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linear Equations"
              required
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
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Add Topic"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Upload Dialog ───────────────────────────────────────────────────────────

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

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
        file_url: uploadResult.url ?? uploadResult.file_url ?? uploadResult.path,
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
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-indigo-400 bg-indigo-50"
                : selectedFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  {getTypeIcon(detectType(selectedFile.name))}
                  <span className="font-medium text-sm">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)} -- click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive ? "Drop file here" : "Drag & drop a file, or click to browse"}
                </p>
                <p className="text-xs text-gray-400">PDF, video, images, documents</p>
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
            />
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Detected type:</span>
              <Badge
                variant="outline"
                className="border-transparent bg-gray-100 text-gray-600 hover:bg-gray-100 capitalize"
              >
                {detectType(selectedFile.name)}
              </Badge>
            </div>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload & Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Learning Objects Panel ───────────────────────────────────────────────────

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
        <div className="text-center space-y-3">
          <BookOpen className="h-12 w-12 mx-auto text-gray-300" />
          <p className="text-gray-500 text-sm">
            Select a topic from the tree to manage content
          </p>
        </div>
      </div>
    );
  }

  return (
    <LearningObjectsList
      selectedTopic={selectedTopic}
      onUpload={onUpload}
    />
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
  const { data: loData, isLoading } = useLearningObjects(selectedTopic.topicId);
  const items = extractArray(loData);

  return (
    <div className="flex-1 min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <span className="font-medium text-gray-700">{selectedTopic.subjectName}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">{selectedTopic.chapterName}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-indigo-600">{selectedTopic.topicName}</span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Learning Objects
          {!isLoading && items.length > 0 && (
            <span className="ml-1.5 text-gray-400 font-normal">({items.length})</span>
          )}
        </h3>
        <Button size="sm" onClick={onUpload}>
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
                <Skeleton className="h-8 w-8 rounded" />
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
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              No content yet — upload files to get started
            </p>
            <Button size="sm" variant="outline" className="mt-4" onClick={onUpload}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload First File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {items.map((item: any) => {
            const itemId = item.learning_object_id ?? item.id;
            const itemType = item.type ?? item.content_type ?? "document";
            const status = item.status ?? "draft";

            return (
              <motion.div key={itemId} variants={staggerItem}>
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 cursor-grab" />
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-50 flex-shrink-0">
                      {getTypeIcon(itemType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title ?? item.name ?? "Untitled"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {itemType}
                        {item.file_size ? ` \u00B7 ${formatFileSize(item.file_size)}` : ""}
                        {item.created_at ? ` \u00B7 ${formatRelativeTime(item.created_at)}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-transparent text-xs ${
                        status === "published"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
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

// ── Content Tree Sidebar ────────────────────────────────────────────────────

function ContentTree({
  expandedSubjects,
  expandedChapters,
  onToggleSubject,
  onToggleChapter,
  selectedTopicId,
  onSelectTopic,
  onAddChapter,
  onAddTopic,
}: {
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
  const { data: subjectsData, isLoading } = useSubjects();
  const subjects = extractArray(subjectsData);

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        No subjects found. Create subjects in Academic settings first.
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
      {subjects.map((subject: any) => {
        const subjectId = subject.subject_id ?? subject.id;
        const subjectName = subject.subject_name ?? subject.name ?? "Untitled";
        const isExpanded = expandedSubjects.has(subjectId);

        return (
          <motion.div key={subjectId} variants={staggerItem}>
            <div className="group flex items-center gap-1">
              <button
                onClick={() => onToggleSubject(subjectId)}
                className="flex items-center gap-1.5 flex-1 text-left rounded-md px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="truncate">{subjectName}</span>
              </button>
              <button
                onClick={() => onAddChapter(subjectId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100"
                title="Add Chapter"
              >
                + Ch
              </button>
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function ContentManagementPage() {
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

  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [addToSubjectId, setAddToSubjectId] = useState("");
  const [addToChapterId, setAddToChapterId] = useState("");

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

  return (
    <div>
      <PageHeader
        title="Content Management"
        description="Organize subjects, chapters, topics, and learning materials"
      />

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* Left Panel - Content Tree */}
        <div className="w-[280px] flex-shrink-0 rounded-xl border bg-white overflow-y-auto">
          <div className="p-3 border-b">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Content Tree
            </h2>
          </div>
          <ContentTree
            expandedSubjects={expandedSubjects}
            expandedChapters={expandedChapters}
            onToggleSubject={toggleSubject}
            onToggleChapter={toggleChapter}
            selectedTopicId={selectedTopic?.topicId ?? null}
            onSelectTopic={setSelectedTopic}
            onAddChapter={handleAddChapter}
            onAddTopic={handleAddTopic}
          />
        </div>

        {/* Right Panel - Learning Objects */}
        <div className="flex-1 flex flex-col rounded-xl border bg-white p-6">
          <LearningObjectsPanel
            selectedTopic={selectedTopic}
            onUpload={() => setShowUpload(true)}
          />
        </div>
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
