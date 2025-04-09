import { createServerSupabaseClient } from '@/lib/supabase/client';
import { levelService } from '@/lib/services/levelService';
import { artifactService } from '@/lib/services/artifactService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Check, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Artifact } from '@/lib/supabase/types';

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

  // Форматирование размера файла
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Учебные материалы</h1>
        
        <div className="flex items-center gap-2">
          <Input 
            type="search" 
            placeholder="Поиск материалов..." 
            className="w-full sm:w-[300px]"
          />
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="flex gap-1 items-center">
          <Filter className="h-4 w-4" />
          Все типы
        </Button>
        
        <Button variant="outline" size="sm">PDF</Button>
        <Button variant="outline" size="sm">DOCX</Button>
        <Button variant="outline" size="sm">XLSX</Button>
        <Button variant="outline" size="sm">ZIP</Button>
      </div>
      
      {allArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Нет доступных материалов</h2>
              <p className="text-muted-foreground">
                Учебные материалы появятся здесь по мере прохождения уровней.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allArtifacts.map((artifact) => {
            const isDownloaded = downloadedMap.has(artifact.id);
            
            return (
              <Card key={artifact.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{artifact.title}</CardTitle>
                  <CardDescription>
                    {artifact.description || 'Нет описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      {artifact.file_type.toUpperCase()}
                    </div>
                    {artifact.file_size && (
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(artifact.file_size)}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Уровень: </span>
                    <Link href={`/level/${artifact.level_id}`} className="text-blue-500 hover:underline">
                      {artifact.level_title}
                    </Link>
                  </div>
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                  <Link href={`/level/${artifact.level_id}`}>
                    <Button 
                      variant={isDownloaded ? "outline" : "default"} 
                      className="w-full"
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Скачано
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Открыть уровень
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 