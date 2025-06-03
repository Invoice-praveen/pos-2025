
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MinusCircle, Trash2, Percent, Printer } from "lucide-react";
import Image from "next/image";

const products = [
  { id: "1", name: "Espresso Machine", price: 299.99, stock: 15, image: "https://placehold.co/100x100.png", hint: "coffee machine" },
  { id: "2", name: "Coffee Grinder", price: 79.50, stock: 30, image: "https://placehold.co/100x100.png", hint: "coffee grinder" },
  { id: "3", name: "Pour Over Set", price: 45.00, stock: 22, image: "https://placehold.co/100x100.png", hint: "coffee set" },
  { id: "4", name: "Bag of Coffee Beans (1kg)", price: 22.99, stock: 100, image: "https://placehold.co/100x100.png", hint: "coffee beans" },
  { id: "5", name: "Milk Frother", price: 25.00, stock: 50, image: "https://placehold.co/100x100.png", hint: "milk frother" },
  { id: "6", name: "Digital Scale", price: 19.99, stock: 40, image: "https://placehold.co/100x100.png", hint: "digital scale" },
  { id: "7", name: "Cleaning Brush", price: 8.50, stock: 75, image: "https://placehold.co/100x100.png", hint: "cleaning brush" },
  { id: "8", name: "Tamper", price: 15.75, stock: 35, image: "https://placehold.co/100x100.png", hint: "coffee tamper" },
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
    <div className="flex flex-col gap-6 h-[calc(100vh-theme(spacing.32))]"> {/* Adjusted height for better viewport fit */}
      <h1 className="text-3xl font-bold font-headline shrink-0">Point of Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        {/* Product Selection - Left/Top */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Products</CardTitle>
            <Input placeholder="Search products..." className="mt-2" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 p-3 flex-grow overflow-y-auto">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  width={100} 
                  height={100} 
                  className="object-cover w-full h-24" // Reduced image height
                  data-ai-hint={product.hint}
                />
                <div className="p-2 flex flex-col flex-grow">
                  <h3 className="text-xs font-medium leading-tight mb-1 flex-grow">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                  <p className="text-sm font-semibold mt-1">${product.price.toFixed(2)}</p>
                </div>
                <CardFooter className="p-2 mt-auto">
                  <Button size="sm" className="w-full text-xs">Add to Cart</Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Cart & Summary - Right/Bottom */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 flex-grow overflow-y-auto">
            <div className="max-h-60 overflow-y-auto"> {/* Max height for cart items */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-2 text-xs">Item</TableHead>
                    <TableHead className="p-2 text-center text-xs">Qty</TableHead>
                    <TableHead className="p-2 text-right text-xs">Price</TableHead>
                    <TableHead className="p-2 text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium text-xs p-2">{item.name}</TableCell>
                      <TableCell className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-5 w-5"><MinusCircle className="h-3 w-3" /></Button>
                          <span className="text-xs">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5"><PlusCircle className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs p-2">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right p-2">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <div className="space-y-1 text-xs">
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
            <div className="flex justify-between text-lg font-extrabold text-primary"> {/* Made Total more prominent */}
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2 p-3 mt-auto shrink-0">
            <div className="flex gap-2 w-full">
                <Button variant="outline" className="w-full text-xs"><Percent className="mr-1 h-3 w-3" /> Apply Discount</Button>
                <Button variant="outline" className="w-full text-xs"><Printer className="mr-1 h-3 w-3" /> Print Receipt</Button>
            </div>
            <Button size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Proceed to Payment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
