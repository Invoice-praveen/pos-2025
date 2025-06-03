import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, Boxes, Users, Wrench, CreditCard, Settings } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  items?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Services',
    href: '/services',
    icon: Wrench,
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: CreditCard,
  },
];

export const bottomNavItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        disabled: true, // Placeholder
    }
]
