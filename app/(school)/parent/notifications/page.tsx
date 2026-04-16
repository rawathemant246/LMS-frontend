"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { extractArray, formatRelativeTime } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import {
  Bell,
  BellRing,
  Sparkles,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Inbox,
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
// Sub-components
// ---------------------------------------------------------------------------

function PageBanner({ unreadCount }: { unreadCount: number }) {
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Notifications
            </h1>
          </div>
          <p className="text-sm text-white/70 font-medium ml-[52px]">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount !== 1 ? "s" : ""
                }`
              : "You're all caught up"}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
          <Sparkles className="h-4 w-4" />
          <span>Stay Updated</span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTypeInfo(type: string): {
  icon: React.ElementType;
  color: string;
  bgColor: string;
} {
  switch (type.toLowerCase()) {
    case "warning":
    case "alert":
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bgColor: "bg-amber-100",
      };
    case "success":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100",
      };
    case "error":
    case "critical":
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    case "info":
    default:
      return {
        icon: Info,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      };
  }
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ParentNotificationsPage() {
  const { data: notificationsRaw, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => {
    const arr = extractArray(notificationsRaw);
    // Sort newest first
    return [...arr].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at ?? a.date ?? 0).getTime();
      const dateB = new Date(b.created_at ?? b.date ?? 0).getTime();
      return dateB - dateA;
    });
  }, [notificationsRaw]);

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (n: any) => !(n.is_read ?? n.isRead ?? n.read ?? false)
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
      <PageBanner unreadCount={unreadCount} />

      {/* Actions bar */}
      {notifications.length > 0 && unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex items-center justify-between mb-6"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{notifications.length}</span>{" "}
            notification{notifications.length !== 1 ? "s" : ""},{" "}
            <span className="font-semibold text-brand-primary">{unreadCount}</span> unread
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || unreadCount === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark All Read
          </Button>
        </motion.div>
      )}

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 mb-5 shadow-sm">
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-sm">
              Notifications about attendance, grades, fees, and announcements
              will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {notifications.map((n: any) => {
            const id = n.id ?? n.notification_id ?? "";
            const title = n.title ?? n.subject ?? "Notification";
            const body = n.body ?? n.message ?? n.content ?? "";
            const date = n.created_at ?? n.date ?? "";
            const type = n.type ?? n.category ?? "info";
            const isRead = n.is_read ?? n.isRead ?? n.read ?? false;
            const typeInfo = getTypeInfo(type);

            return (
              <motion.div
                key={id}
                variants={fadeSlideUp}
                whileHover={{ x: 4 }}
                className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isRead
                    ? "border-border/40 bg-white/60"
                    : "border-brand-primary/20 bg-white"
                }`}
                onClick={() => !isRead && handleMarkRead(id)}
              >
                {/* Unread indicator */}
                <div className="flex flex-col items-center gap-2 pt-0.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeInfo.bgColor} shadow-sm`}
                  >
                    <typeInfo.icon
                      className={`h-4.5 w-4.5 ${typeInfo.color}`}
                    />
                  </div>
                  {!isRead && (
                    <Circle className="h-2 w-2 fill-brand-primary text-brand-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm truncate ${
                        isRead
                          ? "font-medium text-muted-foreground"
                          : "font-bold text-foreground"
                      }`}
                    >
                      {title}
                    </p>
                    {!isRead && (
                      <BellRing className="h-3 w-3 text-brand-primary shrink-0" />
                    )}
                  </div>
                  {body && (
                    <p
                      className={`text-xs leading-relaxed mt-0.5 line-clamp-2 ${
                        isRead
                          ? "text-muted-foreground/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {body}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                    {date ? formatRelativeTime(date) : ""}
                  </p>
                </div>

                {!isRead && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(id);
                    }}
                    title="Mark as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
