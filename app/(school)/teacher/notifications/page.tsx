"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";

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

const fadeOut = {
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

// ---------------------------------------------------------------------------
// Type icon mapping
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    dotColor: string;
  }
> = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    dotColor: "bg-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    dotColor: "bg-amber-500",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    dotColor: "bg-emerald-500",
  },
  default: {
    icon: MessageSquare,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    dotColor: "bg-indigo-500",
  },
};

function getTypeConfig(type?: string) {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  return TYPE_CONFIG.default;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeacherNotificationsPage() {
  const { data: notificationsData, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => {
    const items = extractArray(notificationsData);
    // Sort newest first
    return [...items].sort((a: any, b: any) => {
      const dateA = a.created_at ?? a.createdAt ?? "";
      const dateB = b.created_at ?? b.createdAt ?? "";
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [notificationsData]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (n: any) => !(n.is_read ?? n.isRead ?? n.read ?? false),
      ).length,
    [notifications],
  );

  const handleNotificationClick = (notification: any) => {
    const isRead = notification.is_read ?? notification.isRead ?? notification.read ?? false;
    if (!isRead) {
      const id = notification.notification_id ?? notification.id;
      if (id) markRead.mutate(String(id));
    }
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
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Notifications
                </h1>
                {!isLoading && unreadCount > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-bold px-2.5 py-0.5">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-sm text-white/70 font-medium mt-0.5">
                Stay updated with important alerts and messages
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white border border-white/20 shadow-lg"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {markAllRead.isPending ? "Marking..." : "Mark All Read"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/10 to-[#8B5CF6]/10 mx-auto mb-5">
                <BellOff className="h-10 w-10 text-brand-primary/40" />
              </div>
              <p className="text-base font-semibold text-gray-600">
                No notifications yet
              </p>
              <p className="text-sm text-gray-400 mt-1.5 max-w-sm mx-auto">
                You will see important updates, alerts, and messages here
              </p>
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
          <AnimatePresence mode="popLayout">
            {notifications.map((notification: any, index: number) => {
              const id =
                notification.notification_id ?? notification.id ?? index;
              const isRead =
                notification.is_read ??
                notification.isRead ??
                notification.read ??
                false;
              const type =
                notification.type ??
                notification.notification_type ??
                "default";
              const config = getTypeConfig(type);
              const IconComponent = config.icon;

              return (
                <motion.div
                  key={id}
                  variants={fadeSlideUp}
                  exit={fadeOut.exit}
                  layout
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`cursor-pointer border transition-all duration-300 hover:shadow-md ${
                      isRead
                        ? "border-border/60 bg-white"
                        : "border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 via-white to-white shadow-sm"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Type icon */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bgColor} shadow-sm`}
                        >
                          <IconComponent
                            className={`h-5 w-5 ${config.color}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`text-sm truncate ${
                                isRead
                                  ? "font-medium text-gray-700"
                                  : "font-bold text-gray-900"
                              }`}
                            >
                              {notification.title ?? "Notification"}
                            </h3>
                            {/* Unread dot */}
                            {!isRead && (
                              <span className="flex h-2 w-2 shrink-0">
                                <span
                                  className={`absolute inline-flex h-2 w-2 animate-ping rounded-full ${config.dotColor} opacity-40`}
                                />
                                <span
                                  className={`relative inline-flex h-2 w-2 rounded-full ${config.dotColor}`}
                                />
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-sm mt-1 leading-relaxed line-clamp-2 ${
                              isRead ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {notification.message ??
                              notification.body ??
                              ""}
                          </p>

                          {/* Timestamp */}
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            {(notification.created_at ??
                              notification.createdAt) &&
                              formatRelativeTime(
                                notification.created_at ??
                                  notification.createdAt,
                              )}
                          </p>
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
    </div>
  );
}
