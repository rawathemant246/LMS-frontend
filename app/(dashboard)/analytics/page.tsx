"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlatformStats, useGrowthData } from "@/hooks/use-dashboard";
import { useTutorAnalytics } from "@/hooks/use-analytics";
import { Building2, Users, MessageSquare, Star, BookOpen, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: growth, isLoading: growthLoading } = useGrowthData();
  const { data: tutor, isLoading: tutorLoading } = useTutorAnalytics();

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Platform-wide analytics, AI tutor usage, and content insights"
      />

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="ai-tutor">AI Tutor</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* Platform Tab */}
        <TabsContent value="platform">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))
              ) : (
                <>
                  <KpiCard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    icon={Users}
                    index={0}
                  />
                  <KpiCard
                    title="Total Schools"
                    value={stats?.total_organizations || 0}
                    icon={Building2}
                    index={1}
                  />
                </>
              )}
            </div>

            <div>
              {growthLoading ? (
                <Skeleton className="h-80 rounded-xl" />
              ) : (
                <GrowthChart data={growth?.monthly || []} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Schools Tab */}
        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle>School-level Analytics</CardTitle>
              <CardDescription>
                Per-school engagement metrics, user activity breakdowns, and license utilisation reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-gray-500">
              School-level analytics coming soon
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Tutor Tab */}
        <TabsContent value="ai-tutor">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tutorLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : (
              <>
                <KpiCard
                  title="Total Sessions"
                  value={tutor?.total_sessions || 0}
                  icon={BarChart3}
                  index={0}
                />
                <KpiCard
                  title="Total Messages"
                  value={tutor?.total_messages || 0}
                  icon={MessageSquare}
                  index={1}
                />
                <KpiCard
                  title="Avg Messages / Session"
                  value={tutor?.avg_messages_per_session || 0}
                  icon={BookOpen}
                  index={2}
                />
                <KpiCard
                  title="Avg Rating"
                  value={tutor?.avg_rating || 0}
                  suffix=" / 5"
                  icon={Star}
                  index={3}
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>
                Track content consumption, completion rates, and learner engagement by topic.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 text-gray-500">
              Content analytics coming soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
