"use client";

import { useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { extractArray } from "@/lib/utils";
import { useStudentProfile } from "@/hooks/use-student-context";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useUserStore } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Megaphone,
  Search,
  Filter,
  Globe,
  Users,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
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

const SCOPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  school: {
    label: "School",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: Globe,
  },
  class: {
    label: "Class",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: Users,
  },
  section: {
    label: "Section",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    icon: BookOpen,
  },
};

function getScopeConfig(scope: string) {
  return (
    SCOPE_CONFIG[scope?.toLowerCase()] ??
    SCOPE_CONFIG["school"]
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Announcements
              </h1>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Stay updated with school, class, and section announcements
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function AnnouncementCard({
  announcement,
  onView,
}: {
  announcement: any;
  onView: (a: any) => void;
}) {
  const title =
    announcement.title ?? announcement.name ?? "Announcement";
  const body =
    announcement.body ?? announcement.content ?? announcement.message ?? "";
  const scope = (
    announcement.scope ??
    announcement.target_scope ??
    announcement.targetScope ??
    "school"
  ).toLowerCase();
  const publishedAt =
    announcement.published_at ??
    announcement.publishedAt ??
    announcement.created_at ??
    announcement.createdAt ??
    "";
  const scopeConfig = getScopeConfig(scope);
  const ScopeIcon = scopeConfig.icon;

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -3 }}
      className="cursor-pointer"
      onClick={() => onView(announcement)}
    >
      <Card className="border border-border/60 bg-white hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground group-hover:text-brand-primary transition-colors duration-200 truncate">
                {title}
              </h3>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 border-transparent text-[10px] px-2 ${scopeConfig.bg} ${scopeConfig.color}`}
            >
              <ScopeIcon className="h-3 w-3 mr-1" />
              {scopeConfig.label}
            </Badge>
          </div>

          {body && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {body}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <CalendarDays className="h-3 w-3" />
              <span>{formatDate(publishedAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Eye className="h-3 w-3" />
              <span className="font-medium">View</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ViewDialog({
  announcement,
  open,
  onOpenChange,
}: {
  announcement: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useUserStore((s) => s.user);
  const userId = (user as any)?.user_id ?? (user as any)?.id ?? (user as any)?.username;
  const [acking, setAcking] = useState(false);
  const [acked, setAcked] = useState(false);

  if (!announcement) return null;

  const title =
    announcement.title ?? announcement.name ?? "Announcement";
  const body =
    announcement.body ?? announcement.content ?? announcement.message ?? "";
  const scope = (
    announcement.scope ??
    announcement.target_scope ??
    announcement.targetScope ??
    "school"
  ).toLowerCase();
  const publishedAt =
    announcement.published_at ??
    announcement.publishedAt ??
    announcement.created_at ??
    announcement.createdAt ??
    "";
  const requiresAck =
    announcement.requires_ack ??
    announcement.requiresAck ??
    announcement.requires_acknowledgement ??
    false;
  const announcementId =
    announcement.announcement_id ?? announcement.id ?? "";
  const scopeConfig = getScopeConfig(scope);
  const ScopeIcon = scopeConfig.icon;

  const handleAcknowledge = async () => {
    if (!announcementId || !userId) return;
    setAcking(true);
    try {
      await api.post(`/api/v1/announcements/${announcementId}/ack`, {
        user_id: userId,
      });
      toast.success("Acknowledgement recorded");
      setAcked(true);
    } catch {
      toast.error("Failed to acknowledge. Please try again.");
    } finally {
      setAcking(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setAcked(false);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`border-transparent text-[10px] px-2 ${scopeConfig.bg} ${scopeConfig.color}`}
            >
              <ScopeIcon className="h-3 w-3 mr-1" />
              {scopeConfig.label}
            </Badge>
            {publishedAt && (
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(publishedAt)}
              </span>
            )}
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed max-h-[50vh] overflow-y-auto">
          {body || "No additional details."}
        </DialogDescription>

        {requiresAck && (
          <DialogFooter>
            {acked ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Acknowledged
              </div>
            ) : (
              <Button
                onClick={handleAcknowledge}
                disabled={acking}
                className="bg-brand-primary hover:bg-brand-primary/90"
              >
                {acking ? "Acknowledging..." : "Acknowledge"}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentAnnouncementsPage() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const { isLoading: studentLoading } = useStudentProfile();
  const { data: announcementsRaw, isLoading: announcementsLoading } =
    useAnnouncements();

  const announcements = useMemo(
    () => extractArray(announcementsRaw),
    [announcementsRaw]
  );

  const filtered = useMemo(() => {
    return announcements.filter((a: any) => {
      const title = (
        a.title ??
        a.name ??
        ""
      ).toLowerCase();
      const body = (
        a.body ??
        a.content ??
        a.message ??
        ""
      ).toLowerCase();
      const scope = (
        a.scope ??
        a.target_scope ??
        a.targetScope ??
        "school"
      ).toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search.toLowerCase()) ||
        body.includes(search.toLowerCase());

      const matchesScope =
        scopeFilter === "all" || scope === scopeFilter;

      return matchesSearch && matchesScope;
    });
  }, [announcements, search, scopeFilter]);

  const isLoading = studentLoading || announcementsLoading;

  const handleView = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setDialogOpen(true);
  };

  const scopes = ["all", "school", "class", "section"];

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner isLoading={isLoading} />

      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {scopes.map((scope) => {
            const isActive = scopeFilter === scope;
            return (
              <Button
                key={scope}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setScopeFilter(scope)}
                className={`rounded-lg text-xs capitalize ${
                  isActive
                    ? "bg-brand-primary hover:bg-brand-primary/90 text-white"
                    : "border-border/60"
                }`}
              >
                {scope}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
              <Megaphone className="h-8 w-8 text-brand-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              No announcements found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search || scopeFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No announcements have been posted yet. Check back later!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filtered.map((announcement: any, index: number) => (
            <AnnouncementCard
              key={
                announcement.announcement_id ?? announcement.id ?? index
              }
              announcement={announcement}
              onView={handleView}
            />
          ))}
        </motion.div>
      )}

      {/* View Dialog */}
      <ViewDialog
        announcement={selectedAnnouncement}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
