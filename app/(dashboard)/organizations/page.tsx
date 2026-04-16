"use client";

import { PageHeader } from "@/components/layout/page-header";
import { OrgTable } from "@/components/organizations/org-table";
import { CreateOrgDialog } from "@/components/organizations/create-org-dialog";
import { useOrganizations } from "@/hooks/use-organizations";

export default function OrganizationsPage() {
  const { data, isLoading } = useOrganizations();

  return (
    <div>
      <PageHeader title="Organizations" description="Manage all schools on the platform">
        <CreateOrgDialog />
      </PageHeader>
      <OrgTable data={data || []} isLoading={isLoading} />
    </div>
  );
}
