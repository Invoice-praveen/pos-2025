
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertCircle } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanySettings, updateCompanySettings } from "@/services/settingsService";
import type { CompanySettings } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useEffect } from "react";

const settingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeAddress: z.string().min(1, "Store address is required"),
  storePhone: z.string().optional(),
  storeEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
  storeWebsite: z.string().url("Invalid URL").optional().or(z.literal('')),
  logoUrl: z.string().url("Invalid URL for logo").optional().or(z.literal('')),
  invoiceTagline: z.string().optional(),
  defaultTaxRate: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() !== '' ? parseFloat(val) : undefined),
    z.number().min(0).max(100).optional()
  ).transform(val => (val !== undefined ? val / 100 : undefined)), // Store as decimal, e.g., 5% -> 0.05
  receiptHeader: z.string().optional(),
  receiptFooter: z.string().optional(),
  invoiceTerms: z.string().optional(),
  authorizedSignature: z.string().optional(),
  enableLowStockAlerts: z.boolean().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companySettings, isLoading, error: settingsError } = useQuery<CompanySettings | null, Error>({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: "",
      storeAddress: "",
      storePhone: "",
      storeEmail: "",
      storeWebsite: "",
      logoUrl: "",
      invoiceTagline: "",
      defaultTaxRate: undefined, // Handled as percentage in UI, converted to decimal for storage
      receiptHeader: "",
      receiptFooter: "",
      invoiceTerms: "",
      authorizedSignature: "",
      enableLowStockAlerts: true,
    },
  });

  useEffect(() => {
    if (companySettings) {
      form.reset({
        storeName: companySettings.storeName || "",
        storeAddress: companySettings.storeAddress || "",
        storePhone: companySettings.storePhone || "",
        storeEmail: companySettings.storeEmail || "",
        storeWebsite: companySettings.storeWebsite || "",
        logoUrl: companySettings.logoUrl || "",
        invoiceTagline: companySettings.invoiceTagline || "",
        defaultTaxRate: companySettings.defaultTaxRate !== undefined ? companySettings.defaultTaxRate * 100 : undefined, // Convert decimal to percentage for form
        receiptHeader: companySettings.receiptHeader || "",
        receiptFooter: companySettings.receiptFooter || "",
        invoiceTerms: companySettings.invoiceTerms || "",
        authorizedSignature: companySettings.authorizedSignature || "",
        enableLowStockAlerts: companySettings.enableLowStockAlerts !== undefined ? companySettings.enableLowStockAlerts : true,
      });
    }
  }, [companySettings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Save Error",
        description: `Failed to save settings: ${error.message}`,
      });
    },
  });

  const onSubmit: SubmitHandler<SettingsFormData> = (data) => {
    console.log("Form data submitted:", data);
    const dataToSave: Partial<CompanySettings> = { ...data };
    // defaultTaxRate is already transformed by Zod schema to decimal
    updateSettingsMutation.mutate(dataToSave);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold font-headline">Application Settings</h1>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="text-destructive flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-xl font-semibold">Error Loading Settings</h2>
        <p>{settingsError.message}</p>
        <Button onClick={() => queryClient.refetchQueries({queryKey: ['companySettings']})}>Try Again</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold font-headline">Application Settings</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Store Details</CardTitle>
              <CardDescription>Basic information for your store and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="storeName" render={({ field }) => (
                <FormItem><FormLabel>Store Name</FormLabel><FormControl><Input placeholder="Your Store LLC" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storeAddress" render={({ field }) => (
                <FormItem><FormLabel>Store Address</FormLabel><FormControl><Textarea placeholder="123 Example Street, City, Country" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storePhone" render={({ field }) => (
                <FormItem><FormLabel>Store Phone</FormLabel><FormControl><Input placeholder="+1 555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storeEmail" render={({ field }) => (
                <FormItem><FormLabel>Store Email</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="storeWebsite" render={({ field }) => (
                <FormItem><FormLabel>Store Website</FormLabel><FormControl><Input type="url" placeholder="https://www.example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice & Receipt</CardTitle>
              <CardDescription>Customize your sales documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="logoUrl" render={({ field }) => (
                <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input type="url" placeholder="https://example.com/logo.png" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="invoiceTagline" render={({ field }) => (
                <FormItem><FormLabel>Invoice Tagline</FormLabel><FormControl><Input placeholder="Your Trusted Partner" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="defaultTaxRate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5 for 5%" {...field} value={field.value !== undefined ? field.value * 100 : ''} onChange={e => field.onChange(e.target.valueAsNumber / 100)} />
                  </FormControl>
                  <FormDescription>This rate might be used as a default for new products.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="receiptHeader" render={({ field }) => (
                <FormItem><FormLabel>Receipt Header Text</FormLabel><FormControl><Input placeholder="Welcome to Our Store!" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="receiptFooter" render={({ field }) => (
                <FormItem><FormLabel>Receipt Footer Text</FormLabel><FormControl><Textarea placeholder="Returns accepted within 30 days." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Customization</CardTitle>
              <CardDescription>Additional settings for invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <FormField control={form.control} name="invoiceTerms" render={({ field }) => (
                <FormItem><FormLabel>Invoice Terms & Conditions</FormLabel><FormControl><Textarea placeholder="Payment due upon receipt..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="authorizedSignature" render={({ field }) => (
                <FormItem><FormLabel>Authorized Signature (Text)</FormLabel><FormControl><Input placeholder="Store Manager" {...field} /></FormControl><FormDescription>Text to appear below the signature line.</FormDescription><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>General app settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="enableLowStockAlerts" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Low Stock Alerts</FormLabel>
                    <FormDescription>Receive notifications for products running low on stock.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
