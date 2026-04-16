"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/hooks/use-organizations";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationDetailPage() {
  const params = useParams();
  const orgId = Number(params.id);
  const { data: org, isLoading } = useOrganization(orgId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!org) return <p>Organization not found</p>;

  return (
    <div>
      <PageHeader title={org.organization_name}>
        <Badge variant={org.license_status === "active" ? "default" : "destructive"} className={org.license_status === "active" ? "bg-green-100 text-green-700" : ""}>
          {org.license_status}
        </Badge>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>School Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Organization ID</p>
                  <p className="font-medium">{org.organization_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Status</p>
                  <p className="font-medium capitalize">{org.license_status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{new Date(org.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">User management coming in Phase 2...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Subscription details coming in Phase 2...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Usage metrics coming in Phase 2...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500">Settings coming in Phase 2...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
