"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Home, User, FileText, MessageSquare, HelpCircle } from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCompact?: boolean;
}

export function NavItem({ href, label, icon, isCompact = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary"
        )}
      >
        {icon}
        {!isCompact && <span>{label}</span>}
        {isCompact && <span className="sr-only">{label}</span>}
      </span>
    </Link>
  );
}

export interface NavItemDefinition {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export const mainNavItems: NavItemDefinition[] = [
  {
    href: "/",
    label: "Карта уровней",
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: <User className="h-5 w-5" />,
  },
  {
    href: "/artifacts",
    label: "Артефакты",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    href: "/chat",
    label: "Чат",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    href: "/faq",
    label: "FAQ",
    icon: <HelpCircle className="h-5 w-5" />,
  },
]; 