
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, PackageSearch, Filter, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct, updateProduct, deleteProduct } from '@/services/productService';
import type { Product } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productCategories = ["All Categories", "Appliances", "Brewing Gear", "Consumables", "Accessories", "Other"];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required").refine(val => productCategories.slice(1).includes(val), { message: "Invalid category" }),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  image: z.string().url("Must be a valid URL for image").optional().or(z.literal('')),
  hint: z.string().max(20, "Hint too long (max 2 words)").optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(), // e.g., 0.05 for 5%
});

type ProductFormData = z.infer<typeof productSchema>;

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(productCategories[0]);


  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", sku: "", description: "", category: "", price: 0, stock: 0, image: "", hint: "", taxRate: 0,
    },
  });

   useEffect(() => {
    if (productToEdit) {
      form.reset({
        name: productToEdit.name,
        sku: productToEdit.sku || "",
        description: productToEdit.description || "",
        category: productToEdit.category,
        price: productToEdit.price,
        stock: productToEdit.stock,
        image: productToEdit.image || "",
        hint: productToEdit.hint || "",
        taxRate: productToEdit.taxRate || 0,
      });
    } else {
      form.reset({ name: "", sku: "", description: "", category: "", price: 0, stock: 0, image: "", hint: "", taxRate: 0 });
    }
  }, [productToEdit, form, isFormDialogOpen]);


  const { data: products, isLoading, error } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  useEffect(() => {
    if (products) {
      // console.log("[InventoryPage] Products data from useQuery:", JSON.stringify(products, null, 2));
    } else if (products && products.length === 0 && !isLoading) {
        console.log("[InventoryPage] Products data from useQuery is an empty array and not loading.");
    }
    if (error) {
      console.error("[InventoryPage] Error fetching products:", error);
    }
  }, [products, isLoading, error]);

  const filteredProducts = useMemo(() => {
    if (!products) {
      console.log("[InventoryPage] filteredProducts: No products data available for filtering.");
      return [];
    }
    let items = products;
    if (selectedCategory !== "All Categories") {
      items = items.filter(product => product.category === selectedCategory);
    }
    if (searchTerm) {
      items = items.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    console.log(`[InventoryPage] filteredProducts: Found ${items.length} products after filtering.`);
    return items;
  }, [products, searchTerm, selectedCategory]);


  const addProductMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Product added successfully." });
      setIsFormDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add product: ${error.message}` });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: { id: string; productData: ProductFormData }) => updateProduct(data.id, data.productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Product updated successfully." });
      setIsFormDialogOpen(false);
      setProductToEdit(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update product: ${error.message}` });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Product deleted successfully." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete product: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });


  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    const processedData = { ...data, taxRate: data.taxRate || 0 }; // Ensure taxRate is number
    if (productToEdit && productToEdit.id) {
      updateProductMutation.mutate({ id: productToEdit.id, productData: processedData });
    } else {
      addProductMutation.mutate(processedData);
    }
  };

  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsFormDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDeleteId) {
      deleteProductMutation.mutate(productToDeleteId);
    }
  };

  const getProductStatus = (stock: number): { text: string; variant: "default" | "secondary" | "destructive" } => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive" };
    if (stock <= 10) return { text: "Low Stock", variant: "secondary" }; 
    return { text: "In Stock", variant: "default" };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Inventory Management</h1>
          <Button onClick={handleAddNewProduct}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
      </div>
        <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
            setIsFormDialogOpen(isOpen);
            if (!isOpen) setProductToEdit(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{productToEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {productToEdit ? "Update product details." : "Enter new product details."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Espresso Machine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ESP-MCH-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed product description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.slice(1).map(cat => ( 
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} step="0.01"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} step="1"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate (e.g., 0.05 for 5%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} step="0.001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://placehold.co/40x40.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="hint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Hint (Optional, 1-2 words for placeholder)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., coffee machine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addProductMutation.isPending || updateProductMutation.isPending}>
                    {(addProductMutation.isPending || updateProductMutation.isPending) ? "Saving..." : "Save Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-xs">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <PackageSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter: {selectedCategory}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {productCategories.map(cat => (
                   <DropdownMenuItem key={cat} onSelect={() => setSelectedCategory(cat)}>{cat}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
             <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading products: {error.message}</span>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product.stock);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={product.image || `https://placehold.co/40x40.png?text=${product.name?.substring(0,2) || 'P'}`}
                          alt={product.name || 'Product Image'}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                          data-ai-hint={product.hint || product.name?.split(" ").slice(0,2).join(" ").toLowerCase() || 'product'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className={status.variant === 'default' ? 'bg-accent text-accent-foreground' : ''}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="mr-1" title="Edit Product" onClick={() => handleEditProduct(product)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Product" onClick={() => product.id && handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                 {filteredProducts.length === 0 && !isLoading && (
                     <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {products && products.length === 0 ? "No products found. Add your first product!" : "No products match your current filter."}
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
