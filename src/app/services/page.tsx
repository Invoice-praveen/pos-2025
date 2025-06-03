import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit3, Trash2, Search, Filter, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const servicesLog = [
  { id: "1", serviceName: "Espresso Machine Tune-up", customer: "Alice Wonderland", date: "2024-07-20", type: "Paid", status: "Completed", cost: 75.00 },
  { id: "2", name: "Grinder Calibration", customer: "Bob The Builder", date: "2024-07-18", type: "Free", status: "Completed", cost: 0.00 },
  { id: "3", name: "Software Update - POS", customer: "Store Internal", date: "2024-07-15", type: "Internal", status: "Pending", cost: 0.00 },
  { id: "4", name: "Coffee Tasting Workshop", customer: "Diana Prince", date: "2024-07-10", type: "Paid", status: "Scheduled", cost: 25.00 },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Service Tracking</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log New Service</DialogTitle>
              <DialogDescription>
                Enter details for the new service. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceName" className="text-right">Service Name</Label>
                <Input id="serviceName" placeholder="e.g., Machine Maintenance" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">Customer</Label>
                <Input id="customer" placeholder="Customer Name or ID" className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceType" className="text-right">Service Type</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid Service</SelectItem>
                    <SelectItem value="free">Free Service</SelectItem>
                    <SelectItem value="internal">Internal Task</SelectItem>
                    <SelectItem value="warranty">Warranty Claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">Cost ($)</Label>
                <Input id="cost" type="number" placeholder="0.00" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" variant="default">Save Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Input
              placeholder="Search services by name or customer..."
              className="max-w-xs"
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
             <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"><Settings2 className="h-5 w-5" /></TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesLog.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="p-1 bg-primary/10 rounded-sm flex items-center justify-center">
                      <Settings2 className="h-4 w-4 text-primary" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{service.serviceName || service.name}</TableCell>
                  <TableCell>{service.customer}</TableCell>
                  <TableCell>{service.date}</TableCell>
                  <TableCell>
                    <Badge variant={service.type === "Paid" ? "default" : "secondary"}>
                      {service.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        service.status === "Completed" ? "default" :
                        service.status === "Pending" ? "outline" :
                        "secondary"
                      }
                      className={service.status === "Completed" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${service.cost.toFixed(2)}</TableCell>
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
