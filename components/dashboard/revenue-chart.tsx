"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    month: new Date(d.month).toLocaleDateString("en-IN", { month: "short" }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fill="url(#revenueGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
