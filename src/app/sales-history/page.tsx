
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History, FileText, Printer, RotateCcw, Eye, ShoppingBag } from "lucide-react";
import { getSales, returnSale } from '@/services/saleService';
import type { Sale, SaleItem } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

export default function SalesHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null);

  const { data: sales, isLoading, error: salesError, isError: isSalesError } = useQuery<Sale[], Error>({
    queryKey: ['salesHistory'],
    queryFn: getSales,
  });

  const returnSaleMutation = useMutation({
    mutationFn: (data: { saleId: string; items: SaleItem[] }) => returnSale(data.saleId, data.items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // To update stock if viewed elsewhere
      toast({ title: "Success", description: `Sale ID: ${variables.saleId.substring(0,8)}... marked as Returned and stock updated.` });
      setIsReturnConfirmOpen(false);
      setSaleToReturn(null);
    },
    onError: (error: Error, variables) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to return sale ${variables.saleId.substring(0,8)}...: ${error.message}` });
      setIsReturnConfirmOpen(false);
      setSaleToReturn(null);
    },
  });

  const handleViewDetails = (sale: Sale) => {
    setSelectedSaleForDetails(sale);
    setIsDetailsDialogOpen(true);
  };

  const handleReprintInvoice = (saleId?: string) => {
    toast({ title: "Print Simulated", description: `Invoice for Sale ID: ${saleId?.substring(0,8) || 'N/A'}... sent to printer (simulated).` });
  };

  const handleOpenReturnDialog = (sale: Sale) => {
    if (sale.status === 'Returned') {
      toast({variant: "outline", title: "Already Returned", description: "This sale has already been marked as returned."});
      return;
    }
    setSaleToReturn(sale);
    setIsReturnConfirmOpen(true);
  };

  const handleConfirmReturn = () => {
    if (saleToReturn && saleToReturn.id && saleToReturn.items) {
      returnSaleMutation.mutate({ saleId: saleToReturn.id, items: saleToReturn.items });
    }
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed':
        return 'default'; 
      case 'Pending':
        return 'secondary';
      case 'PartiallyPaid':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      case 'Returned':
        return 'destructive'; // Or a specific color like orange/yellow
      default:
        return 'outline';
    }
  };
  
  const renderDetailRow = (label: string, value: string | number | ReactNode, isAmount = false) => (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={isAmount ? 'font-semibold' : ''}>{isAmount && typeof value === 'number' ? `₹${value.toFixed(2)}` : value}</span>
    </div>
  );


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <History className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Sales History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recorded Sales</CardTitle>
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
          {isSalesError && salesError && (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md bg-destructive/10">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading sales history: {salesError.message}</span>
            </div>
          )}
          {!isLoading && !isSalesError && (
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
                      <Badge 
                        variant={getStatusVariant(sale.status)} 
                        className={
                            sale.status === 'Completed' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 
                            sale.status === 'Returned' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
                        }
                      >
                        {sale.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(sale)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                       <Button variant="ghost" size="icon" title="Return Bill" onClick={() => handleOpenReturnDialog(sale)} disabled={sale.status === 'Returned'}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sale Details (ID: {selectedSaleForDetails?.id?.substring(0, 8)}...)</DialogTitle>
            <DialogDescription>
              Detailed information for the selected sale.
            </DialogDescription>
          </DialogHeader>
          {selectedSaleForDetails && (
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Customer &amp; Date</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {renderDetailRow("Customer", selectedSaleForDetails.customerName)}
                  {renderDetailRow("Sale Date", format(new Date(selectedSaleForDetails.saleDate), 'PPpp'))}
                  {renderDetailRow("Status", <Badge variant={getStatusVariant(selectedSaleForDetails.status)} className={selectedSaleForDetails.status === 'Completed' ? 'bg-accent text-accent-foreground' : selectedSaleForDetails.status === 'Returned' ? 'bg-destructive text-destructive-foreground' : ''}>{selectedSaleForDetails.status || 'Unknown'}</Badge>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Items Sold ({selectedSaleForDetails.totalItems})</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSaleForDetails.items.map((item, index) => (
                    <div key={index} className="py-2 border-b last:border-b-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.itemName}</span>
                        <span className="font-semibold">₹{item.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.qty} {item.unit} x ₹{item.priceUnit.toFixed(2)}
                        {item.discount > 0 && ` (Disc: ₹${item.discount.toFixed(2)})`}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                   <CardTitle className="text-base">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {renderDetailRow("Sub Total", selectedSaleForDetails.subTotal, true)}
                  {selectedSaleForDetails.totalDiscount > 0 && renderDetailRow("Total Discount", -selectedSaleForDetails.totalDiscount, true)}
                  {selectedSaleForDetails.totalTax > 0 && renderDetailRow("Total Tax", selectedSaleForDetails.totalTax, true)}
                  {selectedSaleForDetails.roundOff !== 0 && renderDetailRow("Round Off", selectedSaleForDetails.roundOff, true)}
                  <Separator className="my-2" />
                  {renderDetailRow("Grand Total", selectedSaleForDetails.totalAmount, true)}
                  <Separator className="my-2" />
                  {selectedSaleForDetails.payments.map((p, i) => (
                     renderDetailRow(`Paid (${p.mode})`, p.amount, true)
                  ))}
                  {renderDetailRow("Amount Received", selectedSaleForDetails.amountReceived, true)}
                  {selectedSaleForDetails.changeGiven > 0 && renderDetailRow("Change Given", selectedSaleForDetails.changeGiven, true)}
                  {selectedSaleForDetails.notes && renderDetailRow("Notes", selectedSaleForDetails.notes)}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleReprintInvoice(selectedSaleForDetails?.id)}>
              <Printer className="mr-2 h-4 w-4" /> Re-print Invoice
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Bill Confirmation Dialog */}
      <AlertDialog open={isReturnConfirmOpen} onOpenChange={setIsReturnConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this sale (ID: {saleToReturn?.id?.substring(0,8)}...) as "Returned"? 
              This action will update the sale status and increment the stock for all items in this sale. This cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToReturn(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReturn}
              disabled={returnSaleMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {returnSaleMutation.isPending ? "Processing Return..." : "Confirm Return"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
