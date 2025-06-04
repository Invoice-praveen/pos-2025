
'use client'; // Required for QueryClientProvider & AuthProvider

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
import { AuthProvider, useAuth } from '@/context/AuthContext';
import NextTopLoader from 'nextjs-toploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Optional: disable refetch on window focus
    },
  },
});

// New component to house the main application structure
function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // useAuth is now called within AuthProvider context

  const getAvatarFallbackText = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <NextTopLoader />
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarHeader className="p-4 flex items-center group-data-[collapsible=icon]:justify-center">
              {authLoading ? (
                 <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                  <Skeleton className="h-8 w-8 rounded-full group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 flex-shrink-0" />
                  <Skeleton className="h-5 w-2/3 group-data-[collapsible=icon]:hidden" />
                 </div>
              ) : user ? (
                <div className="flex items-center gap-2 w-full overflow-hidden group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 flex-shrink-0">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="person user" />
                    <AvatarFallback>{getAvatarFallbackText(user.displayName, user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-1 group-data-[collapsible=icon]:hidden overflow-hidden flex-grow min-w-0">
                    <p className="text-sm font-semibold truncate" title={user.displayName || user.email || undefined}>
                      {user.displayName || user.email}
                    </p>
                    {user.displayName && user.email && (
                      <p className="text-xs text-muted-foreground truncate" title={user.email}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                  <Store className="h-6 w-6 text-primary flex-shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7" />
                  <span className="font-bold text-lg font-headline group-data-[collapsible=icon]:hidden">OrderFlow</span>
                </Link>
              )}
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
    </>
  );
}


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
            <MainAppLayout>{children}</MainAppLayout>
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
