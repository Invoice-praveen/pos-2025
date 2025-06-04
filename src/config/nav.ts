
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// Define a type for the icon name string
export type IconName = 
  | 'LayoutDashboard' 
  | 'ShoppingCart' 
  | 'Boxes' 
  | 'Users' 
  | 'Wrench' 
  | 'CreditCard' 
  | 'Settings'
  | 'History'
  | 'Truck' // For Suppliers/Purchases
  | 'PackagePlus' // For Purchases specifically
  | 'Receipt' // For Expenses
  | 'FileText'; // For Vouchers

export interface NavItem {
  title: string;
  href: string;
  icon: IconName; 
  label?: string;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: 'ShoppingCart',
  },
  {
    title: 'Sales History',
    href: '/sales-history',
    icon: 'History',
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: 'Boxes',
  },
  {
    title: 'Purchases',
    href: '/purchases',
    icon: 'PackagePlus', 
  },
  {
    title: 'Suppliers',
    href: '/suppliers',
    icon: 'Truck', 
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: 'Users',
  },
  {
    title: 'Services',
    href: '/services',
    icon: 'Wrench',
    disabled: false,
  },
  {
    title: 'Expenses', // New Expenses link
    href: '/expenses',
    icon: 'Receipt',
  },
  {
    title: 'Vouchers', // New Vouchers link
    href: '/vouchers',
    icon: 'FileText',
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: 'CreditCard',
    disabled: false,
  },
];

export const bottomNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings',
        icon: 'Settings',
        disabled: false, 
    }
]
