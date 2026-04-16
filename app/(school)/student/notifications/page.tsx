"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Framer Motion variants
// ---------------------------------------------------------------------------

const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
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

function getTypeConfig(type: string) {
  const t = (type ?? "").toLowerCase();
  if (t === "warning" || t === "alert") {
    return {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100",
      borderColor: "border-amber-200",
      dot: "bg-amber-500",
    };
  }
  if (t === "success") {
    return {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      borderColor: "border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  // Default: info
  return {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-100",
    borderColor: "border-blue-200",
    dot: "bg-blue-500",
  };
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "just now";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PageBanner({
  unreadCount,
  isLoading,
}: {
  unreadCount: number;
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
              <Bell className="h-5 w-5 text-white" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-48 bg-white/20 rounded-lg" />
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-64 bg-white/20 rounded-lg ml-[52px]" />
          ) : (
            <p className="text-sm text-white/70 font-medium ml-[52px]">
              Stay on top of your school updates
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: any;
  onMarkRead: (id: string) => void;
}) {
  const title =
    notification.title ?? notification.name ?? "Notification";
  const message =
    notification.message ??
    notification.body ??
    notification.content ??
    "";
  const type =
    notification.type ?? notification.notification_type ?? "info";
  const isRead =
    notification.is_read ??
    notification.isRead ??
    notification.read ??
    false;
  const createdAt =
    notification.created_at ??
    notification.createdAt ??
    notification.timestamp ??
    "";
  const notificationId =
    notification.notification_id ?? notification.id ?? "";

  const config = getTypeConfig(type);
  const TypeIcon = config.icon;

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={{ y: -2 }}
      className="cursor-pointer"
      onClick={() => {
        if (!isRead && notificationId) {
          onMarkRead(notificationId);
        }
      }}
    >
      <Card
        className={`border transition-all duration-300 group ${
          isRead
            ? "border-border/40 bg-white"
            : "border-brand-primary/20 bg-brand-primary/[0.02] hover:shadow-lg"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3.5">
            {/* Type icon */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} shadow-sm`}
            >
              <TypeIcon className={`h-5 w-5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {!isRead && (
                  <Circle className="h-2 w-2 fill-brand-primary text-brand-primary shrink-0" />
                )}
                <h3
                  className={`text-sm truncate ${
                    isRead
                      ? "font-medium text-foreground/80"
                      : "font-bold text-foreground"
                  }`}
                >
                  {title}
                </h3>
              </div>

              {message && (
                <p
                  className={`text-xs leading-relaxed line-clamp-2 mt-0.5 ${
                    isRead
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/60">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(createdAt)}</span>
              </div>
            </div>

            {/* Read indicator */}
            {!isRead && (
              <div className="shrink-0 mt-1">
                <span className="flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-brand-primary opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary" />
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StudentNotificationsPage() {
  const { data: notificationsRaw, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => {
    const arr = extractArray(notificationsRaw);
    // Sort newest first
    return arr.sort((a: any, b: any) => {
      const dateA =
        a.created_at ?? a.createdAt ?? a.timestamp ?? "";
      const dateB =
        b.created_at ?? b.createdAt ?? b.timestamp ?? "";
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [notificationsRaw]);

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (n: any) =>
        !(n.is_read ?? n.isRead ?? n.read ?? false)
    ).length;
  }, [notifications]);

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageBanner unreadCount={unreadCount} isLoading={isLoading} />

      {/* Mark All Read button */}
      {!isLoading && unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="rounded-lg text-xs border-border/60"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            {markAllRead.isPending ? "Marking..." : "Mark All Read"}
          </Button>
        </motion.div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-violet-100 mb-4">
              <Bell className="h-8 w-8 text-brand-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">
              All clear!
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You don't have any notifications yet. We'll keep you updated when
              something important happens.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {notifications.map((notification: any, index: number) => (
            <NotificationItem
              key={
                notification.notification_id ?? notification.id ?? index
              }
              notification={notification}
              onMarkRead={handleMarkRead}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
