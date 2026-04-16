"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/lib/api-types";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import Link from "next/link";

interface OrgTableProps {
  data: Organization[];
  isLoading: boolean;
}

export function OrgTable({ data, isLoading }: OrgTableProps) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((org) =>
    org.organization_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((org) => (
                <TableRow key={org.organization_id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <Link href={`/dashboard/organizations/${org.organization_id}`} className="font-medium text-brand-primary hover:underline">
                      {org.organization_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.license_status === "active" ? "default" : "destructive"} className={org.license_status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {org.license_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{formatDate(org.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
