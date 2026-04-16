"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import type { Notification } from "@/lib/api-types";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () =>
      api.get<{ data: Notification[] }>(
        "/api/v1/admin/notifications?per_page=50"
      ),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post("/api/v1/admin/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/v1/admin/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });

  const notifications: Notification[] = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Notifications" description="System alerts and updates">
        <Button
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={
                !notif.read_at
                  ? "border-l-4 border-l-brand-primary bg-brand-primary-light/30"
                  : ""
              }
            >
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{notif.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {notif.category}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                </div>
                {!notif.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markRead.mutate(notif.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
