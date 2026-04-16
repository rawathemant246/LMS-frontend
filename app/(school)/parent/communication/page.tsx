"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractArray, formatDate, formatRelativeTime } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  useParentProfile,
  useParentChildren,
} from "@/hooks/use-parent-context";
import { useAnnouncements } from "@/hooks/use-announcements";
import { toast } from "sonner";
import {
  Megaphone,
  Users,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Bell,
  Globe,
  BookOpen,
  AlertTriangle,
  Info,
  Pin,
  Send,
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
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Communication
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              School announcements and teacher messaging
            </p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Stay Connected</span>
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

function getPriorityIcon(priority: string) {
  switch (priority.toLowerCase()) {
    case "urgent":
    case "high":
      return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-100" };
    case "normal":
    case "medium":
      return { icon: Info, color: "text-blue-500", bg: "bg-blue-100" };
    default:
      return { icon: Bell, color: "text-gray-500", bg: "bg-gray-100" };
  }
}

function getScopeIcon(scope: string) {
  switch (scope.toLowerCase()) {
    case "school":
      return Globe;
    case "class":
    case "section":
      return BookOpen;
    default:
      return Megaphone;
  }
}

// ---------------------------------------------------------------------------
// Announcements Tab
// ---------------------------------------------------------------------------

function AnnouncementsTab({
  selectedChild,
  isLoading,
}: {
  selectedChild: any;
  isLoading: boolean;
}) {
  const { data: announcementsRaw, isLoading: annLoading } = useAnnouncements();
  const allAnnouncements = useMemo(
    () => extractArray(announcementsRaw),
    [announcementsRaw]
  );

  const qc = useQueryClient();
  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/v1/announcements/${id}/acknowledge`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Acknowledged");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Filter by child's class/section scope
  const childClassId =
    selectedChild?.class_id ?? selectedChild?.classId ?? "";
  const childSectionId =
    selectedChild?.section_id ?? selectedChild?.sectionId ?? "";

  const filtered = useMemo(() => {
    return allAnnouncements
      .filter((a: any) => {
        const scope = (a.scope ?? a.target ?? "").toLowerCase();
        const targetClassId = a.class_id ?? a.classId ?? "";
        const targetSectionId = a.section_id ?? a.sectionId ?? "";

        // School-wide announcements always show
        if (scope === "school" || scope === "all" || !scope) return true;
        // Class scoped
        if (
          scope === "class" &&
          targetClassId &&
          childClassId &&
          targetClassId === childClassId
        )
          return true;
        // Section scoped
        if (
          scope === "section" &&
          targetSectionId &&
          childSectionId &&
          targetSectionId === childSectionId
        )
          return true;
        // If no specific target, show
        if (!targetClassId && !targetSectionId) return true;
        return false;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at ?? a.date ?? 0).getTime();
        const dateB = new Date(b.created_at ?? b.date ?? 0).getTime();
        // Pinned first, then newest
        const pinnedA = a.is_pinned ?? a.pinned ? 1 : 0;
        const pinnedB = b.is_pinned ?? b.pinned ? 1 : 0;
        if (pinnedA !== pinnedB) return pinnedB - pinnedA;
        return dateB - dateA;
      });
  }, [allAnnouncements, childClassId, childSectionId]);

  const loading = isLoading || annLoading;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-semibold text-muted-foreground">
            No announcements
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
            School and class announcements will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {filtered.map((ann: any) => {
        const id = ann.id ?? ann.announcement_id ?? "";
        const title = ann.title ?? ann.subject ?? "Announcement";
        const body = ann.body ?? ann.content ?? ann.message ?? "";
        const date = ann.created_at ?? ann.date ?? ann.published_at ?? "";
        const priority = ann.priority ?? "normal";
        const scope = ann.scope ?? ann.target ?? "school";
        const isPinned = ann.is_pinned ?? ann.pinned ?? false;
        const requiresAck = ann.requires_ack ?? ann.requiresAck ?? false;
        const isAcked = ann.acknowledged ?? ann.is_acknowledged ?? false;
        const author =
          ann.author_name ?? ann.authorName ?? ann.created_by ?? "";

        const priorityInfo = getPriorityIcon(priority);
        const ScopeIcon = getScopeIcon(scope);

        return (
          <motion.div
            key={id}
            variants={fadeSlideUp}
            whileHover={{ x: 4 }}
            className="rounded-xl border border-border/60 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${priorityInfo.bg} shadow-sm`}
              >
                <priorityInfo.icon
                  className={`h-5 w-5 ${priorityInfo.color}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isPinned && (
                    <Pin className="h-3 w-3 text-amber-500 -rotate-45" />
                  )}
                  <p className="text-sm font-bold text-foreground truncate">
                    {title}
                  </p>
                </div>

                {body && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-2">
                    {body}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <ScopeIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground capitalize">
                      {scope}
                    </span>
                  </div>
                  {author && (
                    <span className="text-[10px] text-muted-foreground">
                      by {author}
                    </span>
                  )}
                  {date && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(date)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge
                  className={`text-[10px] font-bold ${
                    priority === "urgent" || priority === "high"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {priority}
                </Badge>

                {requiresAck && !isAcked && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="gap-1 text-[10px]"
                    onClick={() => acknowledgeMutation.mutate(id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Acknowledge
                  </Button>
                )}

                {requiresAck && isAcked && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold">Acknowledged</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Messages Tab (Placeholder)
// ---------------------------------------------------------------------------

function MessagesTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 mb-6 shadow-sm">
            <MessageSquare className="h-10 w-10 text-indigo-500" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2">
            Teacher Messaging Coming Soon
          </h3>

          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            You&apos;ll be able to communicate directly with your child&apos;s
            teachers here. Stay tuned for real-time messaging, appointment
            scheduling, and more.
          </p>

          <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground/60">
            <Send className="h-3.5 w-3.5" />
            <span>Direct messaging with class teachers</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ParentCommunicationPage() {
  const { data: parent, isLoading: parentLoading } = useParentProfile();
  const parentId = parent?.id;
  const { data: childrenRaw, isLoading: childrenLoading } =
    useParentChildren(parentId);
  const children = useMemo(() => extractArray(childrenRaw), [childrenRaw]);

  const [selectedChildId, setSelectedChildId] = useState<string>("");

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(
        String(children[0].student_id ?? children[0].id ?? "")
      );
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find(
    (c: any) => String(c.student_id ?? c.id ?? "") === selectedChildId
  );

  const isLoading = parentLoading || childrenLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelect={(v) => v && setSelectedChildId(v)}
      />

      <Tabs defaultValue="announcements" className="space-y-6">
        <TabsList variant="line" className="w-full justify-start border-b border-border/40 pb-px">
          <TabsTrigger value="announcements" className="gap-1.5 px-4">
            <Megaphone className="h-3.5 w-3.5" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1.5 px-4">
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <AnnouncementsTab
            selectedChild={selectedChild}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
