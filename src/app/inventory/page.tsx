
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProducts, addProduct } from '@/services/productService';
import type { Product } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productCategories = ["Appliances", "Brewing Gear", "Consumables", "Accessories", "Other"];

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  hint: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: products, isLoading, error } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const addProductMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: "Success", description: "Product added successfully." });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add product: ${error.message}` });
    },
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      stock: 0,
      image: "",
      hint: "",
    },
  });

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    addProductMutation.mutate(data);
  };

  const getProductStatus = (stock: number): { text: string; variant: "default" | "secondary" | "destructive" } => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive" };
    if (stock <= 10) return { text: "Low Stock", variant: "secondary" };
    return { text: "In Stock", variant: "default" };
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the details for the new product. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map(cat => (
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
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
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
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addProductMutation.isPending}>
                    {addProductMutation.isPending ? "Saving..." : "Save Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-xs">
              <Input
                placeholder="Search products by name..."
              />
              <PackageSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter by Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {productCategories.map(cat => (
                   <DropdownMenuItem key={cat}>{cat}</DropdownMenuItem>
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
             <div className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> 
                <span>Error loading products: {error.message}</span>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => {
                  const status = getProductStatus(product.stock);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image 
                          src={product.image || `https://placehold.co/40x40.png?text=${product.name.substring(0,2)}`} 
                          alt={product.name} 
                          width={40} 
                          height={40} 
                          className="rounded object-cover"
                          data-ai-hint={product.hint || product.name.split(" ").slice(0,2).join(" ").toLowerCase()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="mr-1" title="Edit Product" disabled> {/* TODO: Implement Edit */}
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Product" disabled> {/* TODO: Implement Delete */}
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
