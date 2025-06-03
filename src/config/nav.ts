
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
  | 'History'; // Added History icon

export interface NavItem {
  title: string;
  href: string;
  icon: IconName; // Changed from LucideIcon to IconName (string)
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
    title: 'Sales History', // Added Sales History
    href: '/sales-history',
    icon: 'History',
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: 'Boxes',
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
        disabled: false, // Enabled settings page
    }
]
