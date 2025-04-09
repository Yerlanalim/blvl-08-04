import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import AdminBreadcrumbs from '@/components/admin/admin-breadcrumbs';

export const metadata = {
  title: 'Административная панель - BizLevel',
  description: 'Панель управления для администраторов платформы BizLevel',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar - hidden on mobile, visible on larger screens */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r">
        <AdminSidebar />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Header */}
        <AdminHeader />
        
        {/* Content with breadcrumbs */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <AdminBreadcrumbs />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
} 