
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, UserCircle, ChevronDown, Printer, Save, ChevronsUpDown, Check } from "lucide-react";
import type { ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';
import type { Product } from '@/types';


// Mock Data
const mockCartItems = [
  { id: "1", itemCode: "38671572297", itemName: "Basmati Rice, 1Kg", qty: 1.00, unit: "-", priceUnit: 200.00, discount: 20.00, taxApplied: 0.00, total: 180.00 },
  { id: "2", itemCode: "38645371846", itemName: "Fortune Oil, 1L", qty: 1.00, unit: "-", priceUnit: 113.00, discount: 13.56, taxApplied: 4.97, total: 104.41 },
  { id: "3", itemCode: "3865899396", itemName: "Surf Excel Powder, 3Kg", qty: 1.00, unit: "-", priceUnit: 555.00, discount: 66.60, taxApplied: 0.00, total: 488.40 },
  { id: "4", itemCode: "38678387182", itemName: "Maggi, 4pack", qty: 1.00, unit: "-", priceUnit: 300.00, discount: 36.00, taxApplied: 13.20, total: 277.20 },
];

const mockCustomers = [
  { id: "cust1", name: "Anant Gopakumar", phone: "+91 911234567890" },
  { id: "cust2", name: "John Doe", phone: "+1 5551234567" },
  { id: "cust3", name: "Jane Smith", phone: "+44 2079460958" },
];

const paymentModes = ["Cash", "UPI", "Card", "Other"];

const BillDetailRow = ({ label, value, isBold = false, isNegative = false, currency = "₹" }: { label: string, value: string | number, isBold?: boolean, isNegative?: boolean, currency?: string }) => (
  <div className={`flex justify-between items-center text-sm ${isBold ? 'font-semibold' : ''}`}>
    <span>{label}</span>
    <span className={`${isNegative ? 'text-destructive' : ''} ${isBold ? 'text-base' : ''}`}>
      {isNegative ? '-' : ''}{currency} {typeof value === 'number' ? value.toFixed(2) : value}
    </span>
  </div>
);

export default function SalesPage() {
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedProductForSearch, setSelectedProductForSearch] = React.useState<Product | null>(null);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const subTotal = mockCartItems.reduce((sum, item) => sum + item.priceUnit * item.qty, 0);
  const totalDiscount = mockCartItems.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = mockCartItems.reduce((sum, item) => sum + item.taxApplied, 0);
  const roundOff = -0.01; // Example
  const totalAmount = subTotal - totalDiscount + totalTax + roundOff;
  const totalItems = mockCartItems.length;
  const totalQuantity = mockCartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex flex-col h-screen bg-muted/40 p-4 gap-4">
      {/* Top Bar */}
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" className="bg-background">
          <PlusCircle className="mr-2 h-4 w-4" /> New Bill [Ctrl+T]
        </Button>
        <div className="relative flex-grow">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between pl-10 pr-3 bg-background text-sm text-left font-normal h-9 hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <span className="truncate text-muted-foreground hover:text-muted-foreground">
                  {selectedProductForSearch ? selectedProductForSearch.name : "Press F1 to scan or search by item code, model no or item name"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search product..." />
                <CommandList>
                  <CommandEmpty>No product found.</CommandEmpty>
                  <CommandGroup>
                    {isLoadingProducts ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Loading products...</div>
                    ) : products.length === 0 ? (
                       <div className="p-2 text-center text-sm text-muted-foreground">No products in inventory.</div>
                    ) : (
                      products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={(currentValue) => {
                            const productSelected = products.find(p => p.name.toLowerCase() === currentValue.toLowerCase());
                            setSelectedProductForSearch(productSelected || null);
                            setOpenCombobox(false);
                            if (productSelected) {
                              console.log("Product selected for cart:", productSelected);
                              // TODO: Add product to cart/bill logic here
                              // Example: addProductToCart(productSelected);
                              // For now, we can clear the selectedProductForSearch to allow immediate re-search
                              // or set it and have another mechanism to add to cart
                              // setSelectedProductForSearch(null); // Optional: clear after selection for new search
                            }
                          }}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedProductForSearch?.id === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{product.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground ml-4">
                            <span>Stock: {product.stock}</span>
                            <span className="ml-2">Price: ${product.price.toFixed(2)}</span>
                          </div>
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* Placeholder for window controls if needed */}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left Column: Bill Items Table */}
        <div className="lg:col-span-2 bg-background shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px] px-3 py-2 text-xs">#</TableHead>
                  <TableHead className="px-3 py-2 text-xs">ITEM CODE</TableHead>
                  <TableHead className="px-3 py-2 text-xs">ITEM NAME</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">QTY</TableHead>
                  <TableHead className="text-center px-3 py-2 text-xs">UNIT</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">PRICE/UNIT(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">DISCOUNT(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">TAX APPLIED(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">TOTAL(₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCartItems.map((item, index) => (
                  <TableRow key={item.id} className={index === 3 ? "bg-primary/10 dark:bg-primary/20" : ""}>
                    <TableCell className="px-3 py-2 text-xs">{index + 1}</TableCell>
                    <TableCell className="px-3 py-2 text-xs">{item.itemCode}</TableCell>
                    <TableCell className="px-3 py-2 text-xs font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right px-3 py-2 text-xs">{item.qty.toFixed(2)}</TableCell>
                    <TableCell className="text-center px-3 py-2 text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right px-3 py-2 text-xs">{item.priceUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-2 text-xs">{item.discount.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-2 text-xs">{item.taxApplied.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-2 text-xs font-semibold">{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Column: Details & Payment */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select defaultValue={mockCustomers[0].id}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {mockCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id} className="text-xs">
                      {customer.name} ({customer.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="flex-grow flex flex-col shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 flex-grow">
              <BillDetailRow label="Sub Total:" value={subTotal} />
              <BillDetailRow label="Item Discount:" value={totalDiscount} isNegative />
              <BillDetailRow label="Item Tax:" value={totalTax} />
              <BillDetailRow label="Round Off:" value={Math.abs(roundOff)} isNegative={roundOff < 0} />
              <Separator className="my-2" />
              <div className="flex justify-between items-center text-lg font-bold text-primary mt-2">
                <span>Total Amount <span className="text-xs font-normal text-muted-foreground">(Items: {totalItems}, Qty: {totalQuantity.toFixed(0)})</span></span>
                <span>₹ {totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            
            <div className="px-4 py-3 border-t mt-auto">
                <Label className="text-sm font-medium">Cash/UPI</Label>
                <div className="mt-2 space-y-3">
                    <div className="grid grid-cols-3 items-center gap-2">
                        <Label htmlFor="paymentMode" className="text-xs col-span-1">Payment Mode:</Label>
                        <Select defaultValue="Cash">
                            <SelectTrigger id="paymentMode" className="h-9 text-xs col-span-2">
                            <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                            {paymentModes.map(mode => (
                                <SelectItem key={mode} value={mode} className="text-xs">{mode}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-2">
                        <Label htmlFor="amountReceived" className="text-xs col-span-1">Amount Received:</Label>
                        <div className="relative col-span-2">
                             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input id="amountReceived" type="number" defaultValue={totalAmount.toFixed(2)} className="h-9 pl-6 text-xs text-right" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <Label className="text-xs">Change to Return:</Label>
                        <span className="font-semibold text-base">₹ 0.00</span>
                    </div>
                </div>
            </div>
            <CardFooter className="flex-col gap-2 p-3 border-t">
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Save className="mr-2 h-4 w-4" /> Save & Print Bill [Ctrl+P]
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" className="text-xs h-9">Partial Pay [Ctrl+B]</Button>
                <Button variant="outline" className="text-xs h-9">Multi Pay [Ctrl+M]</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {['Change Quantity [F2]', 'Item Discount [F3]', 'Remove Item [F4]', 'Bill Tax [F7]', 'Additional Charges [F8]', 'Bill Discount [F9]', 'Loyalty Points [F10]', 'Remarks [F12]'].map(label => (
          <Button key={label} variant="outline" className="text-xs h-10 bg-background whitespace-normal text-center leading-tight justify-center">
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
