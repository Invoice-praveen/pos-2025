
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, BarChart3, AlertCircle } from "lucide-react";
import { SalesOverviewChart } from '@/components/charts/sales-overview-chart';
import { useQuery } from '@tanstack/react-query';
import { getSales } from '@/services/saleService';
import { getCustomers } from '@/services/customerService';
import type { Sale, Customer } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

export default function DashboardPage() {
  const { data: sales, isLoading: isLoadingSales, error: salesError } = useQuery<Sale[], Error>({
    queryKey: ['salesSummary'], // Different key from sales history to avoid conflicts if filters change
    queryFn: getSales,
  });

  const { data: customers, isLoading: isLoadingCustomers, error: customersError } = useQuery<Customer[], Error>({
    queryKey: ['customersSummary'],
    queryFn: getCustomers,
  });

  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let totalSalesCount = 0;
    let totalCustomers = 0;

    if (sales) {
      sales.forEach(sale => {
        // Consider only completed or paid sales for revenue and count
        if (sale.status === 'Completed' || sale.status === 'PartiallyPaid') {
          totalRevenue += sale.totalAmount;
          totalSalesCount++;
        }
      });
    }

    if (customers) {
      totalCustomers = customers.length;
    }

    return { totalRevenue, totalSalesCount, totalCustomers };
  }, [sales, customers]);

  const renderStatCard = (title: string, value: string | number, subtext: string, icon: React.ReactNode, isLoading?: boolean, error?: Error | null) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </>
        ) : error ? (
          <div className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Error loading
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
          "Total Revenue", 
          `₹${dashboardStats.totalRevenue.toFixed(2)}`, 
          "From completed/paid sales", 
          <DollarSign className="h-4 w-4 text-muted-foreground" />,
          isLoadingSales,
          salesError
        )}
        {renderStatCard(
          "Total Sales", 
          `+${dashboardStats.totalSalesCount}`, 
          "Completed/paid transactions", 
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
          isLoadingSales,
          salesError
        )}
        {renderStatCard(
          "Total Customers", 
          `+${dashboardStats.totalCustomers}`, 
          "Registered customers", 
          <Users className="h-4 w-4 text-muted-foreground" />,
          isLoadingCustomers,
          customersError
        )}
        <Card> {/* Placeholder for Top Product */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Product</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Product X</div>
            <p className="text-xs text-muted-foreground">Most sold item this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesOverviewChart /> {/* Remains with random data for now */}
        <Card> {/* Placeholder for Recent Activity */}
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <span>Sale #1203 - Product Y</span>
                <span className="font-medium text-green-600">+$49.99</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>New Customer: John Doe</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>Stock Update: Product Z (10 units added)</span>
                <span className="text-muted-foreground">5 hours ago</span>
              </li>
              <li className="flex items-center justify-between text-sm">
                <span>Sale #1202 - Product X</span>
                <span className="font-medium text-green-600">+$99.00</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
