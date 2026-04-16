"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PlanCard } from "@/components/billing/plan-card";
import { InvoiceTable } from "@/components/billing/invoice-table";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { useBillingPlans, useInvoices, useRevenueStats } from "@/hooks/use-billing";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPage() {
  const { data: plans, isLoading: plansLoading } = useBillingPlans();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices();
  const { data: revenue, isLoading: revenueLoading } = useRevenueStats();

  return (
    <div>
      <PageHeader title="Billing" description="Manage plans, subscriptions, and invoices" />

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plansLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : (plans || []).length === 0 ? (
              <Card><CardContent className="p-6 text-gray-500">No plans configured yet</CardContent></Card>
            ) : (
              (plans || []).map((plan: any) => (
                <PlanCard
                  key={plan.plan_id}
                  name={plan.plan_name}
                  price={plan.price}
                  billingCycle={plan.billing_cycle}
                  maxUsers={plan.max_users}
                  supportLevel={plan.support_level}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-6 text-gray-500">Subscription management coming soon...</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceTable data={invoicesData?.items || []} isLoading={invoicesLoading} />
        </TabsContent>

        <TabsContent value="revenue">
          {revenueLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <RevenueChart data={revenue?.monthly || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
