import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { navItems, bottomNavItems } from '@/config/nav';
import Link from 'next/link';
import { Store } from 'lucide-react';

export const metadata: Metadata = {
  title: 'OrderFlow',
  description: 'Point of Sale and Inventory Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground flex flex-col">
        <SidebarProvider defaultOpen>
          <div className="flex min-h-screen">
            <Sidebar collapsible="icon" className="border-r">
              <SidebarHeader className="p-4">
                 <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <Store className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">OrderFlow</span>
                 </Link>
              </SidebarHeader>
              <SidebarContent className="flex-grow p-2">
                <SidebarNav items={navItems} />
              </SidebarContent>
              <SidebarFooter className="p-2">
                <SidebarNav items={bottomNavItems} />
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 p-4 sm:p-6 md:p-8">
                {children}
              </main>
            </SidebarInset>
          </div>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
