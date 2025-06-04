
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Construction } from "lucide-react";

export default function VouchersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Financial Vouchers</h1>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            This section for managing Credit Notes, Debit Notes, and other financial vouchers is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Construction className="h-24 w-24 text-muted-foreground mb-6" />
          <p className="text-lg font-medium text-muted-foreground">
            Coming Soon!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            We're working hard to bring you a comprehensive voucher management system.
          </p>
          <Button variant="outline" className="mt-8" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
