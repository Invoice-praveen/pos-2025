
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, IconName } from "@/config/nav";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Boxes, 
  Users, 
  Wrench, 
  CreditCard, 
  Settings,
  History, // Added History
  type LucideIcon
} from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

// Map icon names to actual components
const iconMap: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Wrench,
  CreditCard,
  Settings,
  History, // Added History
};

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu>
      {items.map((item, index) => {
        const IconComponent = iconMap[item.icon];
        const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
        
        return (
          item.href && IconComponent && (
            <SidebarMenuItem key={index}>
              <Link href={item.disabled ? "#" : item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild={!item.disabled}
                  isActive={isActive}
                  className={cn(
                    "w-full justify-start",
                    item.disabled && "cursor-not-allowed opacity-80"
                  )}
                  aria-disabled={item.disabled}
                  tabIndex={item.disabled ? -1 : undefined}
                  tooltip={item.title}
                >
                  <a> {/* Anchor tag is child of SidebarMenuButton when asChild is true and legacyBehavior is used */}
                    <IconComponent className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.label && (
                      <span
                        className={cn(
                          "ml-auto",
                          isActive && "text-background dark:text-white"
                        )}
                      >
                        {item.label}
                      </span>
                    )}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        );
      })}
    </SidebarMenu>
  );
}

