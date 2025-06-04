
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Search, Receipt, AlertCircle, Filter, Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '@/services/expenseService';
import type { Expense, ExpenseCategory } from '@/types';
import { expenseCategories } from '@/types'; // Import categories array
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const expenseSchema = z.object({
  expenseDate: z.date({ required_error: "Expense date is required." }),
  category: z.enum(expenseCategories, { required_error: "Category is required." }),
  otherCategoryDetail: z.string().optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  payee: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  if (data.category === "Other") {
    return !!data.otherCategoryDetail && data.otherCategoryDetail.trim().length > 0;
  }
  return true;
}, {
  message: "Details for 'Other' category are required.",
  path: ["otherCategoryDetail"], 
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
const allCategoriesFilter = "All Categories";

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(allCategoriesFilter);


  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date(),
      category: expenseCategories[0],
      otherCategoryDetail: "",
      amount: 0,
      payee: "",
      description: "",
      notes: "",
    },
  });

  const watchedCategory = form.watch("category");

  useEffect(() => {
    if (isFormDialogOpen) {
      if (expenseToEdit) {
        form.reset({
          expenseDate: expenseToEdit.expenseDate ? parseISO(expenseToEdit.expenseDate) : new Date(),
          category: expenseToEdit.category,
          otherCategoryDetail: expenseToEdit.otherCategoryDetail || "",
          amount: expenseToEdit.amount,
          payee: expenseToEdit.payee || "",
          description: expenseToEdit.description || "",
          notes: expenseToEdit.notes || "",
        });
      } else {
        form.reset({
          expenseDate: new Date(), category: expenseCategories[0], otherCategoryDetail: "", amount: 0, payee: "", description: "", notes: ""
        });
      }
    }
  }, [expenseToEdit, form, isFormDialogOpen]);

  const { data: expenses = [], isLoading, error } = useQuery<Expense[], Error>({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });

  const filteredExpenses = useMemo(() => {
    let items = expenses;
    if (selectedCategoryFilter !== allCategoriesFilter) {
      items = items.filter(expense => expense.category === selectedCategoryFilter);
    }
    if (searchTerm) {
      items = items.filter(expense =>
        (expense.payee && expense.payee.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        expense.amount.toString().includes(searchTerm)
      );
    }
    return items;
  }, [expenses, searchTerm, selectedCategoryFilter]);

  const addExpenseMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => addExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Success", description: "Expense added successfully." });
      setIsFormDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to add expense: ${error.message}` });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data: { id: string; expenseData: ExpenseFormData }) => updateExpense(data.id, data.expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Success", description: "Expense updated successfully." });
      setIsFormDialogOpen(false);
      setExpenseToEdit(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update expense: ${error.message}` });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: "Success", description: "Expense deleted successfully." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete expense: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    const dataToSubmit = { ...data };
    if (data.category !== "Other") {
      dataToSubmit.otherCategoryDetail = ""; // Clear detail if category is not 'Other'
    }

    if (expenseToEdit && expenseToEdit.id) {
      updateExpenseMutation.mutate({ id: expenseToEdit.id, expenseData: dataToSubmit });
    } else {
      addExpenseMutation.mutate(dataToSubmit);
    }
  };

  const handleAddNewExpense = () => {
    setExpenseToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsFormDialogOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDeleteId) {
      deleteExpenseMutation.mutate(expenseToDeleteId);
    }
  };

  const getCategoryDisplay = (expense: Expense) => {
    if (expense.category === "Other" && expense.otherCategoryDetail) {
      return `Other (${expense.otherCategoryDetail})`;
    }
    return expense.category;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Expense Management</h1>
        </div>
        <Button onClick={handleAddNewExpense}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Expense
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) setExpenseToEdit(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{expenseToEdit ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {expenseToEdit ? "Update the expense details." : "Enter the details for the new expense."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="expenseDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Expense Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("justify-start text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              {watchedCategory === "Other" && (
                <FormField control={form.control} name="otherCategoryDetail" render={({ field }) => (
                  <FormItem><FormLabel>Specify 'Other' Category</FormLabel><FormControl><Input placeholder="e.g., Special Event Catering" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="payee" render={({ field }) => (
                <FormItem><FormLabel>Payee/Vendor (Optional)</FormLabel><FormControl><Input placeholder="e.g., Office Supplies Ltd." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Monthly electricity bill" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Internal Notes (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Paid via UPI ref #123" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}>
                  {(addExpenseMutation.isPending || updateExpenseMutation.isPending) ? "Saving..." : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the expense record.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteExpenseMutation.isPending} className="bg-destructive hover:bg-destructive/90">{deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-xs">
              <Input placeholder="Search by payee, description, amount..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={allCategoriesFilter}>{allCategoriesFilter}</SelectItem>
                {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="space-y-2">{[...Array(3)].map((_, i) => (<div key={i} className="flex items-center space-x-4 p-4 border rounded-md"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-8 w-20" /></div>))}</div>
          ) : error ? (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md"><AlertCircle className="h-5 w-5" /><span>Error loading expenses: {error.message}</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(parseISO(expense.expenseDate), 'PP')}</TableCell>
                    <TableCell>{getCategoryDisplay(expense)}</TableCell>
                    <TableCell className="text-right font-medium">{expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{expense.payee || '-'}</TableCell>
                    <TableCell className="truncate max-w-xs">{expense.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" title="Edit Expense" onClick={() => handleEditExpense(expense)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Expense" onClick={() => expense.id && handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No expenses found{searchTerm || selectedCategoryFilter !== allCategoriesFilter ? " matching criteria" : ". Add your first expense!"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
