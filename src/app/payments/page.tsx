import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, CreditCard as CreditCardIcon, Landmark, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function PaymentsPage() {
  const orderTotal = 125.99; // Example total from sales page

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Payment Processing</h1>
        <p className="text-muted-foreground">Complete the transaction for Order #ORD12345</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Total: ${orderTotal.toFixed(2)}</CardTitle>
          <CardDescription>Select a payment method to proceed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="paymentMethod" className="text-base font-medium">Payment Method</Label>
            <RadioGroup defaultValue="card" id="paymentMethod" className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCardIcon className="mb-3 h-6 w-6" />
                  Credit/Debit Card
                </Label>
              </div>
              <div>
                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                <Label
                  htmlFor="cash"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <DollarSign className="mb-3 h-6 w-6" />
                  Cash
                </Label>
              </div>
              <div>
                <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                <Label
                  htmlFor="bank"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Landmark className="mb-3 h-6 w-6" />
                  Bank Transfer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Placeholder for card details form - only show if card is selected */}
          <div className="space-y-4"> {/* This div would be conditionally rendered */}
            <h3 className="text-lg font-medium">Card Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="•••• •••• •••• ••••" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cardName">Name on Card</Label>
                <Input id="cardName" placeholder="John Doe" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input id="expiryDate" placeholder="MM/YY" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="•••" />
              </div>
               <div className="space-y-1">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" placeholder="12345" />
              </div>
            </div>
          </div>
          
          {/* Placeholder for Cash payment */}
          {/* This div would be conditionally rendered if cash is selected */}
          {/* <div className="space-y-4">
            <h3 className="text-lg font-medium">Cash Payment</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="amountReceived">Amount Received</Label>
                    <Input id="amountReceived" type="number" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="changeDue">Change Due</Label>
                    <Input id="changeDue" type="number" placeholder="0.00" readOnly className="bg-muted"/>
                </div>
            </div>
          </div> */}

          <div className="space-y-1">
            <Label htmlFor="notes">Payment Notes (Optional)</Label>
            <Textarea id="notes" placeholder="e.g., Reference ID, special instructions" />
          </div>

        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <CheckCircle className="mr-2 h-5 w-5" /> Confirm Payment of ${orderTotal.toFixed(2)}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
