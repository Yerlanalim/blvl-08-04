'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Check, Filter, Search, SortAsc, SortDesc, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Artifact, Level } from '@/lib/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useDebounce } from '@/lib/hooks/use-debounce';

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

// Получение отображаемого имени файла из пути
const getFileName = (filePath: string): string => {
  const pathParts = filePath.split('/');
  return pathParts[pathParts.length - 1];
};

// Выделяем карточку артефакта в отдельный компонент для оптимизации ре-рендеров
const ArtifactCard = React.memo(({ 
  artifact, 
  isDownloaded, 
  isLoading, 
  onDownload
}: { 
  artifact: Artifact & { level_title: string }; 
  isDownloaded: boolean;
  isLoading: boolean;
  onDownload: (artifact: Artifact & { level_title: string }) => void;
}) => {
  // Мемоизируем обработчик скачивания для этого артефакта
  const handleDownloadClick = useCallback(() => {
    onDownload(artifact);
  }, [artifact, onDownload]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-start justify-between">
          <span>{artifact.title}</span>
          {isDownloaded && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
              <Check className="mr-1 h-3 w-3" />
              Скачано
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {artifact.description || 'Нет описания'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
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
        <div className="text-sm text-muted-foreground">
          <span>Уровень: </span>
          <Link href={`/level/${artifact.level_id}`} className="text-blue-500 hover:underline">
            {artifact.level_title}
          </Link>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <span>Добавлен: </span>
          {new Date(artifact.created_at).toLocaleDateString()}
        </div>
      </CardContent>
      <div className="px-6 pb-6 mt-auto">
        <Button 
          variant={isDownloaded ? "outline" : "default"} 
          className="w-full"
          onClick={handleDownloadClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : isDownloaded ? (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Скачать снова
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Скачать
            </>
          )}
        </Button>
      </div>
    </Card>
  );
});

ArtifactCard.displayName = 'ArtifactCard';

// Типы для параметров компонента
interface ArtifactsPageClientProps {
  artifacts: (Artifact & { level_title: string })[];
  downloadedMap: Record<string, any>;
  userId: string;
  levels: Level[];
  artifactsStats: {
    total: number;
    byLevel: Record<string, number>;
  };
}

type SortOption = 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';

export default function ArtifactsPageClient({ 
  artifacts, 
  downloadedMap, 
  userId, 
  levels,
  artifactsStats 
}: ArtifactsPageClientProps) {
  // Состояния для фильтрации и поиска
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebounce(searchInput, 300); // Добавляем debounce для повышения производительности
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<'all' | 'downloaded' | 'not-downloaded'>('all');
  
  // Состояние для отслеживания загрузки артефактов
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  
  // Состояние для хранения скачанных артефактов
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>(downloadedMap);

  // Собираем уникальные типы файлов - мемоизируем для производительности
  const uniqueFileTypes = useMemo(() => {
    const types = new Set<string>();
    artifacts.forEach(artifact => {
      if (artifact.file_type) {
        types.add(artifact.file_type.toUpperCase());
      }
    });
    return Array.from(types);
  }, [artifacts]);

  // Вычисляем статистику по фильтрам
  const filterStats = useMemo(() => {
    return {
      totalItems: artifacts.length,
      filteredItems: filteredArtifacts.length,
      downloadedItems: Object.keys(downloaded).length || Object.keys(downloadedMap).length
    };
  }, [artifacts.length, filteredArtifacts.length, downloaded, downloadedMap]);

  // Фильтрация артефактов
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(artifact => {
      // Фильтр по поисковому запросу
      const matchesSearch = searchTerm === '' || 
        artifact.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (artifact.description && artifact.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        artifact.level_title.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Фильтр по типу файла
      const matchesFileType = !selectedFileType || 
        artifact.file_type.toUpperCase() === selectedFileType;
      
      // Фильтр по уровню
      const matchesLevel = !selectedLevel || 
        artifact.level_id === selectedLevel;
      
      // Фильтр по статусу скачивания
      const isArtifactDownloaded = downloaded[artifact.id] || downloadedMap[artifact.id];
      
      const matchesDownloadStatus = viewMode === 'all' || 
        (viewMode === 'downloaded' && isArtifactDownloaded) || 
        (viewMode === 'not-downloaded' && !isArtifactDownloaded);
      
      return matchesSearch && matchesFileType && matchesLevel && matchesDownloadStatus;
    });
  }, [artifacts, searchTerm, selectedFileType, selectedLevel, viewMode, downloaded, downloadedMap]);

  // Сортировка артефактов
  const sortedArtifacts = useMemo(() => {
    try {
      return [...filteredArtifacts].sort((a, b) => {
        switch (sortBy) {
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'date-asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'date-desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'size-asc':
            return (a.file_size || 0) - (b.file_size || 0);
          case 'size-desc':
            return (b.file_size || 0) - (a.file_size || 0);
          default:
            return 0;
        }
      });
    } catch (error) {
      console.error('Error sorting artifacts:', error);
      return filteredArtifacts;
    }
  }, [filteredArtifacts, sortBy]);

  // Функция для скачивания артефакта
  const handleDownload = useCallback(async (artifact: Artifact & { level_title: string }) => {
    if (loading[artifact.id]) return;
    
    setLoading(prev => ({ ...prev, [artifact.id]: true }));
    
    try {
      // Запрос на получение URL для скачивания
      const response = await fetch(`/api/artifacts/download?artifactId=${artifact.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: Failed to get download URL`);
      }
      
      const { url } = await response.json();
      
      if (!url) {
        throw new Error('Download URL not available');
      }
      
      // Скачивание файла
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${artifact.title}.${artifact.file_type}`);
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
        const errorData = await markResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${markResponse.status}: Failed to mark artifact as downloaded`);
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
      
      // Показываем уведомление об ошибке с более подробной информацией
      toast({
        title: "Ошибка при скачивании",
        description: error instanceof Error ? error.message : "Не удалось скачать артефакт. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [artifact.id]: false }));
    }
  }, [loading, downloaded]);

  // Функция для сброса всех фильтров
  const resetFilters = useCallback(() => {
    setSearchInput('');
    setSelectedFileType(null);
    setSelectedLevel(null);
    setViewMode('all');
    setSortBy('date-desc');
  }, []);

  // Слушатель события для изменения поискового запроса
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Обработчики для выбора фильтров
  const handleFileTypeChange = useCallback((value: string) => {
    setSelectedFileType(value || null);
  }, []);
  
  const handleLevelChange = useCallback((value: string) => {
    setSelectedLevel(value || null);
  }, []);
  
  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value as 'all' | 'downloaded' | 'not-downloaded');
  }, []);
  
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as SortOption);
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок и поиск */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Учебные материалы</h1>
          <p className="text-muted-foreground mt-1">
            Всего доступно: {artifacts.length}, Скачано: {artifactsStats.total}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Поиск материалов..." 
              className="pl-8 w-full"
              value={searchInput}
              onChange={handleSearchChange}
            />
            {searchInput && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3" 
                onClick={() => setSearchInput('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Фильтры и сортировка */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2 flex-1">
          <Tabs value={viewMode} onValueChange={handleViewModeChange}>
            <TabsList>
              <TabsTrigger value="all">Все материалы</TabsTrigger>
              <TabsTrigger value="downloaded">Скачанные</TabsTrigger>
              <TabsTrigger value="not-downloaded">Не скачанные</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedFileType || ''} onValueChange={handleFileTypeChange}>
            <SelectTrigger className="w-auto">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {selectedFileType ? selectedFileType : 'Все типы файлов'}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все типы файлов</SelectItem>
              {uniqueFileTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel || ''} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-auto">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {selectedLevel ? levels.find(l => l.id === selectedLevel)?.title || 'Уровень' : 'Все уровни'}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все уровни</SelectItem>
              {levels.map(level => (
                <SelectItem key={level.id} value={level.id}>{level.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchInput || selectedFileType || selectedLevel || viewMode !== 'all') && (
            <Button variant="outline" onClick={resetFilters} className="gap-1">
              <X className="h-4 w-4" />
              Сбросить фильтры
            </Button>
          )}
        </div>

        <div className="flex gap-2 ml-auto">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-auto">
              <div className="flex items-center gap-1">
                {sortBy.includes('-asc') ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortBy.includes('title') ? 'По названию' : 
                 sortBy.includes('date') ? 'По дате' : 'По размеру'}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">По названию (А-Я)</SelectItem>
              <SelectItem value="title-desc">По названию (Я-А)</SelectItem>
              <SelectItem value="date-asc">По дате (старые)</SelectItem>
              <SelectItem value="date-desc">По дате (новые)</SelectItem>
              <SelectItem value="size-asc">По размеру (меньшие)</SelectItem>
              <SelectItem value="size-desc">По размеру (большие)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Результаты фильтрации */}
      {filteredArtifacts.length !== artifacts.length && (
        <p className="text-sm text-muted-foreground">
          Отображается {filteredArtifacts.length} из {artifacts.length} материалов
        </p>
      )}
      
      {/* Список артефактов */}
      {sortedArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Нет доступных материалов</h2>
              <p className="text-muted-foreground">
                {searchTerm || selectedFileType || selectedLevel || viewMode !== 'all' 
                  ? 'Материалы, соответствующие указанным критериям, не найдены. Попробуйте изменить параметры поиска.'
                  : 'Учебные материалы появятся здесь по мере прохождения уровней.'}
              </p>
              {(searchTerm || selectedFileType || selectedLevel || viewMode !== 'all') && (
                <Button variant="outline" onClick={resetFilters} className="mt-4">
                  Сбросить все фильтры
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedArtifacts.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              isDownloaded={downloaded[artifact.id] || downloadedMap[artifact.id]}
              isLoading={loading[artifact.id] || false}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
} 