
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, ChevronsUpDown, Check, Trash2, Coins, PieChartIcon, Printer } from "lucide-react"; // Removed Save icon
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';
import { getCustomers } from '@/services/customerService';
import { addSale } from '@/services/saleService';
import { getCompanySettings } from '@/services/settingsService'; // Import settings service
import type { Product, Customer, SalesCartItem, Sale, SaleItem, CompanySettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { triggerPrint } from '@/lib/print-utils';
import { Skeleton } from '@/components/ui/skeleton';


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
  const queryClient = useQueryClient();

  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [selectedProductForSearch, setSelectedProductForSearch] = React.useState<Product | null>(null);
  const [searchValue, setSearchValue] = React.useState("");

  const [cartItems, setCartItems] = React.useState<SalesCartItem[]>([]);
  const [amountReceived, setAmountReceived] = React.useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedPaymentMode, setSelectedPaymentMode] = React.useState<string>(paymentModes[0]);

  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  React.useEffect(() => {
    if (productsError) {
      console.error("[SalesPage] Error fetching products:", productsError);
      toast({ variant: "destructive", title: "Error Loading Products", description: productsError.message });
    }
  }, [productsError, toast]);


  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: getCustomers,
    onSuccess: (data) => {
      if (data && data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(data[0].id!);
      }
    }
  });

  const { data: companySettings, isLoading: isLoadingSettings } = useQuery<CompanySettings | null, Error>({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  const addSaleMutation = useMutation({
    mutationFn: addSale,
    onSuccess: async (savedSale) => {
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      queryClient.invalidateQueries({ queryKey: ['salesHistory'] }); 
      queryClient.invalidateQueries({ queryKey: ['customers']}); 
      toast({ title: "Success", description: `Sale #${savedSale.id?.substring(0,6) || 'N/A'} (Status: ${savedSale.status}) saved successfully.` });
      
      if ((savedSale.status === 'Completed' || savedSale.status === 'PartiallyPaid' || savedSale.totalAmount === 0) && companySettings) {
        await triggerPrint(savedSale, companySettings);
      } else if (!companySettings) {
        toast({variant: "outline", title: "Print Skipped", description: "Company settings not loaded, cannot print invoice."})
      }
      resetBill();
    },
    onError: (error: Error) => {
      console.error("Failed to save sale:", error)
      toast({ variant: "destructive", title: "Error", description: `Failed to save sale: ${error.message}` });
    },
  });

  const calculateItemFields = (item: SalesCartItem): SalesCartItem => {
    const itemSubtotal = item.priceUnit * item.qty;
    const itemTaxableAmount = itemSubtotal; // Tax applied before item discount
    const taxApplied = itemTaxableAmount * (item.taxRate || 0);
    const total = itemSubtotal - item.discount + taxApplied;
    return { ...item, taxApplied, total };
  };

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
          updatedCartItems[existingItemIndex] = calculateItemFields(currentItem);
        } else {
          toast({ title: "Stock Limit Reached", description: `Cannot add more ${product.name}. Available stock: ${product.stock}.`, variant: "destructive" });
        }
        return updatedCartItems;
      } else {
        if (product.id) {
            const newItemBase: Omit<SalesCartItem, 'taxApplied' | 'total'> = {
              productId: product.id,
              itemCode: product.sku || product.id.substring(0, 8).toUpperCase(),
              itemName: product.name,
              description: product.description || '',
              qty: 1,
              unit: product.category === "Consumables" ? "pcs" : "unit", 
              priceUnit: product.price,
              taxRate: product.taxRate || 0,
              discount: 0,
              stock: product.stock,
            };
            const newItem = calculateItemFields(newItemBase as SalesCartItem);
            return [...prevCartItems, newItem];
        }
        toast({variant: "destructive", title: "Error", description: "Product ID is missing."})
        return prevCartItems;
      }
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prevCartItems => prevCartItems.filter(item => item.productId !== productId));
  };

  const handleCartItemChange = (productId: string, field: keyof SalesCartItem, value: string | number) => {
    setCartItems(prevCartItems =>
      prevCartItems.map(item => {
        if (item.productId === productId) {
          let newQty = item.qty;
          let newDiscount = item.discount;

          if (field === 'qty') {
            newQty = parseInt(value as string, 10);
            if (isNaN(newQty)) newQty = 0;
            const productDetails = products.find(p => p.id === productId);
            if (productDetails) {
              if (newQty > productDetails.stock) {
                toast({ title: "Stock Limit Exceeded", description: `Only ${productDetails.stock} units of ${item.itemName} available.`, variant: "destructive"});
                newQty = productDetails.stock;
              } else if (newQty < 0) {
                newQty = 0;
              }
            }
          } else if (field === 'discount') {
            newDiscount = parseFloat(value as string);
            if (isNaN(newDiscount) || newDiscount < 0) newDiscount = 0;
            if (newDiscount > item.priceUnit * newQty) {
              newDiscount = item.priceUnit * newQty;
              toast({title: "Discount Limit", description: "Discount cannot exceed item subtotal.", variant: "outline"});
            }
          }
          
          const updatedItem = { ...item, qty: newQty, discount: newDiscount };
          return calculateItemFields(updatedItem);
        }
        return item;
      })
    );
  };

  const subTotal = cartItems.reduce((sum, item) => sum + item.priceUnit * item.qty, 0);
  const totalItemDiscount = cartItems.reduce((sum, item) => sum + item.discount, 0); 
  const totalTax = cartItems.reduce((sum, item) => sum + (item.taxApplied || 0), 0); 
  const roundOff = 0.00; 
  const totalAmount = subTotal - totalItemDiscount + totalTax + roundOff;
  const totalItems = cartItems.filter(item => item.qty > 0).length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.qty, 0);
  
  const currentAmountReceived = parseFloat(amountReceived || "0");
  const changeToReturn = Math.max(0, currentAmountReceived - totalAmount);
  const balanceDue = Math.max(0, totalAmount - currentAmountReceived);

  React.useEffect(() => {
    if (totalAmount > 0 && amountReceived === "" ) { 
      setAmountReceived(totalAmount.toFixed(2));
    } else if (totalAmount === 0) {
      setAmountReceived(""); 
    }
  }, [totalAmount, amountReceived]); 

  const resetBill = () => {
    setCartItems([]);
    setSelectedProductForSearch(null);
    setSearchValue("");
    setAmountReceived("");
    if (customers && customers.length > 0 && customers[0].id) {
      setSelectedCustomerId(customers[0].id);
    } else {
      setSelectedCustomerId("");
    }
    setSelectedPaymentMode(paymentModes[0]);
  }

  const handleSaveSale = (isPartialPay = false) => {
    if (totalItems === 0) {
      toast({ variant: "destructive", title: "Empty Bill", description: "Cannot save a bill with no billable items." });
      return;
    }
    if (!selectedCustomerId) {
      toast({ variant: "destructive", title: "No Customer", description: "Please select a customer." });
      return;
    }
    if (isPartialPay && currentAmountReceived <=0) {
        toast({ variant: "destructive", title: "No Payment", description: "Enter amount received for partial payment." });
        return;
    }
    if (isPartialPay && currentAmountReceived >= totalAmount) {
        toast({ variant: "outline", title: "Full Payment", description: "Amount received covers total. Use 'Save & Print' for full payment." });
        return;
    }


    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const saleItems: SaleItem[] = cartItems
      .filter(cartItem => cartItem.qty > 0) 
      .map(cartItem => ({
        productId: cartItem.productId,
        itemCode: cartItem.itemCode,
        itemName: cartItem.itemName,
        description: cartItem.description,
        qty: cartItem.qty,
        unit: cartItem.unit,
        priceUnit: cartItem.priceUnit,
        taxRate: cartItem.taxRate,
        taxApplied: cartItem.taxApplied,
        discount: cartItem.discount,
        total: cartItem.total,
    }));

    if (saleItems.length === 0) { 
        toast({ variant: "destructive", title: "Empty Bill", description: "Cannot save a bill with no billable items." });
        return;
    }
    
    const saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleDate' | 'status'> = {
      customerId: selectedCustomerId,
      customerName: selectedCustomer?.name || "Unknown Customer",
      items: saleItems,
      subTotal,
      totalItemDiscount,
      totalTax,
      roundOff,
      totalAmount,
      totalItems, 
      totalQuantity, 
      payments: [{ mode: selectedPaymentMode, amount: currentAmountReceived, paymentDate: new Date().toISOString() }], 
      amountReceived: currentAmountReceived,
      paymentMode: selectedPaymentMode, 
      changeGiven: changeToReturn,
    };
    addSaleMutation.mutate(saleData);
  };
  
  const handleFullPay = () => {
    if (currentAmountReceived < totalAmount && totalAmount > 0) {
      toast({ variant: "destructive", title: "Insufficient Payment", description: "Amount received is less than total amount." });
      return;
    }
    if (isLoadingSettings) {
      toast({variant: "outline", title: "Please wait", description: "Loading company settings for printing."});
      return;
    }
    handleSaveSale(false);
  };

  const handlePartialPay = () => {
     handleSaveSale(true); 
  };

  const handleMultiPay = () => {
    toast({title: "Not Implemented", description: "Multi Pay functionality is not yet implemented."});
  };


  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem)-2rem)] bg-muted/40 p-4 gap-4">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" className="bg-background" onClick={() => {
          resetBill();
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
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search product..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>{isLoadingProducts ? "Loading..." : (productsError ? "Error loading products" : "No product found.")}</CommandEmpty>
                  <CommandGroup>
                    {isLoadingProducts ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">Loading products...</div>
                    ) : products.filter(p => 
                        (p.name && p.name.toLowerCase().includes(searchValue.toLowerCase())) ||
                        (p.sku && p.sku.toLowerCase().includes(searchValue.toLowerCase()))
                      ).length === 0 && searchValue ? (
                       <div className="p-2 text-center text-sm text-muted-foreground">No products match "{searchValue}".</div>
                    ) : products.filter(p => 
                        (p.name && p.name.toLowerCase().includes(searchValue.toLowerCase())) ||
                        (p.sku && p.sku.toLowerCase().includes(searchValue.toLowerCase()))
                      ).map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name} 
                          onSelect={(currentValue) => { 
                            const productSelected = products.find(p => p.name.toLowerCase() === currentValue.toLowerCase());
                            if (productSelected) {
                              handleAddOrUpdateToCart(productSelected);
                              setSelectedProductForSearch(null);
                              setSearchValue("");
                            }
                            setOpenCombobox(false);
                          }}
                          className="flex justify-between items-start text-xs p-2"
                          disabled={product.stock <=0}
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                selectedProductForSearch?.id === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                                <div className="font-medium">{product.name}</div>
                                {product.sku && <div className="text-muted-foreground text-xs">SKU: {product.sku}</div>}
                                {product.description && <div className="text-muted-foreground text-xs truncate max-w-[200px]">{product.description}</div>}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2 text-right shrink-0">
                            {product.stock <= 0 ? <span className="text-destructive">Out of stock</span> : <span>Stock: {product.stock}</span>}
                            <br/>
                            <span>Price: ₹{product.price?.toFixed(2)}</span>
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

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 bg-background shadow-sm rounded-lg overflow-auto flex flex-col">
          <div className="overflow-y-auto flex-grow">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[30px] px-2 py-2 text-xs">#</TableHead>
                  <TableHead className="px-2 py-2 text-xs w-[100px]">ITEM CODE</TableHead>
                  <TableHead className="px-2 py-2 text-xs min-w-[200px]">ITEM NAME / DESC</TableHead>
                  <TableHead className="text-right px-2 py-2 text-xs w-[70px]">QTY</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs w-[50px]">UNIT</TableHead>
                  <TableHead className="text-right px-2 py-2 text-xs w-[90px]">PRICE/UNIT</TableHead>
                  <TableHead className="text-right px-2 py-2 text-xs w-[80px]">DISC(₹)</TableHead>
                  <TableHead className="text-right px-2 py-2 text-xs w-[80px]">TAX(₹)</TableHead>
                  <TableHead className="text-right px-2 py-2 text-xs w-[100px]">TOTAL(₹)</TableHead>
                  <TableHead className="text-right px-1 py-2 text-xs w-[40px]">DEL</TableHead>
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
                  <TableRow key={item.productId} className={item.qty <= 0 ? "opacity-60" : ""}>
                    <TableCell className="px-2 py-1 text-xs">{index + 1}</TableCell>
                    <TableCell className="px-2 py-1 text-xs">{item.itemCode}</TableCell>
                    <TableCell className="px-2 py-1 text-xs">
                        <div className="font-medium">{item.itemName}</div>
                        {item.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{item.description}</div>}
                    </TableCell>
                    <TableCell className="text-right px-2 py-1 text-xs">
                      <Input
                        type="number"
                        value={item.qty.toString()}
                        onChange={(e) => handleCartItemChange(item.productId, 'qty', e.target.value)}
                        min={0} 
                        max={item.stock}
                        className="h-7 w-16 text-xs text-right tabular-nums px-1"
                      />
                    </TableCell>
                    <TableCell className="text-center px-2 py-1 text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right px-2 py-1 text-xs">{item.priceUnit.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-2 py-1 text-xs">
                       <Input
                        type="number"
                        value={item.discount.toString()}
                        onChange={(e) => handleCartItemChange(item.productId, 'discount', e.target.value)}
                        min={0}
                        step="0.01"
                        className="h-7 w-16 text-xs text-right tabular-nums px-1"
                      />
                    </TableCell>
                    <TableCell className="text-right px-2 py-1 text-xs">{(item.taxApplied || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right px-2 py-1 text-xs font-semibold">{item.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right px-1 py-1">
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

        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoadingCustomers ? <Skeleton className="h-9 w-full" /> : (
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} disabled={customers.length === 0}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id!} className="text-xs">
                        {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                      </SelectItem>
                    ))}
                    {customers.length === 0 && <SelectItem value="none" disabled className="text-xs">No customers found</SelectItem>}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className="flex-grow flex flex-col shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 flex-grow">
              <BillDetailRow label="Sub Total:" value={subTotal} />
              <BillDetailRow label="Item Discounts:" value={totalItemDiscount} isNegative />
              <BillDetailRow label="Total Tax:" value={totalTax} />
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
                        <Select value={selectedPaymentMode} onValueChange={setSelectedPaymentMode}>
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
                    {balanceDue > 0 && (
                       <div className="flex justify-between items-center text-sm text-destructive">
                        <Label className="text-xs">Balance Due:</Label>
                        <span className="font-semibold text-base">₹ {balanceDue.toFixed(2)}</span>
                      </div>
                    )}
                    {changeToReturn > 0 && (
                      <div className="flex justify-between items-center text-sm">
                          <Label className="text-xs">Change to Return:</Label>
                          <span className="font-semibold text-base">₹ {changeToReturn.toFixed(2)}</span>
                      </div>
                    )}
                </div>
            </div>
            <CardFooter className="flex-col gap-2 p-3 border-t">
              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                onClick={handleFullPay}
                disabled={addSaleMutation.isPending || totalItems === 0 || !selectedCustomerId || isLoadingSettings}
              >
                {addSaleMutation.isPending ? "Saving..." : (isLoadingSettings ? "Loading Settings..." : <><Printer className="mr-2 h-4 w-4" /> Save & Print Bill [Ctrl+P]</>)}
              </Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" className="text-xs h-9" onClick={handlePartialPay} disabled={addSaleMutation.isPending || currentAmountReceived <=0 || currentAmountReceived >= totalAmount || totalItems === 0 || !selectedCustomerId}>
                   <PieChartIcon className="mr-2 h-3 w-3"/> Partial Pay [Ctrl+B]
                </Button>
                <Button variant="outline" className="text-xs h-9" onClick={handleMultiPay} disabled={addSaleMutation.isPending}>
                   <Coins className="mr-2 h-3 w-3"/> Multi Pay [Ctrl+M]
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

    </div>
  );
}
