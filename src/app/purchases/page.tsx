
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator"; // Added import
import { Calendar as CalendarIcon, PlusCircle, Edit3, Trash2, PackagePlus, PackageSearch, Filter, AlertCircle, Search, ChevronsUpDown, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchases, addPurchase, updatePurchaseStatusAndPayment, deletePurchase } from '@/services/purchaseService';
import { getSuppliers } from '@/services/supplierService';
import { getProducts } from '@/services/productService';
import type { Purchase, PurchaseItem, Supplier, Product, PurchaseStatus, PurchasePaymentStatus } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const purchaseStatuses: PurchaseStatus[] = ['Draft', 'Ordered', 'Partially Received', 'Completed', 'Cancelled'];
const allStatusesFilter = "All Statuses";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string(), // For display
  sku: z.string().optional(),
  qty: z.coerce.number().min(1, "Quantity must be at least 1"),
  costPriceUnit: z.coerce.number().min(0, "Cost price must be non-negative"),
  totalCost: z.coerce.number(), // Calculated client-side
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseOrderNumber: z.string().optional(),
  purchaseDate: z.date({ required_error: "Purchase date is required." }),
  expectedDeliveryDate: z.date().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  subTotal: z.coerce.number(), // Calculated
  shippingCost: z.coerce.number().min(0).optional().default(0),
  otherCharges: z.coerce.number().min(0).optional().default(0),
  totalAmount: z.coerce.number(), // Calculated
  amountPaid: z.coerce.number().min(0).optional().default(0),
  status: z.enum(purchaseStatuses),
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;
type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;

const paymentStatuses: PurchasePaymentStatus[] = ["Unpaid", "PartiallyPaid", "Paid"];

export default function PurchasesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null); // For viewing/updating status, not full edit yet
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [purchaseToDeleteId, setPurchaseToDeleteId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(allStatusesFilter);

  const [openProductSearch, setOpenProductSearch] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");

  // State for Update Status/Payment Dialog
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [currentPurchaseForUpdate, setCurrentPurchaseForUpdate] = useState<Purchase | null>(null);
  const [newStatusForUpdate, setNewStatusForUpdate] = useState<PurchaseStatus>('Ordered');
  const [newAmountPaidForUpdate, setNewAmountPaidForUpdate] = useState<string>("");


  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      purchaseOrderNumber: "",
      purchaseDate: new Date(),
      expectedDeliveryDate: null,
      items: [],
      subTotal: 0,
      shippingCost: 0,
      otherCharges: 0,
      totalAmount: 0,
      amountPaid: 0,
      status: "Draft",
      notes: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { data: purchases = [], isLoading: isLoadingPurchases, error: purchasesError } = useQuery<Purchase[], Error>({
    queryKey: ['purchases'],
    queryFn: getPurchases,
  });

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[], Error>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Watch form fields to calculate totals dynamically
  const watchedItems = form.watch("items");
  const watchedShippingCost = form.watch("shippingCost");
  const watchedOtherCharges = form.watch("otherCharges");

  useEffect(() => {
    const newSubTotal = watchedItems.reduce((acc, item) => acc + (item.qty * item.costPriceUnit), 0);
    form.setValue("subTotal", newSubTotal);
    form.setValue("totalAmount", newSubTotal + (watchedShippingCost || 0) + (watchedOtherCharges || 0));
  }, [watchedItems, watchedShippingCost, watchedOtherCharges, form]);


  const addPurchaseMutation = useMutation({
    mutationFn: (data: { purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'supplierName' | 'paymentStatus'>, items: PurchaseItemFormData[] }) => addPurchase(data.purchaseData, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate products due to stock changes
      toast({ title: "Success", description: "Purchase order created successfully." });
      setIsFormDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to create purchase order: ${error.message}` });
    },
  });

  const updatePurchaseStatusMutation = useMutation({
    mutationFn: (data: { purchaseId: string; status: PurchaseStatus; amountPaid: number; items: PurchaseItem[] }) => 
      updatePurchaseStatusAndPayment(data.purchaseId, data.status, data.amountPaid, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Purchase order updated." });
      setIsUpdateStatusDialogOpen(false);
      setCurrentPurchaseForUpdate(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update purchase order: ${error.message}` });
    }
  });


  const deletePurchaseMutation = useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products']}); // If delete reverses stock
      toast({ title: "Success", description: "Purchase order deleted." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete purchase order: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });


  const onSubmit: SubmitHandler<PurchaseFormData> = (data) => {
    const selectedSupplier = suppliers.find(s => s.id === data.supplierId);
    if (!selectedSupplier) {
      toast({ variant: "destructive", title: "Error", description: "Supplier not found." });
      return;
    }

    const purchaseDataToSave: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'items' | 'supplierName' | 'paymentStatus'> = {
      supplierId: data.supplierId,
      purchaseOrderNumber: data.purchaseOrderNumber,
      purchaseDate: data.purchaseDate.toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate ? data.expectedDeliveryDate.toISOString() : undefined,
      subTotal: data.subTotal,
      shippingCost: data.shippingCost || 0,
      otherCharges: data.otherCharges || 0,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid || 0,
      status: data.status,
      notes: data.notes,
    };
    addPurchaseMutation.mutate({ purchaseData: purchaseDataToSave, items: data.items });
  };

  const handleOpenFormDialog = () => {
    form.reset({ // Reset with defaults for a new PO
      supplierId: "", purchaseOrderNumber: "", purchaseDate: new Date(), expectedDeliveryDate: null, items: [],
      subTotal: 0, shippingCost: 0, otherCharges: 0, totalAmount: 0, amountPaid: 0, status: "Draft", notes: "",
    });
    setPurchaseToEdit(null);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenUpdateStatusDialog = (purchase: Purchase) => {
    setCurrentPurchaseForUpdate(purchase);
    setNewStatusForUpdate(purchase.status);
    setNewAmountPaidForUpdate(purchase.amountPaid.toString());
    setIsUpdateStatusDialogOpen(true);
  };

  const handleConfirmUpdateStatus = () => {
    if (!currentPurchaseForUpdate || !currentPurchaseForUpdate.id) return;
    const amount = parseFloat(newAmountPaidForUpdate);
    if (isNaN(amount) || amount < 0) {
      toast({variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount paid."});
      return;
    }
    if (amount > currentPurchaseForUpdate.totalAmount) {
      toast({variant: "destructive", title: "Overpayment", description: "Amount paid cannot exceed total amount."});
      return;
    }
    updatePurchaseStatusMutation.mutate({
      purchaseId: currentPurchaseForUpdate.id,
      status: newStatusForUpdate,
      amountPaid: amount,
      items: currentPurchaseForUpdate.items // Pass items for potential stock updates
    });
  };


  const handleDeletePurchase = (id: string) => {
    setPurchaseToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (purchaseToDeleteId) {
      const purchase = purchases.find(p => p.id === purchaseToDeleteId);
      // Implement logic to check if stock should be reversed, especially if PO was 'Completed' or 'Ordered'
      // For now, direct delete.
      deletePurchaseMutation.mutate(purchaseToDeleteId);
    }
  };

  const handleAddProductToPO = (product: Product) => {
    const existingItemIndex = fields.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      const currentItem = fields[existingItemIndex];
      update(existingItemIndex, { ...currentItem, qty: currentItem.qty + 1, totalCost: (currentItem.qty + 1) * currentItem.costPriceUnit });
    } else {
      append({
        productId: product.id!,
        productName: product.name,
        sku: product.sku || '',
        qty: 1,
        costPriceUnit: product.price, // Default to product's sale price, user should adjust
        totalCost: product.price, // Initial total cost
      });
    }
    setProductSearchValue("");
    setOpenProductSearch(false);
  };

  const handlePOItemChange = (index: number, field: keyof PurchaseItemFormData, value: string | number) => {
    const item = fields[index];
    let newQty = item.qty;
    let newCostPrice = item.costPriceUnit;

    if (field === 'qty') newQty = Number(value) || 0;
    if (field === 'costPriceUnit') newCostPrice = Number(value) || 0;
    
    update(index, { ...item, [field]: value, totalCost: newQty * newCostPrice });
  };

  const filteredPurchases = useMemo(() => {
    let items = purchases;
    if (selectedStatusFilter !== allStatusesFilter) {
      items = items.filter(po => po.status === selectedStatusFilter);
    }
    if (searchTerm) {
      items = items.filter(po =>
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.purchaseOrderNumber && po.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.id && po.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return items;
  }, [purchases, searchTerm, selectedStatusFilter]);
  
  const getStatusBadgeVariant = (status: PurchaseStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed': return 'default'; // Greenish (accent)
      case 'Ordered': return 'default'; // Bluish (primary)
      case 'Draft': return 'outline';
      case 'Partially Received': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  const getStatusBadgeClass = (status: PurchaseStatus): string => {
    switch (status) {
      case 'Completed': return 'bg-accent text-accent-foreground';
      case 'Ordered': return 'bg-primary/80 text-primary-foreground';
      default: return '';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PurchasePaymentStatus): "default" | "secondary" | "destructive" | "outline" => {
     switch (status) {
      case 'Paid': return 'default'; // Greenish
      case 'PartiallyPaid': return 'outline'; // Yellowish/Orange
      case 'Unpaid': return 'secondary'; // Reddish/Grey
      default: return 'outline';
    }
  };
   const getPaymentStatusBadgeClass = (status: PurchasePaymentStatus): string => {
    switch (status) {
      case 'Paid': return 'bg-accent text-accent-foreground';
      case 'PartiallyPaid': return 'bg-yellow-500 text-yellow-50';
      case 'Unpaid': return 'bg-muted-foreground text-background';
      default: return '';
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <PackagePlus className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Purchase Orders</h1>
        </div>
        <Button onClick={handleOpenFormDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Purchase Order
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>Fill in the details for the new purchase order.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="supplierId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingSuppliers}>
                      <FormControl><SelectTrigger><SelectValue placeholder={isLoadingSuppliers ? "Loading..." : "Select supplier"} /></SelectTrigger></FormControl>
                      <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="purchaseOrderNumber" render={({ field }) => (
                  <FormItem><FormLabel>PO Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., PO-2024-001" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Purchase Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("justify-start text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expectedDeliveryDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Expected Delivery (Optional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("justify-start text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Items</h3>
              <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between text-muted-foreground hover:text-muted-foreground font-normal">
                    {productSearchValue || "Search and add products..."} <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}><CommandInput placeholder="Search product by name or SKU" value={productSearchValue} onValueChange={setProductSearchValue} />
                    <CommandList><CommandEmpty>{isLoadingProducts ? "Loading..." : "No product found."}</CommandEmpty>
                      <CommandGroup>
                        {products.filter(p => (p.name.toLowerCase().includes(productSearchValue.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearchValue.toLowerCase())))).slice(0, 10).map(product => (
                          <CommandItem key={product.id} value={product.name} onSelect={() => handleAddProductToPO(product)} className="cursor-pointer">
                            <Check className={cn("mr-2 h-4 w-4", fields.some(item => item.productId === product.id) ? "opacity-100" : "opacity-0")}/>
                            {product.name} (SKU: {product.sku || 'N/A'}) - Stock: {product.stock}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <div className="space-y-2">
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4"><FormLabel className="text-xs">Product</FormLabel><Input value={item.productName} readOnly className="h-8 text-xs bg-muted"/></div>
                      <div className="col-span-2"><FormLabel className="text-xs">Qty</FormLabel><Input type="number" value={item.qty} onChange={e => handlePOItemChange(index, 'qty', e.target.value)} className="h-8 text-xs"/></div>
                      <div className="col-span-2"><FormLabel className="text-xs">Cost/Unit (₹)</FormLabel><Input type="number" step="0.01" value={item.costPriceUnit} onChange={e => handlePOItemChange(index, 'costPriceUnit', e.target.value)} className="h-8 text-xs"/></div>
                      <div className="col-span-2"><FormLabel className="text-xs">Total (₹)</FormLabel><Input value={(item.qty * item.costPriceUnit).toFixed(2)} readOnly className="h-8 text-xs bg-muted"/></div>
                      <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8 self-end text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                     {form.formState.errors.items?.[index]?.qty && <FormMessage className="text-xs">{form.formState.errors.items[index]?.qty?.message}</FormMessage>}
                     {form.formState.errors.items?.[index]?.costPriceUnit && <FormMessage className="text-xs">{form.formState.errors.items[index]?.costPriceUnit?.message}</FormMessage>}
                  </Card>
                ))}
                 {form.formState.errors.items && typeof form.formState.errors.items === 'object' && !Array.isArray(form.formState.errors.items) && <FormMessage>{(form.formState.errors.items as any).message || "Error with items."}</FormMessage>}
              </div>
              
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 space-y-2">
                  <FormField control={form.control} name="shippingCost" render={({ field }) => (
                    <FormItem className="flex items-center justify-between"><FormLabel>Shipping (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="otherCharges" render={({ field }) => (
                    <FormItem className="flex items-center justify-between"><FormLabel>Other Charges (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <Separator/>
                  <div className="flex items-center justify-between font-semibold"><span>Grand Total (₹)</span><span>{form.getValues("totalAmount").toFixed(2)}</span></div>
                </Card>
                 <Card className="p-4 space-y-2">
                   <FormField control={form.control} name="amountPaid" render={({ field }) => (
                    <FormItem className="flex items-center justify-between"><FormLabel>Amount Paid (₹)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 w-24 text-right"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="flex items-center justify-between"><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{purchaseStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </Card>
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Any internal notes..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addPurchaseMutation.isPending}>
                  {addPurchaseMutation.isPending ? "Saving..." : "Create Purchase Order"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Update PO: {currentPurchaseForUpdate?.id?.substring(0,8)}...</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
             <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="currentTotal" className="text-right col-span-1">Total Amount:</Label>
                <Input id="currentTotal" value={`₹${currentPurchaseForUpdate?.totalAmount.toFixed(2)}`} readOnly className="col-span-2 bg-muted"/>
            </div>
            <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="newAmountPaid" className="text-right col-span-1">Amount Paid:</Label>
                <Input id="newAmountPaid" type="number" value={newAmountPaidForUpdate} onChange={e => setNewAmountPaidForUpdate(e.target.value)} placeholder="0.00" className="col-span-2"/>
            </div>
             <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="newStatus" className="text-right col-span-1">New Status:</Label>
                <Select value={newStatusForUpdate} onValueChange={(value) => setNewStatusForUpdate(value as PurchaseStatus)}>
                    <SelectTrigger id="newStatus" className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>{purchaseStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmUpdateStatus} disabled={updatePurchaseStatusMutation.isPending}>
              {updatePurchaseStatusMutation.isPending ? "Updating..." : "Update PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and might affect stock levels if the PO was completed or ordered.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPurchaseToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deletePurchaseMutation.isPending} className="bg-destructive hover:bg-destructive/90">{deletePurchaseMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-xs">
              <Input placeholder="Search by PO ID, Number, or Supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <PackageSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={allStatusesFilter}>{allStatusesFilter}</SelectItem>
                {purchaseStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPurchases ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => (<div key={i} className="flex items-center space-x-4 p-4 border rounded-md"><Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-2/6" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-8 w-20" /></div>))}</div>
          ) : purchasesError ? (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md"><AlertCircle className="h-5 w-5" /><span>Error: {purchasesError.message}</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>PO Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium text-xs">{po.purchaseOrderNumber || po.id?.substring(0,8)}...</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{format(parseISO(po.purchaseDate), 'PP')}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(po.status)} className={getStatusBadgeClass(po.status)}>{po.status}</Badge></TableCell>
                    <TableCell><Badge variant={getPaymentStatusBadgeVariant(po.paymentStatus)} className={getPaymentStatusBadgeClass(po.paymentStatus)}>{po.paymentStatus}</Badge></TableCell>
                    <TableCell className="text-right">{po.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" title="Update Status/Payment" onClick={() => handleOpenUpdateStatusDialog(po)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete PO" onClick={() => po.id && handleDeletePurchase(po.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No purchase orders found{searchTerm || selectedStatusFilter !== allStatusesFilter ? " matching criteria" : "."}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


    