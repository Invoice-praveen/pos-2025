
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, UserSearch, Mail, Phone, ShoppingBag, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customerService';
import type { Customer } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { CustomerSalesDialog } from '@/components/dialogs/customer-sales-dialog'; // Import the new dialog

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  avatar: z.string().url("Must be a valid URL for avatar").optional().or(z.literal('')),
  hint: z.string().max(20, "Hint too long (max 2 words)").optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);
  const [isSalesHistoryDialogOpen, setIsSalesHistoryDialogOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);


  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      avatar: "",
      hint: "",
    },
  });

  useEffect(() => {
    if (customerToEdit) {
      form.reset({
        name: customerToEdit.name,
        email: customerToEdit.email,
        phone: customerToEdit.phone || "",
        avatar: customerToEdit.avatar || "",
        hint: customerToEdit.hint || "",
      });
    } else {
      form.reset({ name: "", email: "", phone: "", avatar: "", hint: "" });
    }
  }, [customerToEdit, form, isFormDialogOpen]);


  const { data: customers, isLoading, error } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const addCustomerMutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Success", description: "Customer added successfully." });
      setIsFormDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add customer: ${error.message}` });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (data: { id: string; customerData: CustomerFormData }) => updateCustomer(data.id, data.customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Success", description: "Customer updated successfully." });
      setIsFormDialogOpen(false);
      setCustomerToEdit(null);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update customer: ${error.message}` });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Success", description: "Customer deleted successfully." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete customer: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });

  const onSubmit: SubmitHandler<CustomerFormData> = (data) => {
    if (customerToEdit && customerToEdit.id) {
      updateCustomerMutation.mutate({ id: customerToEdit.id, customerData: data });
    } else {
      addCustomerMutation.mutate(data);
    }
  };

  const handleAddNewCustomer = () => {
    setCustomerToEdit(null);
    form.reset({ name: "", email: "", phone: "", avatar: "", hint: "" });
    setIsFormDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsFormDialogOpen(true);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomerToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDeleteId) {
      deleteCustomerMutation.mutate(customerToDeleteId);
    }
  };

  const handleViewPurchaseHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setIsSalesHistoryDialogOpen(true);
  };
  
  const getAvatarFallback = (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Customer Management</h1>
        <Button onClick={handleAddNewCustomer}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) setCustomerToEdit(null); 
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{customerToEdit ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {customerToEdit ? "Update the customer's details." : "Enter the details for the new customer."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alice Wonderland" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., alice@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 555-0101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image URL (Optional)</FormLabel>
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
                    <FormLabel>Avatar Image Hint (Optional, 1-2 words)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., person portrait" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addCustomerMutation.isPending || updateCustomerMutation.isPending}>
                  {(addCustomerMutation.isPending || updateCustomerMutation.isPending) ? "Saving..." : "Save Customer"}
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
              This action cannot be undone. This will permanently delete the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCustomerMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCustomerForHistory && (
        <CustomerSalesDialog
          open={isSalesHistoryDialogOpen}
          onOpenChange={setIsSalesHistoryDialogOpen}
          customerId={selectedCustomerForHistory.id!}
          customerName={selectedCustomerForHistory.name}
        />
      )}


      <Card>
        <CardHeader>
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search customers by name, email, or phone..."
              disabled // Search not implemented yet
            />
            <UserSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-full" />
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
                <span>Error loading customers: {error.message}</span>
              </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={customer.avatar || `https://placehold.co/40x40.png?text=${getAvatarFallback(customer.name)}`} alt={customer.name} data-ai-hint={customer.hint || customer.name?.split(" ").slice(0,2).join(" ").toLowerCase()}/>
                        <AvatarFallback>{getAvatarFallback(customer.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${customer.email}`} className="hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground"/> {customer.email}
                      </a>
                    </TableCell>
                    <TableCell>
                       {customer.phone ? (
                         <a href={`tel:${customer.phone}`} className="hover:underline flex items-center gap-1">
                           <Phone className="h-3 w-3 text-muted-foreground"/> {customer.phone}
                         </a>
                       ) : (
                         <span className="text-muted-foreground">-</span>
                       )}
                    </TableCell>
                    <TableCell className="text-right">₹{(customer.totalSpent || 0).toFixed(2)}</TableCell>
                    <TableCell>{customer.createdAt ? format(new Date(customer.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" title="View Purchase History" onClick={() => handleViewPurchaseHistory(customer)}>
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="mr-1" title="Edit Customer" onClick={() => handleEditCustomer(customer)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Customer" onClick={() => customer.id && handleDeleteCustomer(customer.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {customers?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No customers found. Add your first customer!
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
