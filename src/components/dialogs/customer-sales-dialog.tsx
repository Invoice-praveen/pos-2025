
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ShoppingBag } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { getSalesByCustomerId } from '@/services/saleService';
import type { Sale } from '@/types';
import { format } from 'date-fns';

interface CustomerSalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onViewSaleDetailsRequest?: (sale: Sale) => void; // Callback to request opening main details dialog
}

export function CustomerSalesDialog({ open, onOpenChange, customerId, customerName, onViewSaleDetailsRequest }: CustomerSalesDialogProps) {
  const { data: sales, isLoading, error } = useQuery<Sale[], Error>({
    queryKey: ['customerSales', customerId],
    queryFn: () => getSalesByCustomerId(customerId),
    enabled: !!customerId && open, 
  });

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed': return 'default';
      case 'PendingPayment': return 'secondary';
      case 'PartiallyPaid': return 'outline';
      case 'Cancelled': return 'destructive';
      case 'Returned': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSaleIdClick = (sale: Sale) => {
    if (onViewSaleDetailsRequest) {
      onViewSaleDetailsRequest(sale);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Sales History for {customerName}
          </DialogTitle>
          <DialogDescription>
            Showing all recorded sales for this customer. Click an ID to view full details.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          )}
          {error && (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading sales: {error.message}</span>
            </div>
          )}
          {!isLoading && !error && (
            sales && sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell 
                        className="font-medium text-xs hover:underline cursor-pointer text-primary"
                        onClick={() => handleSaleIdClick(sale)}
                      >
                        {sale.id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{format(new Date(sale.saleDate), 'PP')}</TableCell>
                      <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(sale.status)}  className={
                            sale.status === 'Completed' ? 'bg-accent text-accent-foreground hover:bg-accent/90' :
                            sale.status === 'Returned' || sale.status === 'Cancelled' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
                            sale.status === 'PendingPayment' ? 'bg-yellow-500 text-yellow-50 hover:bg-yellow-500/90' :
                            sale.status === 'PartiallyPaid' ? 'bg-blue-500 text-blue-50 hover:bg-blue-500/90' : ''
                        }>
                          {sale.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No sales found for this customer.</p>
            )
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
