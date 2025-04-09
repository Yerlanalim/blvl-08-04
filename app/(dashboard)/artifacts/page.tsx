import { createServerSupabaseClient } from '@/lib/supabase/client';
import { levelService } from '@/lib/services/levelService';
import { artifactService } from '@/lib/services/artifactService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Check, Filter, Search, SortAsc, SortDesc, Filter as FilterIcon } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Artifact, Level } from '@/lib/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ArtifactsPageClient from './artifacts-page-client';

// Функция для форматирования размера файла
const formatFileSize = (sizeInBytes: number | null): string => {
  if (!sizeInBytes) return '0 KB';
  
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
  }
};

export default async function ArtifactsPage() {
  // Получаем пользователя
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Учебные материалы</h1>
        </div>
        
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Доступ ограничен</h2>
              <p className="text-muted-foreground">
                Пожалуйста, войдите в систему, чтобы получить доступ к учебным материалам.
              </p>
              <Link href="/login">
                <Button>Войти</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Получаем все доступные уровни
  const levels = await levelService.getAllLevels();

  // Создаем массив для хранения всех артефактов
  let allArtifacts: (Artifact & { level_title: string })[] = [];

  // Получаем артефакты для каждого уровня и добавляем их в общий список
  for (const level of levels) {
    const levelArtifacts = await artifactService.getLevelArtifacts(level.id);
    
    // Добавляем название уровня к каждому артефакту
    const artifactsWithLevelTitle = levelArtifacts.map(artifact => ({
      ...artifact,
      level_title: level.title
    }));
    
    allArtifacts = [...allArtifacts, ...artifactsWithLevelTitle];
  }

  // Получаем скачанные артефакты пользователя
  const downloadedArtifacts = await artifactService.getUserArtifacts(user.id);
  
  // Создаем Map для быстрого доступа к скачанным артефактам
  const downloadedMap = new Map(
    downloadedArtifacts.map(item => [item.artifact_id, item])
  );

  // Получаем статистику по артефактам
  const artifactsStats = await artifactService.getUserArtifactsStats(user.id);

  return <ArtifactsPageClient 
    artifacts={allArtifacts} 
    downloadedMap={Object.fromEntries(downloadedMap)} 
    userId={user.id} 
    levels={levels}
    artifactsStats={artifactsStats}
  />;
} 