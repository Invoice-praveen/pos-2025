
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, UserSearch, Mail, Phone, ShoppingBag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const customers = [
  { id: "1", name: "Alice Wonderland", email: "alice@example.com", phone: "555-0101", totalSpent: 450.75, lastPurchase: "2024-07-15", avatar: "https://placehold.co/40x40.png?text=AW", hint: "person portrait" },
  { id: "2", name: "Bob The Builder", email: "bob@example.com", phone: "555-0102", totalSpent: 1200.00, lastPurchase: "2024-07-20", avatar: "https://placehold.co/40x40.png?text=BB", hint: "person builder" },
  { id: "3", name: "Charlie Chaplin", email: "charlie@example.com", phone: "555-0103", totalSpent: 85.30, lastPurchase: "2024-06-10", avatar: "https://placehold.co/40x40.png?text=CC", hint: "person classic" },
  { id: "4", name: "Diana Prince", email: "diana@example.com", phone: "555-0104", totalSpent: 320.50, lastPurchase: "2024-07-18", avatar: "https://placehold.co/40x40.png?text=DP", hint: "woman portrait" },
];

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Customer Management</h1>
        <Button disabled> {/* TODO: Implement Add Customer */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search customers by name, email, or phone..."
            />
            <UserSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={customer.avatar} alt={customer.name} data-ai-hint={customer.hint}/>
                      <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <a href={`mailto:${customer.email}`} className="hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground"/> {customer.email}
                    </a>
                  </TableCell>
                  <TableCell>
                     <a href={`tel:${customer.phone}`} className="hover:underline flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground"/> {customer.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{customer.lastPurchase}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="mr-1" title="View Purchase History" disabled> {/* TODO */}
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="mr-1" title="Edit Customer" disabled> {/* TODO */}
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete Customer" disabled> {/* TODO */}
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
