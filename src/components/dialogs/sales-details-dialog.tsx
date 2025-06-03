
'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, CreditCard, RotateCcw } from "lucide-react";
import type { Sale, SalePayment } from '@/types';
import { format } from 'date-fns';

interface SalesDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onReprint?: (saleId: string) => void;
  onReturnSale?: (sale: Sale) => void;
  onAddPayment?: (sale: Sale) => void;
}

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

const renderDetailRow = (label: string, value: string | number | ReactNode, isAmount = false, currency = "₹") => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className={isAmount ? 'font-semibold' : ''}>{isAmount && typeof value === 'number' ? `${currency}${Number(value).toFixed(2)}` : value}</span>
  </div>
);

export function SalesDetailsDialog({
  open,
  onOpenChange,
  sale,
  onReprint,
  onReturnSale,
  onAddPayment,
}: SalesDetailsDialogProps) {
  if (!sale) return null;

  const canReturn = sale.status !== 'Returned' && sale.status !== 'Cancelled' && !!onReturnSale;
  const canAddPayment = (sale.status === 'PendingPayment' || sale.status === 'PartiallyPaid') && !!onAddPayment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sale Details (ID: {sale.id?.substring(0, 8)}...)</DialogTitle>
          <DialogDescription>
            Detailed information for the selected sale.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customer &amp; Date</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {renderDetailRow("Customer", sale.customerName)}
              {renderDetailRow("Sale Date", format(new Date(sale.saleDate), 'PPpp'))}
              {renderDetailRow("Status", <Badge variant={getStatusVariant(sale.status)} className={
                  sale.status === 'Completed' ? 'bg-accent text-accent-foreground' :
                  sale.status === 'Returned' || sale.status === 'Cancelled' ? 'bg-destructive text-destructive-foreground' :
                  sale.status === 'PendingPayment' ? 'bg-yellow-500 text-yellow-50' :
                  sale.status === 'PartiallyPaid' ? 'bg-blue-500 text-blue-50' : ''
                }>{sale.status || 'Unknown'}</Badge>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items Sold ({sale.totalItems})</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.items.map((item, index) => (
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
              {renderDetailRow("Sub Total", sale.subTotal, true)}
              {sale.totalDiscount > 0 && renderDetailRow("Total Discount", -sale.totalDiscount, true)}
              {sale.totalTax > 0 && renderDetailRow("Total Tax", sale.totalTax, true)}
              {sale.roundOff !== 0 && renderDetailRow("Round Off", sale.roundOff, true)}
              <Separator className="my-2" />
              {renderDetailRow("Grand Total", sale.totalAmount, true)}
              <Separator className="my-2" />
              <div className="text-xs text-muted-foreground font-medium">Payments Made:</div>
              {sale.payments.map((p, i) => (
                 renderDetailRow(
                  `${p.mode} ${p.paymentDate ? `(${format(new Date(p.paymentDate), 'dd/MM/yy p')})` : '(N/A)'}`,
                  p.amount, true
                 )
              ))}
              <Separator className="my-1" />
              {renderDetailRow("Total Amount Received", sale.amountReceived, true)}
              {sale.amountReceived < sale.totalAmount && sale.status !== 'Returned' && sale.status !== 'Cancelled' && (
                 renderDetailRow("Balance Due", sale.totalAmount - sale.amountReceived, true)
              )}
              {sale.changeGiven > 0 && renderDetailRow("Change Given", sale.changeGiven, true)}
              {sale.notes && renderDetailRow("Notes", sale.notes)}
            </CardContent>
            {(canAddPayment || canReturn) && (
                <CardFooter className="flex-col gap-2">
                    {canAddPayment && (
                        <Button onClick={() => onAddPayment && onAddPayment(sale)} className="w-full">
                            <CreditCard className="mr-2 h-4 w-4" /> Add Payment
                        </Button>
                    )}
                    {canReturn && (
                         <Button onClick={() => onReturnSale && onReturnSale(sale)} variant="outline" className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" /> Return Bill
                        </Button>
                    )}
                </CardFooter>
            )}
          </Card>
        </div>
        <DialogFooter>
          {onReprint && (
            <Button variant="outline" onClick={() => onReprint(sale.id!)}>
              <Printer className="mr-2 h-4 w-4" /> Re-print Invoice
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

