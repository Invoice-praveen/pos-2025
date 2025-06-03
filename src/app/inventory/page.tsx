import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, PackageSearch, Filter } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const products = [
  { id: "1", name: "Espresso Machine", category: "Appliances", price: 299.99, stock: 15, status: "In Stock", image: "https://placehold.co/40x40.png", hint: "coffee machine" },
  { id: "2", name: "Coffee Grinder", category: "Appliances", price: 79.50, stock: 30, status: "In Stock", image: "https://placehold.co/40x40.png", hint: "coffee grinder" },
  { id: "3", name: "Pour Over Set", category: "Brewing Gear", price: 45.00, stock: 0, status: "Out of Stock", image: "https://placehold.co/40x40.png", hint: "coffee set" },
  { id: "4", name: "Bag of Coffee Beans (1kg)", category: "Consumables", price: 22.99, stock: 100, status: "In Stock", image: "https://placehold.co/40x40.png", hint: "coffee beans" },
  { id: "5", name: "Milk Frother", category: "Accessories", price: 25.00, stock: 5, status: "Low Stock", image: "https://placehold.co/40x40.png", hint: "milk frother" },
];

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Inventory Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Input
              placeholder="Search products by name or SKU..."
              className="max-w-xs"
              icon={<PackageSearch className="h-4 w-4 text-muted-foreground" />}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter by Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Appliances</DropdownMenuItem>
                <DropdownMenuItem>Brewing Gear</DropdownMenuItem>
                <DropdownMenuItem>Consumables</DropdownMenuItem>
                <DropdownMenuItem>Accessories</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      width={40} 
                      height={40} 
                      className="rounded"
                      data-ai-hint={product.hint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        product.status === "In Stock" ? "default" : 
                        product.status === "Out of Stock" ? "destructive" : 
                        "secondary" /* Low Stock */
                      }
                      className={
                        product.status === "In Stock" ? "bg-green-500 hover:bg-green-600" :
                        product.status === "Out of Stock" ? "" :
                        "bg-yellow-500 hover:bg-yellow-600" 
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="mr-1">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
