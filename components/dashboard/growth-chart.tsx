"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GrowthChartProps {
  data: Array<{ month: string; new_schools: number }>;
}

export function GrowthChart({ data }: GrowthChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    month: new Date(d.month).toLocaleDateString("en-IN", { month: "short" }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">School Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="new_schools" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
