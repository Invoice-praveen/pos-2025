
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, UserSearch, Mail, Phone, Truck, AlertCircle, MapPin } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/services/supplierService';
import type { Supplier } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [supplierToDeleteId, setSupplierToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (supplierToEdit) {
      form.reset({
        name: supplierToEdit.name,
        contactPerson: supplierToEdit.contactPerson || "",
        email: supplierToEdit.email || "",
        phone: supplierToEdit.phone || "",
        address: supplierToEdit.address || "",
        notes: supplierToEdit.notes || "",
      });
    } else {
      form.reset({ name: "", contactPerson: "", email: "", phone: "", address: "", notes: "" });
    }
  }, [supplierToEdit, form, isFormDialogOpen]);


  const { data: suppliers, isLoading, error } = useQuery<Supplier[], Error>({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!searchTerm) return suppliers;
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  const addSupplierMutation = useMutation({
    mutationFn: addSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Success", description: "Supplier added successfully." });
      setIsFormDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add supplier: ${error.message}` });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: (data: { id: string; supplierData: SupplierFormData }) => updateSupplier(data.id, data.supplierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Success", description: "Supplier updated successfully." });
      setIsFormDialogOpen(false);
      setSupplierToEdit(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update supplier: ${error.message}` });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Success", description: "Supplier deleted successfully." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete supplier: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });

  const onSubmit: SubmitHandler<SupplierFormData> = (data) => {
    if (supplierToEdit && supplierToEdit.id) {
      updateSupplierMutation.mutate({ id: supplierToEdit.id, supplierData: data });
    } else {
      addSupplierMutation.mutate(data);
    }
  };

  const handleAddNewSupplier = () => {
    setSupplierToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setIsFormDialogOpen(true);
  };

  const handleDeleteSupplier = (id: string) => {
    setSupplierToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDeleteId) {
      deleteSupplierMutation.mutate(supplierToDeleteId);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">Supplier Management</h1>
        </div>
        <Button onClick={handleAddNewSupplier}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) setSupplierToEdit(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{supplierToEdit ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription>
              {supplierToEdit ? "Update the supplier's details." : "Enter the details for the new supplier."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="e.g., Global Supplies Inc." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem><FormLabel>Contact Person (Optional)</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address (Optional)</FormLabel><FormControl><Input type="email" placeholder="e.g., contact@globalsupplies.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., 555-0202" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., 123 Industrial Way, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Preferred supplier for X, Payment terms..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addSupplierMutation.isPending || updateSupplierMutation.isPending}>
                  {(addSupplierMutation.isPending || updateSupplierMutation.isPending) ? "Saving..." : "Save Supplier"}
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
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the supplier.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteSupplierMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteSupplierMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search suppliers by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <UserSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
             <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading suppliers: {error.message}</span>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <a href={`mailto:${supplier.email}`} className="hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground"/> {supplier.email}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                       {supplier.phone ? (
                         <a href={`tel:${supplier.phone}`} className="hover:underline flex items-center gap-1">
                           <Phone className="h-3 w-3 text-muted-foreground"/> {supplier.phone}
                         </a>
                       ) : '-'}
                    </TableCell>
                    <TableCell>{supplier.createdAt ? format(new Date(supplier.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" title="Edit Supplier" onClick={() => handleEditSupplier(supplier)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Supplier" onClick={() => supplier.id && handleDeleteSupplier(supplier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {filteredSuppliers.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No suppliers found{searchTerm ? ` matching "${searchTerm}"` : ". Add your first supplier!"}
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
