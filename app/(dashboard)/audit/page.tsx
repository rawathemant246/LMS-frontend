"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit", "logs"],
    queryFn: () => api.get<any>("/auth/api/v1/audit/logs"),
  });

  const logs: any[] = data?.items ?? (Array.isArray(data) ? data : []);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions"
      />

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-gray-500 py-8"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log.log_id}>
                  <TableCell className="text-sm text-gray-500">
                    {formatRelativeTime(log.action_timestamp)}
                  </TableCell>
                  <TableCell className="text-sm">
                    User #{log.user_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {log.affected_table || "—"}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-gray-400">
                    {log.ip_address || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
