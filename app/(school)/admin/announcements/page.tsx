"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import { useAnnouncements, useCreateAnnouncement } from "@/hooks/use-announcements";
import { useAcademicYears, useClasses, useSections } from "@/hooks/use-academic";

// ── Animation variants ──────────────────────────────────────────────────────

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const slideInFromTop = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
};

const dialogSpring = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data?.items) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.items) return data.items;
  return [];
}

const SCOPE_BADGE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
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

// ── Create Announcement Dialog ──────────────────────────────────────────────

function CreateAnnouncementDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "school",
    target_class_id: "",
    target_section_id: "",
    is_published: true,
    requires_ack: false,
  });

  const mutation = useCreateAnnouncement();

  // Academic data for conditional selectors
  const { data: yearsData } = useAcademicYears();
  const years: any[] = extractArray(yearsData);
  const [selectedYearId, setSelectedYearId] = useState("");

  const { data: classesData } = useClasses(selectedYearId || undefined);
  const classes: any[] = extractArray(classesData);

  const { data: sectionsData } = useSections(form.target_class_id || undefined);
  const sections: any[] = extractArray(sectionsData);

  const reset = () => {
    setForm({
      title: "",
      body: "",
      scope: "school",
      target_class_id: "",
      target_section_id: "",
      is_published: true,
      requires_ack: false,
    });
    setSelectedYearId("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const handleScopeChange = (scope: string | null) => {
    const val = scope ?? "school";
    setForm((f) => ({
      ...f,
      scope: val,
      target_class_id: val === "school" ? "" : f.target_class_id,
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
    };
    if (form.scope === "class" || form.scope === "section") {
      payload.target_class_id = form.target_class_id;
    }
    if (form.scope === "section") {
      payload.target_section_id = form.target_section_id;
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <motion.div
          initial={dialogSpring.initial}
          animate={dialogSpring.animate}
          transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
        >
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            {/* Title */}
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title"
                required
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="ann-body">Body</Label>
              <Textarea
                id="ann-body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your announcement here..."
                rows={6}
                required
              />
            </div>

            {/* Scope */}
            <div>
              <Label>Scope</Label>
              <Select value={form.scope} onValueChange={handleScopeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School-wide</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year (shown for class/section scope) */}
            {(form.scope === "class" || form.scope === "section") && (
              <div>
                <Label>Academic Year</Label>
                <Select
                  value={selectedYearId}
                  onValueChange={(val) => {
                    setSelectedYearId(val ?? "");
                    setForm((f) => ({ ...f, target_class_id: "", target_section_id: "" }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y: any) => (
                      <SelectItem
                        key={y.academic_year_id ?? y.id}
                        value={String(y.academic_year_id ?? y.id)}
                      >
                        {y.label ?? y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Class (shown for class/section scope) */}
            {(form.scope === "class" || form.scope === "section") && (
              <div>
                <Label>Target Class</Label>
                <Select
                  value={form.target_class_id}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, target_class_id: val ?? "", target_section_id: "" }))
                  }
                  disabled={!selectedYearId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c: any) => (
                      <SelectItem
                        key={c.class_id ?? c.id}
                        value={String(c.class_id ?? c.id)}
                      >
                        {c.class_name ?? c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Section (shown only for section scope) */}
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
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="ann-published" className="text-sm font-normal cursor-pointer">
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
                <Label htmlFor="ann-ack" className="text-sm font-normal cursor-pointer">
                  Require acknowledgment
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ── View Announcement Dialog ────────────────────────────────────────────────

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
  const isPublished = announcement.is_published ?? announcement.status === "published";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <motion.div
          initial={dialogSpring.initial}
          animate={dialogSpring.animate}
          transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: announcementsData, isLoading } = useAnnouncements();
  const announcements = extractArray(announcementsData);

  // Filter announcements
  const filtered = useMemo(() => {
    return announcements.filter((a: any) => {
      // Search filter
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

  return (
    <div>
      <PageHeader title="Announcements">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="pl-9"
          />
        </div>
        <Select value={scopeFilter} onValueChange={(val) => setScopeFilter(val ?? "all")}>
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
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No announcements yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first announcement to get started
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <AnimatePresence>
            {filtered.map((announcement: any, index: number) => {
              const id = announcement.announcement_id ?? announcement.id ?? index;
              const scope = announcement.scope ?? "school";
              const scopeStyle = SCOPE_BADGE[scope] ?? SCOPE_BADGE.school;
              const isPublished =
                announcement.is_published ?? announcement.status === "published";

              return (
                <motion.div
                  key={id}
                  variants={index === 0 ? slideInFromTop : staggerItem}
                  layout
                >
                  <Card
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => handleCardClick(announcement)}
                  >
                    <CardContent className="p-5">
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 text-sm">
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
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialogs */}
      <CreateAnnouncementDialog open={showCreate} onOpenChange={setShowCreate} />
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
