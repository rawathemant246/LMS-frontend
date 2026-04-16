"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAdminUsers } from "@/hooks/use-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  teacher: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  student: "bg-green-100 text-green-700 hover:bg-green-100",
  parent: "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

function RoleBadge({ role }: { role: string }) {
  const colorClass = ROLE_COLORS[role?.toLowerCase()] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return (
    <Badge variant="outline" className={`border-transparent capitalize ${colorClass}`}>
      {role}
    </Badge>
  );
}

function StatusDot({ status }: { status: string }) {
  const isActive = status?.toLowerCase() === "active";
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}
      />
      <span className={`text-sm ${isActive ? "text-green-700" : "text-red-600"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    </span>
  );
}

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useAdminUsers(
    debouncedSearch || undefined,
    role || undefined
  );

  const users: any[] = Array.isArray(data)
    ? data
    : (data as any)?.items ?? (data as any)?.users ?? [];

  return (
    <div>
      <PageHeader title="Users" description="All platform users across schools" />

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={role} onValueChange={(val) => setRole(val == null || val === "all" ? "" : val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const fullName =
                  user.first_name || user.last_name
                    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                    : user.username ?? "—";
                return (
                  <TableRow key={user.user_id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell className="text-gray-500">{user.email ?? "—"}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role ?? user.role_name ?? "—"} />
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {user.organization_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusDot status={user.status ?? ""} />
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {user.last_login ? formatDate(user.last_login) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
