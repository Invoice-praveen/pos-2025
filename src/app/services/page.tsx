
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Search, Settings2, AlertCircle, Filter } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getServices, addService, updateService, deleteService } from '@/services/serviceService';
import { getCustomers } from '@/services/customerService';
import type { Service, Customer, ServiceStatus, ServiceType } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const serviceTypes: ServiceType[] = ['Paid', 'Free', 'Internal', 'Warranty'];
const serviceStatuses: ServiceStatus[] = ['Initiated', 'Scheduled', 'On Progress', 'Pending Customer', 'Completed', 'Cancelled'];
const allStatusesFilter = "All Statuses";


const serviceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  customerId: z.string().min(1, "Customer is required"),
  description: z.string().optional(),
  serviceType: z.enum(serviceTypes),
  status: z.enum(serviceStatuses),
  cost: z.coerce.number().min(0).optional(),
  serviceDate: z.date({ required_error: "Service date is required." }),
  completionDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(allStatusesFilter);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      serviceName: "",
      customerId: "",
      description: "",
      serviceType: "Paid",
      status: "Initiated",
      cost: 0,
      serviceDate: new Date(),
      completionDate: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (isFormDialogOpen) {
      if (serviceToEdit) {
        form.reset({
          serviceName: serviceToEdit.serviceName,
          customerId: serviceToEdit.customerId,
          description: serviceToEdit.description || "",
          serviceType: serviceToEdit.serviceType,
          status: serviceToEdit.status,
          cost: serviceToEdit.cost || 0,
          serviceDate: serviceToEdit.serviceDate ? parseISO(serviceToEdit.serviceDate) : new Date(),
          completionDate: serviceToEdit.completionDate ? parseISO(serviceToEdit.completionDate) : null,
          notes: serviceToEdit.notes || "",
        });
      } else {
        form.reset({
          serviceName: "", customerId: "", description: "", serviceType: "Paid", status: "Initiated", cost: 0, serviceDate: new Date(), completionDate: null, notes: "",
        });
      }
    }
  }, [serviceToEdit, form, isFormDialogOpen]);

  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: getCustomers,
  });

  const filteredServices = useMemo(() => {
    let items = services;
    if (selectedStatusFilter !== allStatusesFilter) {
      items = items.filter(service => service.status === selectedStatusFilter);
    }
    if (searchTerm) {
      items = items.filter(service =>
        service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return items;
  }, [services, searchTerm, selectedStatusFilter]);

  const addServiceMutation = useMutation({
    mutationFn: (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'customerName' | 'completionDate'> & { customerName: string; serviceDate: string; completionDate?: string | null }) => addService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Success", description: "Service logged successfully." });
      setIsFormDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to log service: ${error.message}` });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: (data: { id: string; serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'customerName'>> & {customerName?: string, serviceDate?: string, completionDate?: string | null} }) => 
      updateService(data.id, data.serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Success", description: "Service updated successfully." });
      setIsFormDialogOpen(false);
      setServiceToEdit(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update service: ${error.message}` });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Success", description: "Service deleted successfully." });
      setIsConfirmDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to delete service: ${error.message}` });
      setIsConfirmDeleteDialogOpen(false);
    },
  });

  const onSubmit: SubmitHandler<ServiceFormData> = (data) => {
    const selectedCustomer = customers.find(c => c.id === data.customerId);
    if (!selectedCustomer) {
      toast({ variant: "destructive", title: "Error", description: "Selected customer not found." });
      return;
    }

    const payload = {
      ...data,
      customerName: selectedCustomer.name,
      serviceDate: data.serviceDate.toISOString(),
      completionDate: data.completionDate ? data.completionDate.toISOString() : null,
      cost: data.cost || 0,
    };

    if (serviceToEdit && serviceToEdit.id) {
      updateServiceMutation.mutate({ id: serviceToEdit.id, serviceData: payload });
    } else {
      const { completionDate, ...addPayload } = payload; // completionDate is not part of addService Omit
      const addServicePayload: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'completionDate'> & {customerName: string} = addPayload;
      addServiceMutation.mutate(addServicePayload);
    }
  };

  const handleAddNewService = () => {
    setServiceToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setServiceToEdit(service);
    setIsFormDialogOpen(true);
  };

  const handleDeleteService = (id: string) => {
    setServiceToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDeleteId) {
      deleteServiceMutation.mutate(serviceToDeleteId);
    }
  };
  
  const getStatusBadgeVariant = (status: ServiceStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed': return 'default'; // Greenish (accent)
      case 'On Progress': return 'default'; // Bluish (primary)
      case 'Scheduled': return 'secondary'; 
      case 'Initiated': return 'outline';
      case 'Pending Customer': return 'outline'; // Yellowish
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };
   const getStatusBadgeClass = (status: ServiceStatus): string => {
    switch (status) {
      case 'Completed': return 'bg-accent text-accent-foreground';
      case 'On Progress': return 'bg-primary/80 text-primary-foreground';
      case 'Scheduled': return 'bg-blue-500 text-blue-50';
      case 'Pending Customer': return 'bg-yellow-500 text-yellow-50';
      default: return '';
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Service Tracking</h1>
        <Button onClick={handleAddNewService}>
          <PlusCircle className="mr-2 h-4 w-4" /> Log New Service
        </Button>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) setServiceToEdit(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{serviceToEdit ? "Edit Service Log" : "Log New Service"}</DialogTitle>
            <DialogDescription>
              {serviceToEdit ? "Update the service details." : "Enter the details for the new service."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Espresso Machine Tune-up" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomers}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id!}>{c.name} ({c.email})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Detailed description of the service or issue..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{serviceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (₹) (Optional)</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="serviceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Service Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="completionDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Completion Date (Optional)</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Leave blank if not yet completed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Any internal notes about the service..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addServiceMutation.isPending || updateServiceMutation.isPending}>
                  {(addServiceMutation.isPending || updateServiceMutation.isPending) ? "Saving..." : "Save Service"}
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
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the service log.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setServiceToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteServiceMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteServiceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full max-w-xs">
              <Input
                placeholder="Search by name or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allStatusesFilter}>{allStatusesFilter}</SelectItem>
                {serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingServices ? (
             <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                  <Skeleton className="h-6 w-6 rounded-sm" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/6" /><Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : servicesError ? (
            <div className="text-destructive flex items-center gap-2 p-4 border border-destructive/50 rounded-md"><AlertCircle className="h-5 w-5" /><span>Error: {servicesError.message}</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Settings2 className="h-5 w-5 text-muted-foreground" /></TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="p-1 bg-primary/10 rounded-sm flex items-center justify-center w-fit">
                        <Settings2 className="h-4 w-4 text-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{service.serviceName}</TableCell>
                    <TableCell>{service.customerName}</TableCell>
                    <TableCell>{format(parseISO(service.serviceDate), 'PP')}</TableCell>
                    <TableCell>
                      <Badge variant={service.serviceType === "Paid" ? "default" : "secondary"}>
                        {service.serviceType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(service.status)} className={getStatusBadgeClass(service.status)}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{(service.cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" title="Edit Service" onClick={() => handleEditService(service)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Service" onClick={() => service.id && handleDeleteService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                       No services found{searchTerm || selectedStatusFilter !== allStatusesFilter ? " matching your criteria" : ". Log your first service!"}
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
