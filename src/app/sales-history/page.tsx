
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History, Eye } from "lucide-react"; // Removed Printer, RotateCcw, CreditCard
import { getSales, returnSale, addPaymentToSale } from '@/services/saleService';
import type { Sale, SaleItem, SalePayment } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { SalesDetailsDialog } from '@/components/dialogs/sales-details-dialog'; // Import new dialog
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
import {
  Dialog,
  DialogContent as AddPaymentDialogContent, // Renamed to avoid conflict
  DialogHeader as AddPaymentDialogHeader,
  DialogTitle as AddPaymentDialogTitle,
  DialogDescription as AddPaymentDialogDescription,
  DialogFooter as AddPaymentDialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const paymentModes = ["Cash", "UPI", "Card", "Other"];

export default function SalesHistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [isReturnConfirmOpen, setIsReturnConfirmOpen] = useState(false);
  const [saleToReturn, setSaleToReturn] = useState<Sale | null>(null);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [saleForNewPayment, setSaleForNewPayment] = useState<Sale | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [newPaymentMode, setNewPaymentMode] = useState<string>(paymentModes[0]);


  const { data: sales, isLoading, error: salesError, isError: isSalesError } = useQuery<Sale[], Error>({
    queryKey: ['salesHistory'],
    queryFn: getSales,
  });

  const returnSaleMutation = useMutation({
    mutationFn: (data: { saleId: string; items: SaleItem[] }) => returnSale(data.saleId, data.items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Success", description: `Sale ID: ${variables.saleId.substring(0,8)}... marked as Returned and stock updated.` });
      setIsReturnConfirmOpen(false);
      setSaleToReturn(null);
      // Refresh details if open
      if (isDetailsDialogOpen && selectedSaleForDetails?.id === variables.saleId) {
          const updatedSale = queryClient.getQueryData<Sale[]>(['salesHistory'])?.find(s => s.id === variables.saleId);
          if (updatedSale) setSelectedSaleForDetails(updatedSale);
          else setIsDetailsDialogOpen(false); // Close if not found (shouldn't happen)
      }
    },
    onError: (error: Error, variables) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to return sale ${variables.saleId.substring(0,8)}...: ${error.message}` });
      setIsReturnConfirmOpen(false);
      setSaleToReturn(null);
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: {
        saleId: string;
        payment: SalePayment;
        currentTotalAmount: number;
        currentAmountReceived: number;
        currentPayments: SalePayment[];
    }) => addPaymentToSale(data.saleId, data.payment, data.currentTotalAmount, data.currentAmountReceived, data.currentPayments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salesHistory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Success", description: `Payment added to Sale ID: ${variables.saleId.substring(0,8)}...` });
      setIsAddPaymentDialogOpen(false);
      setNewPaymentAmount("");
       if (isDetailsDialogOpen && selectedSaleForDetails?.id === variables.saleId) {
          const updatedSale = queryClient.getQueryData<Sale[]>(['salesHistory'])?.find(s => s.id === variables.saleId);
          if (updatedSale) setSelectedSaleForDetails(updatedSale);
          else setIsDetailsDialogOpen(false);
      }
    },
    onError: (error: Error, variables) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add payment to sale ${variables.saleId.substring(0,8)}...: ${error.message}` });
    }
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
    setSelectedSaleForDetails(null); // Close details dialog if open
    setIsDetailsDialogOpen(false);
    setSaleToReturn(sale);
    setIsReturnConfirmOpen(true);
  };

  const handleConfirmReturn = () => {
    if (saleToReturn && saleToReturn.id && saleToReturn.items) {
      returnSaleMutation.mutate({ saleId: saleToReturn.id, items: saleToReturn.items });
    }
  };

  const handleOpenAddPaymentDialog = (sale: Sale) => {
    setSelectedSaleForDetails(null); // Close details dialog if open
    setIsDetailsDialogOpen(false);
    setSaleForNewPayment(sale);
    setNewPaymentAmount( Math.max(0, (sale.totalAmount || 0) - (sale.amountReceived || 0)).toFixed(2) );
    setNewPaymentMode(paymentModes[0]);
    setIsAddPaymentDialogOpen(true);
  };

  const handleConfirmAddPayment = () => {
    if (!saleForNewPayment || !saleForNewPayment.id) return;
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid payment amount." });
      return;
    }
    addPaymentMutation.mutate({
      saleId: saleForNewPayment.id,
      payment: { mode: newPaymentMode, amount },
      currentTotalAmount: saleForNewPayment.totalAmount,
      currentAmountReceived: saleForNewPayment.amountReceived,
      currentPayments: saleForNewPayment.payments
    });
  };

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
                            sale.status === 'Returned' || sale.status === 'Cancelled' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
                            sale.status === 'PendingPayment' ? 'bg-yellow-500 text-yellow-50 hover:bg-yellow-500/90' :
                            sale.status === 'PartiallyPaid' ? 'bg-blue-500 text-blue-50 hover:bg-blue-500/90' : ''
                        }
                      >
                        {sale.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(sale)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SalesDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        sale={selectedSaleForDetails}
        onReprint={handleReprintInvoice}
        onReturnSale={handleOpenReturnDialog}
        onAddPayment={handleOpenAddPaymentDialog}
      />

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

      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <AddPaymentDialogContent className="sm:max-w-md">
            <AddPaymentDialogHeader>
                <AddPaymentDialogTitle>Add Payment for Sale ID: {saleForNewPayment?.id?.substring(0,8)}...</AddPaymentDialogTitle>
                <AddPaymentDialogDescription>
                    Current amount due: ₹{((saleForNewPayment?.totalAmount || 0) - (saleForNewPayment?.amountReceived || 0) > 0 ? ((saleForNewPayment?.totalAmount || 0) - (saleForNewPayment?.amountReceived || 0)).toFixed(2) : '0.00')}
                </AddPaymentDialogDescription>
            </AddPaymentDialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentAmount" className="text-right col-span-1">Amount</Label>
                    <Input
                        id="paymentAmount"
                        type="number"
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentModeAdd" className="text-right col-span-1">Mode</Label>
                    <Select value={newPaymentMode} onValueChange={setNewPaymentMode}>
                        <SelectTrigger id="paymentModeAdd" className="col-span-3">
                            <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentModes.map(mode => (
                                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <AddPaymentDialogFooter>
                <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmAddPayment} disabled={addPaymentMutation.isPending}>
                    {addPaymentMutation.isPending ? "Adding..." : "Add Payment"}
                </Button>
            </AddPaymentDialogFooter>
        </AddPaymentDialogContent>
      </Dialog>
    </div>
  );
}
