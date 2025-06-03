
'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History, FileText } from "lucide-react";
import { getSales } from '@/services/saleService';
import type { Sale } from '@/types';
import { Button } from '@/components/ui/button';

export default function SalesHistoryPage() {
  const { data: sales, isLoading, error, isError } = useQuery<Sale[], Error>({
    queryKey: ['salesHistory'],
    queryFn: getSales,
  });

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed':
        return 'default'; // Or 'success' if you add a success variant to Badge
      case 'Pending':
        return 'secondary';
      case 'PartiallyPaid':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Sales History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recorded Sales</CardTitle>
          {/* Add search/filter inputs here in the future */}
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-2/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          )}
          {isError && error && (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading sales history: {error.message}</span>
            </div>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No sales recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium text-xs">{sale.id?.substring(0, 8) || 'N/A'}...</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{format(new Date(sale.saleDate), 'PPpp')}</TableCell>
                    <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sale.status)} className={sale.status === 'Completed' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}>
                        {sale.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details" disabled> {/* TODO: Implement View Details */}
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
