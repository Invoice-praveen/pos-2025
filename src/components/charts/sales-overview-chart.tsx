'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from 'react';

const initialChartData = [
  { month: "January", sales: 0 },
  { month: "February", sales: 0 },
  { month: "March", sales: 0 },
  { month: "April", sales: 0 },
  { month: "May", sales: 0 },
  { month: "June", sales: 0 },
];

const salesChartConfig: ChartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
};

export function SalesOverviewChart() {
  const [clientChartData, setClientChartData] = useState(initialChartData);

  useEffect(() => {
    setClientChartData([
      { month: "January", sales: Math.floor(Math.random() * 5000) + 1000 },
      { month: "February", sales: Math.floor(Math.random() * 5000) + 1000 },
      { month: "March", sales: Math.floor(Math.random() * 5000) + 1000 },
      { month: "April", sales: Math.floor(Math.random() * 5000) + 1000 },
      { month: "May", sales: Math.floor(Math.random() * 5000) + 1000 },
      { month: "June", sales: Math.floor(Math.random() * 5000) + 1000 },
    ]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Monthly sales performance.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
