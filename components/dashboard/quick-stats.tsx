import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, AlertTriangle, Brain, CheckCircle } from "lucide-react";

export function QuickStats() {
  const stats = [
    { label: "Open Tickets", value: "12", icon: LifeBuoy, color: "text-blue-600" },
    { label: "Overdue Invoices", value: "3", icon: AlertTriangle, color: "text-red-600" },
    { label: "AI Sessions Today", value: "247", icon: Brain, color: "text-purple-600" },
    { label: "System Uptime", value: "99.9%", icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
