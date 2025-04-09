'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  
  // Skip if we're on the admin homepage
  if (pathname === '/admin') {
    return null;
  }
  
  // Split pathname and remove empty strings
  const paths = pathname.split('/').filter(Boolean);
  
  // Build breadcrumbs
  const breadcrumbs = [
    { href: '/admin', label: 'Главная', icon: Home },
    ...paths.slice(1).map((path, index) => {
      const href = `/${paths.slice(0, index + 2).join('/')}`;
      // Convert path to title case and replace hyphens with spaces
      const label = path.charAt(0).toUpperCase() + 
        path.slice(1).replace(/-/g, ' ');
      
      return { href, label };
    }),
  ];

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4" aria-label="Навигация">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
            
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">
                {breadcrumb.icon && <breadcrumb.icon className="h-3.5 w-3.5 inline-block mr-1" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="hover:text-foreground transition-colors flex items-center"
              >
                {breadcrumb.icon && <breadcrumb.icon className="h-3.5 w-3.5 inline-block mr-1" />}
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 