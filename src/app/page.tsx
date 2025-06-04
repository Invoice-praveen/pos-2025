
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Users, AlertCircle, Receipt, Wrench } from "lucide-react";
import { SalesOverviewChart } from '@/components/charts/sales-overview-chart';
import { useQuery } from '@tanstack/react-query';
import { getSales } from '@/services/saleService';
import { getCustomers } from '@/services/customerService';
import { getExpenses } from '@/services/expenseService';
import { getServices } from '@/services/serviceService';
import type { Sale, Customer, Expense, Service } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { format, parseISO, isSameMonth, startOfMonth } from 'date-fns';

export default function DashboardPage() {
  const { data: sales, isLoading: isLoadingSales, error: salesError } = useQuery<Sale[], Error>({
    queryKey: ['salesSummary'], 
    queryFn: getSales,
  });

  const { data: customers, isLoading: isLoadingCustomers, error: customersError } = useQuery<Customer[], Error>({
    queryKey: ['customersSummary'],
    queryFn: getCustomers,
  });

  const { data: expenses, isLoading: isLoadingExpenses, error: expensesError } = useQuery<Expense[], Error>({
    queryKey: ['expensesSummary'],
    queryFn: getExpenses,
  });

  const { data: services, isLoading: isLoadingServices, error: servicesError } = useQuery<Service[], Error>({
    queryKey: ['servicesSummary'],
    queryFn: getServices,
  });

  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let totalSalesCount = 0;
    let totalCustomers = 0;
    let totalMonthlyExpenses = 0;
    let pendingServicesCount = 0;

    if (sales) {
      sales.forEach(sale => {
        if (sale.status === 'Completed' || sale.status === 'PartiallyPaid') {
          totalRevenue += sale.totalAmount;
          totalSalesCount++;
        }
      });
    }

    if (customers) {
      totalCustomers = customers.length;
    }

    if (expenses) {
      const currentDate = new Date();
      expenses.forEach(expense => {
        try {
            const expenseDate = parseISO(expense.expenseDate);
            if (isSameMonth(expenseDate, currentDate)) {
                totalMonthlyExpenses += expense.amount;
            }
        } catch (e) {
            console.warn("Error parsing expense date for dashboard:", expense.expenseDate, e)
        }
      });
    }

    if (services) {
      pendingServicesCount = services.filter(
        service => service.status !== 'Completed' && service.status !== 'Cancelled'
      ).length;
    }

    return { totalRevenue, totalSalesCount, totalCustomers, totalMonthlyExpenses, pendingServicesCount };
  }, [sales, customers, expenses, services]);

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
        {renderStatCard(
          "Monthly Expenses",
          `₹${dashboardStats.totalMonthlyExpenses.toFixed(2)}`,
          `For ${format(new Date(), 'MMMM yyyy')}`,
          <Receipt className="h-4 w-4 text-muted-foreground" />,
          isLoadingExpenses,
          expensesError
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesOverviewChart />
        {renderStatCard(
            "Pending Services",
            `${dashboardStats.pendingServicesCount}`,
            "Services not yet completed",
            <Wrench className="h-4 w-4 text-muted-foreground" />,
            isLoadingServices,
            servicesError
        )}
      </div>
    </div>
  );
}
