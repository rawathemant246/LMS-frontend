"use client";

import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { usePlatformStats, useRevenueData, useGrowthData } from "@/hooks/use-dashboard";
import { Building2, Users, IndianRupee, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: revenue, isLoading: revenueLoading } = useRevenueData();
  const { data: growth, isLoading: growthLoading } = useGrowthData();

  return (
    <div>
      <PageHeader title="Dashboard" description="Platform overview and analytics" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard title="Total Schools" value={stats?.total_organizations || 0} icon={Building2} delta={12} index={0} />
            <KpiCard title="Total Users" value={stats?.total_users || 0} icon={Users} delta={8} index={1} />
            <KpiCard title="Monthly Revenue" value={revenue?.mrr || 0} prefix="₹" suffix="L" icon={IndianRupee} delta={15} index={2} />
            <KpiCard title="Active Today" value={stats?.active_users_today || 0} icon={UserCheck} delta={5} index={3} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3">
          {revenueLoading ? <Skeleton className="h-96 rounded-xl" /> : <RevenueChart data={revenue?.monthly || []} />}
        </div>
        <div className="lg:col-span-2">
          {growthLoading ? <Skeleton className="h-96 rounded-xl" /> : <GrowthChart data={growth?.monthly || []} />}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          {/* Activity feed placeholder */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <p className="text-gray-500 text-sm">Activity feed coming soon...</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <QuickStats />
        </div>
      </div>
    </div>
  );
}
