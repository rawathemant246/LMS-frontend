"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Megaphone,
  Plus,
  Search,
  Users,
  Building,
  BookOpen,
  Eye,
  Clock,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useTeacherProfile, useMyClasses } from "@/hooks/use-teacher-context";
import { useAnnouncements, useCreateAnnouncement } from "@/hooks/use-announcements";
import { useClasses, useSections } from "@/hooks/use-academic";

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

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const slideInFromTop: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
};

const dialogSpring = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95 },
};

// ---------------------------------------------------------------------------
// Scope badge styles
// ---------------------------------------------------------------------------

const SCOPE_BADGE: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  school: {
    bg: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    text: "School",
    icon: <Building className="h-3 w-3" />,
  },
  class: {
    bg: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    text: "Class",
    icon: <BookOpen className="h-3 w-3" />,
  },
  section: {
    bg: "bg-green-100 text-green-700 hover:bg-green-100",
    text: "Section",
    icon: <Users className="h-3 w-3" />,
  },
};

// ---------------------------------------------------------------------------
// Create Announcement Dialog (teacher-scoped: class & section only)
// ---------------------------------------------------------------------------

function CreateAnnouncementDialog({
  open,
  onOpenChange,
  myClasses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myClasses: any[];
}) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "class" as "class" | "section",
    target_class_id: "",
    target_section_id: "",
    is_published: true,
    requires_ack: false,
  });

  const mutation = useCreateAnnouncement();

  // Derive unique classes from teacher's assignments
  const uniqueClasses = useMemo(() => {
    const seen = new Map<string, any>();
    myClasses.forEach((a: any) => {
      const cid = a.class_id;
      if (cid && !seen.has(cid)) {
        seen.set(cid, {
          id: cid,
          name: a.class_name ?? a.className ?? `Class ${cid}`,
        });
      }
    });
    return Array.from(seen.values());
  }, [myClasses]);

  // Derive sections for the selected class
  const { data: sectionsData } = useSections(form.target_class_id || undefined);
  const allSections: any[] = extractArray(sectionsData);

  // Filter sections to only teacher's assigned ones
  const mySectionIds = useMemo(() => {
    return new Set(
      myClasses
        .filter((a: any) => a.class_id === form.target_class_id)
        .map((a: any) => a.section_id)
        .filter(Boolean),
    );
  }, [myClasses, form.target_class_id]);

  const sections = useMemo(() => {
    if (mySectionIds.size === 0) return allSections;
    return allSections.filter((s: any) => {
      const sid = s.section_id ?? s.id;
      return mySectionIds.has(sid);
    });
  }, [allSections, mySectionIds]);

  const reset = () => {
    setForm({
      title: "",
      body: "",
      scope: "class",
      target_class_id: "",
      target_section_id: "",
      is_published: true,
      requires_ack: false,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const handleScopeChange = (scope: string) => {
    const val = scope as "class" | "section";
    setForm((f) => ({
      ...f,
      scope: val,
      target_section_id: val !== "section" ? "" : f.target_section_id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: form.title,
      body: form.body,
      scope: form.scope,
      is_published: form.is_published,
      requires_ack: form.requires_ack,
      target_class_id: form.target_class_id,
    };
    if (form.scope === "section") {
      payload.target_section_id = form.target_section_id;
    }
    mutation.mutate(payload, {
      onSuccess: () => handleOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <motion.div
          initial={dialogSpring.initial}
          animate={dialogSpring.animate}
          transition={{
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-[#8B5CF6] shadow-sm">
                <Megaphone className="h-4 w-4 text-white" />
              </div>
              New Announcement
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Announcement title"
                required
                className="mt-1"
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="ann-body">Body</Label>
              <Textarea
                id="ann-body"
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                placeholder="Write your announcement here..."
                rows={5}
                required
                className="mt-1"
              />
            </div>

            {/* Scope - only class & section */}
            <div>
              <Label>Scope</Label>
              <div className="flex gap-3 mt-1.5">
                {(["class", "section"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleScopeChange(s)}
                    className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      form.scope === s
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-brand-primary/30 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {s === "class" ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      {s === "class" ? "Class" : "Section"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Class */}
            <div>
              <Label>Target Class</Label>
              <Select
                value={form.target_class_id}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    target_class_id: val ?? "",
                    target_section_id: "",
                  }))
                }
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Section (only for section scope) */}
            {form.scope === "section" && (
              <div>
                <Label>Target Section</Label>
                <Select
                  value={form.target_section_id}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, target_section_id: val ?? "" }))
                  }
                  disabled={!form.target_class_id}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s: any) => (
                      <SelectItem
                        key={s.section_id ?? s.id}
                        value={String(s.section_id ?? s.id)}
                      >
                        {s.section_name ?? s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Publish toggle + Requires Ack */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="ann-published"
                  checked={form.is_published}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_published: !!checked }))
                  }
                />
                <Label
                  htmlFor="ann-published"
                  className="text-sm font-normal cursor-pointer"
                >
                  Publish immediately
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ann-ack"
                  checked={form.requires_ack}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, requires_ack: !!checked }))
                  }
                />
                <Label
                  htmlFor="ann-ack"
                  className="text-sm font-normal cursor-pointer"
                >
                  Require acknowledgment
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-primary to-[#8B5CF6] hover:from-brand-primary/90 hover:to-[#8B5CF6]/90 text-white shadow-sm"
              disabled={mutation.isPending || !form.target_class_id}
            >
              {mutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// View Announcement Dialog
// ---------------------------------------------------------------------------

function ViewAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: any;
}) {
  if (!announcement) return null;

  const scope = announcement.scope ?? "school";
  const scopeStyle = SCOPE_BADGE[scope] ?? SCOPE_BADGE.school;
  const isPublished =
    announcement.is_published ?? announcement.status === "published";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <motion.div
          initial={dialogSpring.initial}
          animate={dialogSpring.animate}
          transition={{
            type: "spring" as const,
            damping: 25,
            stiffness: 300,
          }}
        >
          <DialogHeader>
            <DialogTitle>{announcement.title ?? "Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`border-transparent text-xs flex items-center gap-1 ${scopeStyle.bg}`}
              >
                {scopeStyle.icon}
                {scopeStyle.text}
              </Badge>
              <Badge
                variant="outline"
                className={`border-transparent text-xs ${
                  isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                }`}
              >
                {isPublished ? "Published" : "Draft"}
              </Badge>
              {announcement.requires_ack && (
                <Badge
                  variant="outline"
                  className="border-transparent text-xs bg-gray-100 text-gray-600 hover:bg-gray-100"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ack required
                </Badge>
              )}
            </div>

            {/* Body */}
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {announcement.body ?? "No content"}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {announcement.created_at
                  ? formatRelativeTime(announcement.created_at)
                  : "Unknown date"}
              </div>
              {announcement.ack_count != null && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {announcement.ack_count} acknowledged
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeacherAnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Teacher context
  const { data: teacher } = useTeacherProfile();
  const teacherId = teacher?.id;
  const myClasses = useMyClasses(teacherId);

  // All announcements (includes school-wide)
  const { data: announcementsData, isLoading } = useAnnouncements();
  const announcements = extractArray(announcementsData);

  // Determine which announcements this teacher created
  const teacherAuthId = (teacher as any)?.auth_user_id;

  // Filter announcements
  const filtered = useMemo(() => {
    return announcements.filter((a: any) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const title = (a.title ?? "").toLowerCase();
        const body = (a.body ?? "").toLowerCase();
        if (!title.includes(q) && !body.includes(q)) return false;
      }
      // Scope filter
      if (scopeFilter !== "all") {
        const scope = a.scope ?? "school";
        if (scope !== scopeFilter) return false;
      }
      // Status filter
      if (statusFilter !== "all") {
        const isPublished = a.is_published ?? a.status === "published";
        if (statusFilter === "published" && !isPublished) return false;
        if (statusFilter === "draft" && isPublished) return false;
      }
      return true;
    });
  }, [announcements, search, scopeFilter, statusFilter]);

  const handleCardClick = (announcement: any) => {
    setViewAnnouncement(announcement);
    setShowView(true);
  };

  const isOwnAnnouncement = (a: any) => {
    const creatorId = a.created_by ?? a.creator_id ?? a.auth_user_id;
    return creatorId && creatorId === teacherAuthId;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Gradient Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-[#6366F1] to-[#8B5CF6] p-6 md:p-8 text-white mb-8"
      >
        {/* Mesh overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 80%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px, 80px 80px, 70px 70px",
          }}
        />
        {/* Floating gradient orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-accent/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-lg">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Announcements
              </h1>
              <p className="text-sm text-white/70 font-medium mt-0.5">
                Create and manage announcements for your classes
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/20 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-wrap items-center gap-3 mb-6"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="pl-9"
          />
        </div>
        <Select
          value={scopeFilter}
          onValueChange={(val) => setScopeFilter(val ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="class">Class</SelectItem>
            <SelectItem value="section">Section</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Card list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-[#8B5CF6]/10 mx-auto mb-4">
                <Megaphone className="h-8 w-8 text-brand-primary/50" />
              </div>
              <p className="text-sm font-semibold text-gray-600">
                No announcements found
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {search || scopeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first announcement to share updates with your classes"}
              </p>
              {!search && scopeFilter === "all" && statusFilter === "all" && (
                <Button
                  size="sm"
                  className="mt-4 bg-gradient-to-r from-brand-primary to-[#8B5CF6] text-white shadow-sm"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Announcement
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <AnimatePresence>
            {filtered.map((announcement: any, index: number) => {
              const id =
                announcement.announcement_id ?? announcement.id ?? index;
              const scope = announcement.scope ?? "school";
              const scopeStyle = SCOPE_BADGE[scope] ?? SCOPE_BADGE.school;
              const isPublished =
                announcement.is_published ??
                announcement.status === "published";
              const isSchoolWide = scope === "school";
              const isOwn = isOwnAnnouncement(announcement);

              return (
                <motion.div
                  key={id}
                  variants={index === 0 ? slideInFromTop : fadeSlideUp}
                  layout
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`cursor-pointer border transition-all duration-300 hover:shadow-md ${
                      isSchoolWide
                        ? "border-blue-100/80 bg-gradient-to-r from-blue-50/40 to-white"
                        : "border-border/60 bg-white hover:border-brand-primary/20"
                    }`}
                    onClick={() => handleCardClick(announcement)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {announcement.title ?? "Untitled"}
                          </h3>

                          {/* Body preview */}
                          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {announcement.body ?? ""}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {/* Scope badge */}
                            <Badge
                              variant="outline"
                              className={`border-transparent text-xs flex items-center gap-1 ${scopeStyle.bg}`}
                            >
                              {scopeStyle.icon}
                              {scopeStyle.text}
                            </Badge>

                            {/* Published / Draft badge */}
                            <Badge
                              variant="outline"
                              className={`border-transparent text-xs ${
                                isPublished
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }`}
                            >
                              {isPublished ? "Published" : "Draft"}
                            </Badge>

                            {/* Ack count badge */}
                            {announcement.requires_ack && (
                              <Badge
                                variant="outline"
                                className="border-transparent text-xs bg-gray-100 text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                {announcement.ack_count ?? 0} ack
                              </Badge>
                            )}

                            {/* Timestamp */}
                            {announcement.created_at && (
                              <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(announcement.created_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit/Delete for own, read-only label for school-wide */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          {isSchoolWide && !isOwn && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-50 text-blue-500 border-blue-200 hover:bg-blue-50"
                            >
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                              Read-only
                            </Badge>
                          )}
                          {isOwn && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-brand-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit could be implemented
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete could be implemented
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <CreateAnnouncementDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        myClasses={myClasses}
      />
      <ViewAnnouncementDialog
        open={showView}
        onOpenChange={(isOpen) => {
          setShowView(isOpen);
          if (!isOpen) setViewAnnouncement(null);
        }}
        announcement={viewAnnouncement}
      />
    </div>
  );
}
