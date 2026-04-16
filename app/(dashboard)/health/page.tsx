"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function useServiceHealth(name: string, url: string) {
  return useQuery({
    queryKey: ["health", name],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}${url}`);
        return res.ok;
      } catch {
        return false;
      }
    },
    refetchInterval: 30000,
  });
}

function ServiceStatusCard({
  name,
  url,
  description,
}: {
  name: string;
  url: string;
  description: string;
}) {
  const { data: isHealthy, isLoading } = useServiceHealth(name, url);
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        ) : isHealthy ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : (
          <XCircle className="h-8 w-8 text-red-500" />
        )}
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-500">{description}</p>
          <p
            className={`text-xs font-medium mt-1 ${
              isLoading
                ? "text-gray-400"
                : isHealthy
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {isLoading ? "Checking..." : isHealthy ? "Healthy" : "Unreachable"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const SERVICES = [
  {
    name: "Auth Service",
    url: "/auth/api/healthz",
    description: "Authentication & RBAC",
  },
  {
    name: "LMS Backend",
    url: "/lms/healthz",
    description: "Core LMS APIs",
  },
  {
    name: "AI Service",
    url: "/ai/healthz",
    description: "AI Tutor & Content Gen",
  },
];

export default function HealthPage() {
  return (
    <div>
      <PageHeader
        title="System Health"
        description="Monitor service status and infrastructure"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {SERVICES.map((svc) => (
          <ServiceStatusCard
            key={svc.name}
            name={svc.name}
            url={svc.url}
            description={svc.description}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafana Dashboards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm mb-4">
            Detailed metrics and dashboards are available in Grafana. Connect
            your Monitoring_Alerting_microservice stack for full observability.
          </p>
          <div className="rounded-lg border bg-gray-50 p-8 text-center text-gray-400">
            Grafana embed will appear here once configured
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
