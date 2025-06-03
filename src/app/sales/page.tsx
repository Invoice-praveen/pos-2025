
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, ChevronsUpDown, Check, Trash2, Save } from "lucide-react";
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
import { useToast } from '@/hooks/use-toast';

interface SalesCartItem {
  productId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  priceUnit: number;
  discount: number;
  taxApplied: number;
  total: number;
  stock: number;
}

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
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedProductForSearch, setSelectedProductForSearch] = React.useState<Product | null>(null);
  const [searchValue, setSearchValue] = React.useState("");

  const [cartItems, setCartItems] = React.useState<SalesCartItem[]>([]);
  const [amountReceived, setAmountReceived] = React.useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>(mockCustomers[0].id);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const handleAddOrUpdateToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Out of Stock", description: `${product.name} is currently out of stock.`, variant: "destructive" });
      return;
    }

    setCartItems(prevCartItems => {
      const existingItemIndex = prevCartItems.findIndex(item => item.productId === product.id);
      if (existingItemIndex > -1) {
        const updatedCartItems = [...prevCartItems];
        const currentItem = updatedCartItems[existingItemIndex];
        if (currentItem.qty < product.stock) {
          currentItem.qty += 1;
          currentItem.total = currentItem.qty * currentItem.priceUnit; // Basic total, no discount/tax yet
        } else {
          toast({ title: "Stock Limit Reached", description: `Cannot add more ${product.name}. Available stock: ${product.stock}.`, variant: "destructive" });
        }
        return updatedCartItems;
      } else {
        const newItem: SalesCartItem = {
          productId: product.id!,
          itemCode: product.id!.substring(0, 8).toUpperCase(), // Example item code
          itemName: product.name,
          qty: 1,
          unit: "-",
          priceUnit: product.price,
          discount: 0, // Placeholder
          taxApplied: 0, // Placeholder
          total: product.price, // Basic total
          stock: product.stock,
        };
        return [...prevCartItems, newItem];
      }
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prevCartItems => prevCartItems.filter(item => item.productId !== productId));
  };

  const handleQuantityChange = (productId: string, newQty: number) => {
    setCartItems(prevCartItems =>
      prevCartItems.map(item => {
        if (item.productId === productId) {
          const productDetails = products.find(p => p.id === productId);
          if (productDetails) {
            if (newQty > 0 && newQty <= productDetails.stock) {
              return { ...item, qty: newQty, total: newQty * item.priceUnit };
            } else if (newQty > productDetails.stock) {
              toast({ title: "Stock Limit Exceeded", description: `Only ${productDetails.stock} units of ${item.itemName} available.`, variant: "destructive"});
              return { ...item, qty: productDetails.stock, total: productDetails.stock * item.priceUnit };
            } else if (newQty <= 0) {
              // Optionally remove item if qty is 0 or less, or just keep it at 1
              // For now, let's prevent going below 1 via input. Removal is separate.
              return { ...item, qty: 1, total: 1 * item.priceUnit };
            }
          }
        }
        return item;
      })
    );
  };


  const subTotal = cartItems.reduce((sum, item) => sum + item.priceUnit * item.qty, 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + item.discount, 0); // Placeholder
  const totalTax = cartItems.reduce((sum, item) => sum + item.taxApplied, 0); // Placeholder
  const roundOff = 0.00; // Example, can be dynamic later
  const totalAmount = subTotal - totalDiscount + totalTax + roundOff;
  const totalItems = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);
  
  const changeToReturn = Math.max(0, parseFloat(amountReceived || "0") - totalAmount);

  React.useEffect(() => {
    if (totalAmount > 0) {
      setAmountReceived(totalAmount.toFixed(2));
    } else {
      setAmountReceived("");
    }
  }, [totalAmount]);


  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)] bg-muted/40 p-4 gap-4">
      {/* Top Bar */}
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" className="bg-background" onClick={() => {
          setCartItems([]);
          setSelectedProductForSearch(null);
          setSearchValue("");
          setAmountReceived("");
          toast({title: "New Bill Created", description: "Cart has been cleared."})
        }}>
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
              <Command shouldFilter={false}> {/* Manual filtering via searchValue */}
                <CommandInput 
                  placeholder="Search product..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>{isLoadingProducts ? "Loading..." : "No product found."}</CommandEmpty>
                  <CommandGroup>
                    {isLoadingProducts ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Loading products...</div>
                    ) : products.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase())).length === 0 && searchValue ? (
                       <div className="p-2 text-center text-sm text-muted-foreground">No products match "{searchValue}".</div>
                    ) : products.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase())).map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={(currentValue) => {
                            const productSelected = products.find(p => p.name.toLowerCase() === currentValue.toLowerCase());
                            if (productSelected) {
                              handleAddOrUpdateToCart(productSelected);
                              setSelectedProductForSearch(null); // Clear selection display
                              setSearchValue(""); // Clear search input
                            }
                            setOpenCombobox(false);
                          }}
                          className="flex justify-between items-center"
                          disabled={product.stock <=0}
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
                            {product.stock <= 0 ? <span className="text-destructive">Out of stock</span> : <span>Stock: {product.stock}</span>}
                            <span className="ml-2">Price: ₹{product.price.toFixed(2)}</span>
                          </div>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left Column: Bill Items Table */}
        <div className="lg:col-span-2 bg-background shadow-sm rounded-lg overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-grow">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px] px-3 py-2 text-xs">#</TableHead>
                  <TableHead className="px-3 py-2 text-xs">ITEM CODE</TableHead>
                  <TableHead className="px-3 py-2 text-xs">ITEM NAME</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs w-[80px]">QTY</TableHead>
                  <TableHead className="text-center px-3 py-2 text-xs">UNIT</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">PRICE/UNIT(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">DISC(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">TAX(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs">TOTAL(₹)</TableHead>
                  <TableHead className="text-right px-3 py-2 text-xs w-[50px]">DEL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-4">
                      Cart is empty. Add products using the search bar above.
                    </TableCell>
                  </TableRow>
                )}
                {cartItems.map((item, index) => (
                  <TableRow key={item.productId}>
                    <TableCell className="px-3 py-1.5 text-xs">{index + 1}</TableCell>
                    <TableCell className="px-3 py-1.5 text-xs">{item.itemCode}</TableCell>
                    <TableCell className="px-3 py-1.5 text-xs font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right px-3 py-1.5 text-xs">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value, 10))}
                        min={1}
                        max={item.stock}
                        className="h-7 w-16 text-xs text-right tabular-nums"
                      />
                    </TableCell>
                    <TableCell className="text-center px-3 py-1.5 text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right px-3 py-1.5 text-xs">{item.priceUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-1.5 text-xs">{item.discount.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-1.5 text-xs">{item.taxApplied.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-3 py-1.5 text-xs font-semibold">{item.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-1 py-1.5">
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveFromCart(item.productId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                    </TableCell>
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
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
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
                <Label className="text-sm font-medium">Payment Details</Label>
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
                            <Input 
                              id="amountReceived" 
                              type="number" 
                              value={amountReceived}
                              onChange={(e) => setAmountReceived(e.target.value)}
                              placeholder={totalAmount.toFixed(2)}
                              className="h-9 pl-6 text-xs text-right" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <Label className="text-xs">Change to Return:</Label>
                        <span className="font-semibold text-base">₹ {changeToReturn.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <CardFooter className="flex-col gap-2 p-3 border-t">
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={cartItems.length === 0}>
                <Save className="mr-2 h-4 w-4" /> Save & Print Bill [Ctrl+P]
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" className="text-xs h-9" disabled>Partial Pay [Ctrl+B]</Button>
                <Button variant="outline" className="text-xs h-9" disabled>Multi Pay [Ctrl+M]</Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {['Change Quantity [F2]', 'Item Discount [F3]', 'Remove Item [F4]', 'Bill Tax [F7]', 'Additional Charges [F8]', 'Bill Discount [F9]', 'Loyalty Points [F10]', 'Remarks [F12]'].map(label => (
          <Button key={label} variant="outline" className="text-xs h-10 bg-background whitespace-normal text-center leading-tight justify-center" disabled>
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

