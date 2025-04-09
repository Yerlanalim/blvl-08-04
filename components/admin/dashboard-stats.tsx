'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRound, BookOpen, Video, FileText, CreditCard } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/database.types';

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  isLoading?: boolean;
};

type StatsData = {
  users: number;
  levels: number;
  videos: number;
  artifacts: number;
  payments: number;
};

function StatsCard({
  title,
  value,
  icon,
  description,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardStats({ isLoading = false }: { isLoading?: boolean }) {
  const [stats, setStats] = useState<StatsData>({
    users: 0,
    levels: 0,
    videos: 0,
    artifacts: 0,
    payments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClientComponentClient<Database>();
      
      try {
        // Get users count
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
          
        // Get levels count
        const { count: levelsCount, error: levelsError } = await supabase
          .from('levels')
          .select('*', { count: 'exact', head: true });
          
        // Get videos count
        const { count: videosCount, error: videosError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true });
          
        // Get artifacts count
        const { count: artifactsCount, error: artifactsError } = await supabase
          .from('artifacts')
          .select('*', { count: 'exact', head: true });
          
        // In a real app, you would also get payments count
        // For now, we'll use a placeholder
        const paymentsCount = 0;
        
        if (!usersError && !levelsError && !videosError && !artifactsError) {
          setStats({
            users: usersCount || 0,
            levels: levelsCount || 0,
            videos: videosCount || 0,
            artifacts: artifactsCount || 0,
            payments: paymentsCount,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    if (!isLoading) {
      fetchStats();
    }
  }, [isLoading]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <StatsCard
        title="Пользователи"
        value={stats.users}
        icon={<UserRound className="h-4 w-4" />}
        description="Всего зарегистрировано"
        isLoading={isLoading}
      />
      <StatsCard
        title="Уровни"
        value={stats.levels}
        icon={<BookOpen className="h-4 w-4" />}
        description="Активные курсы"
        isLoading={isLoading}
      />
      <StatsCard
        title="Видеоматериалы"
        value={stats.videos}
        icon={<Video className="h-4 w-4" />}
        description="Обучающие видео"
        isLoading={isLoading}
      />
      <StatsCard
        title="Материалы"
        value={stats.artifacts}
        icon={<FileText className="h-4 w-4" />}
        description="Загружаемые материалы"
        isLoading={isLoading}
      />
      <StatsCard
        title="Продажи"
        value={stats.payments}
        icon={<CreditCard className="h-4 w-4" />}
        description="Успешных платежей"
        isLoading={isLoading}
      />
    </div>
  );
} 