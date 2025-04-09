'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Check, Loader2 } from 'lucide-react';
import { Artifact, UserArtifact } from '@/lib/supabase/types';
import { toast } from '@/components/ui/use-toast';

interface ArtifactSectionClientProps {
  artifacts: Artifact[];
  userId: string;
  levelId: string;
  downloadedArtifacts: UserArtifact[];
}

// Выделяем отдельный компонент для артефакта
const ArtifactCard = ({ 
  artifact, 
  isDownloaded, 
  isLoading, 
  onDownload
}: { 
  artifact: Artifact; 
  isDownloaded: boolean;
  isLoading: boolean;
  onDownload: (artifact: Artifact) => void;
}) => {
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

  // Получение отображаемого имени файла из пути
  const getFileName = (filePath: string): string => {
    const pathParts = filePath.split('/');
    return pathParts[pathParts.length - 1];
  };

  return (
    <Card key={artifact.id}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{artifact.title}</CardTitle>
        <CardDescription>
          {artifact.description || 'Нет описания'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {artifact.file_type.toUpperCase()}
            </div>
            {artifact.file_size && (
              <p className="text-sm text-muted-foreground">
                {formatFileSize(artifact.file_size)}
              </p>
            )}
            {artifact.file_path && (
              <p className="text-sm text-muted-foreground hidden md:block">
                {getFileName(artifact.file_path)}
              </p>
            )}
          </div>
          
          <Button 
            variant={isDownloaded ? "outline" : "default"} 
            size="sm"
            onClick={() => onDownload(artifact)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : isDownloaded ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Скачано
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Скачать
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ArtifactSectionClient({ 
  artifacts, 
  userId, 
  levelId,
  downloadedArtifacts 
}: ArtifactSectionClientProps) {
  // Состояние для отслеживания загрузки артефактов
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Мемоизируем состояние скачанных артефактов для производительности
  const downloadedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    
    // Устанавливаем начальные значения из пропсов
    downloadedArtifacts.forEach((userArtifact) => {
      map[userArtifact.artifact_id] = true;
    });
    
    return map;
  }, [downloadedArtifacts]);
  
  // Мемоизированное состояние для отслеживания скачанных артефактов после взаимодействия пользователя
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>(downloadedMap);

  // Обработчик скачивания артефакта
  const handleDownload = useCallback(async (artifact: Artifact) => {
    if (loading[artifact.id] || downloaded[artifact.id]) return;
    
    setLoading(prev => ({ ...prev, [artifact.id]: true }));
    
    try {
      // Запрос на получение URL для скачивания
      const response = await fetch(`/api/artifacts/download?artifactId=${artifact.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      
      const { url } = await response.json();
      
      // Скачивание файла
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', artifact.title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Отмечаем артефакт как скачанный
      const markResponse = await fetch(`/api/artifacts/mark-downloaded`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artifactId: artifact.id })
      });
      
      if (!markResponse.ok) {
        throw new Error('Failed to mark artifact as downloaded');
      }
      
      // Обновляем состояние
      setDownloaded(prev => ({ ...prev, [artifact.id]: true }));
      
      // Показываем уведомление об успешном скачивании
      toast({
        title: "Артефакт скачан",
        description: `${artifact.title} был успешно скачан.`,
      });
    } catch (error) {
      console.error('Error downloading artifact:', error);
      
      // Показываем уведомление об ошибке
      toast({
        title: "Ошибка при скачивании",
        description: "Не удалось скачать артефакт. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [artifact.id]: false }));
    }
  }, [loading, downloaded]);

  // Если нет артефактов, показываем сообщение
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-center text-muted-foreground">Нет артефактов для этого уровня</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          isDownloaded={downloadedMap[artifact.id] || downloaded[artifact.id]}
          isLoading={loading[artifact.id]}
          onDownload={handleDownload}
        />
      ))}
    </div>
  );
} 