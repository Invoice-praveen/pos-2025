
'use client'; // Required for QueryClientProvider & AuthProvider

import type { Metadata } from 'next';
import './globals.css';
import '@/components/invoice/invoice-template.css'; // Import print CSS globally
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { navItems, bottomNavItems } from '@/config/nav';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import NextTopLoader from 'nextjs-toploader';


// Metadata can't be generated in a client component directly,
// so we export it from here if layout becomes client component.
// However, QueryClientProvider can wrap server components.
// For simplicity, we'll make layout client component for now.
// export const metadata: Metadata = {
//   title: 'OrderFlow',
//   description: 'Point of Sale and Inventory Management System',
// };

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Optional: disable refetch on window focus
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>OrderFlow</title>
        <meta name="description" content="Point of Sale and Inventory Management System" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground flex flex-col">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {/* <TopLoader /> */}
            <NextTopLoader color={"text-primary"} />
            <SidebarProvider defaultOpen>
              <div className="flex min-h-screen w-full">
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
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
