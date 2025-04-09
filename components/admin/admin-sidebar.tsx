'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  FileVideo, 
  FileText, 
  Settings, 
  CreditCard 
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const routes = [
    {
      href: '/admin',
      label: 'Дашборд',
      icon: LayoutDashboard,
      exact: true
    },
    {
      href: '/admin/users',
      label: 'Пользователи',
      icon: Users,
      exact: false
    },
    {
      href: '/admin/levels',
      label: 'Уровни',
      icon: Layers,
      exact: false
    },
    {
      href: '/admin/videos',
      label: 'Видео',
      icon: FileVideo,
      exact: false
    },
    {
      href: '/admin/artifacts',
      label: 'Материалы',
      icon: FileText,
      exact: false
    },
    {
      href: '/admin/payments',
      label: 'Платежи',
      icon: CreditCard,
      exact: false
    },
    {
      href: '/admin/settings',
      label: 'Настройки',
      icon: Settings,
      exact: false
    },
  ];

  return (
    <div className="h-full w-full py-6 px-3 flex flex-col bg-card">
      <div className="px-3 mb-8">
        <h2 className="text-lg font-semibold">
          BizLevel Admin
        </h2>
      </div>
      
      <div className="flex-1 space-y-1 overflow-auto">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              {
                'bg-accent text-accent-foreground': route.exact 
                  ? pathname === route.href
                  : pathname.startsWith(route.href),
                'text-muted-foreground': route.exact 
                  ? pathname !== route.href
                  : !pathname.startsWith(route.href),
              }
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto pt-6 px-3">
        <div className="text-xs text-muted-foreground">
          Версия 1.0.0
        </div>
      </div>
    </div>
  );
} 