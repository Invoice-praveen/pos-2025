
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

// Mock state for settings - in a real app, this would come from a service/context
import { useState } from "react";

export default function SettingsPage() {
  const { toast } = useToast();

  // Example state for settings fields
  const [storeName, setStoreName] = useState("OrderFlow Demo Store");
  const [storeAddress, setStoreAddress] = useState("123 Main St, Anytown, USA");
  const [defaultTaxRate, setDefaultTaxRate] = useState("5"); // as string for input
  const [receiptHeader, setReceiptHeader] = useState("Thank you for your purchase!");
  const [receiptFooter, setReceiptFooter] = useState("Find us online: www.example.com");
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);

  const handleSaveChanges = () => {
    // In a real app, you would save these settings to a backend/Firestore
    console.log("Settings saved:", {
      storeName,
      storeAddress,
      defaultTaxRate: parseFloat(defaultTaxRate) / 100,
      receiptHeader,
      receiptFooter,
      enableLowStockAlerts,
    });
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Application Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>Manage your store's basic information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Your Store LLC" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Textarea id="storeAddress" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="123 Example Street, City, Country" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <CardDescription>Set default tax rates and rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input id="defaultTaxRate" type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} placeholder="e.g., 5 for 5%" />
            </div>
            {/* More tax settings could go here */}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receipt Customization</CardTitle>
            <CardDescription>Personalize your printed or digital receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="receiptHeader">Receipt Header Text</Label>
              <Input id="receiptHeader" value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} placeholder="Welcome to Our Store!" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receiptFooter">Receipt Footer Text</Label>
              <Textarea id="receiptFooter" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Returns accepted within 30 days." />
            </div>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage app notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="lowStockAlerts" className="flex flex-col space-y-1">
                <span>Low Stock Alerts</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive notifications for products running low on stock.
                </span>
              </Label>
              <Switch
                id="lowStockAlerts"
                checked={enableLowStockAlerts}
                onCheckedChange={setEnableLowStockAlerts}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
