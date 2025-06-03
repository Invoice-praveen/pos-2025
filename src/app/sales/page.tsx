import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MinusCircle, Trash2, Percent, Printer } from "lucide-react";
import Image from "next/image";

const products = [
  { id: "1", name: "Espresso Machine", price: 299.99, stock: 15, image: "https://placehold.co/100x100.png", hint: "coffee machine" },
  { id: "2", name: "Coffee Grinder", price: 79.50, stock: 30, image: "https://placehold.co/100x100.png", hint: "coffee grinder" },
  { id: "3", name: "Pour Over Set", price: 45.00, stock: 22, image: "https://placehold.co/100x100.png", hint: "coffee set" },
  { id: "4", name: "Bag of Coffee Beans (1kg)", price: 22.99, stock: 100, image: "https://placehold.co/100x100.png", hint: "coffee beans" },
];

const cartItems = [
  { productId: "1", name: "Espresso Machine", quantity: 1, price: 299.99 },
  { productId: "4", name: "Bag of Coffee Beans (1kg)", quantity: 2, price: 22.99 },
];

export default function SalesPage() {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 10.00; // Example discount
  const taxRate = 0.08; // 8% tax
  const taxAmount = (subtotal - discount) * taxRate;
  const total = subtotal - discount + taxAmount;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline">Point of Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection - Left/Top */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <Input placeholder="Search products..." className="mt-2" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  width={100} 
                  height={100} 
                  className="object-cover w-full h-32 rounded-t-lg"
                  data-ai-hint={product.hint}
                />
                <CardHeader className="p-3 flex-grow">
                  <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                  <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-3">
                  <Button size="sm" className="w-full">Add to Cart</Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Cart & Summary - Right/Bottom */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium text-xs">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6"><MinusCircle className="h-4 w-4" /></Button>
                          <span>{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-destructive">-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="w-full"><Percent className="mr-2 h-4 w-4" /> Apply Discount</Button>
                <Button variant="outline" className="w-full"><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button>
            </div>
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
