'use client';

import { Level } from '@/lib/supabase/types';
import { LevelCard } from './level-card';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useCallback } from 'react';
import { useProgress } from './progress-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LevelWithProgress extends Level {
  progress: number;
  status: 'available' | 'in_progress' | 'completed' | 'locked';
  videosCompleted: number;
  totalVideos: number;
}

interface LevelMapProps {
  levels?: LevelWithProgress[];
}

export function LevelMap({ levels: initialLevels }: LevelMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Используем контекст прогресса (если он доступен)
  const progressContext = (() => {
    try {
      return useProgress();
    } catch (e) {
      // Если контекст недоступен, просто возвращаем initialLevels
      return { levelsWithProgress: initialLevels || [], isLoading: false };
    }
  })();
  
  const { levelsWithProgress, isLoading } = progressContext;
  
  // Используем уровни из контекста прогресса, если они доступны, иначе используем initialLevels
  const levels = useMemo(() => 
    levelsWithProgress.length > 0 ? levelsWithProgress : (initialLevels || []),
    [levelsWithProgress, initialLevels]
  );
  
  // Мемоизируем фильтрацию уровней для повышения производительности
  const filteredLevels = useMemo(() => {
    if (!searchQuery.trim()) return levels;
    
    const lowerQuery = searchQuery.toLowerCase().trim();
    return levels.filter(level => 
      level.title.toLowerCase().includes(lowerQuery) ||
      (level.description && level.description.toLowerCase().includes(lowerQuery))
    );
  }, [levels, searchQuery]);
  
  // Мемоизируем группировку уровней по статусу для улучшения UX
  const groupedLevels = useMemo(() => {
    // Группируем уровни по их статусу для логического разделения
    const grouped = {
      completed: [] as LevelWithProgress[],
      in_progress: [] as LevelWithProgress[],
      available: [] as LevelWithProgress[],
      locked: [] as LevelWithProgress[]
    };
    
    // Наполняем группы
    filteredLevels.forEach(level => {
      grouped[level.status].push(level);
    });
    
    // Сортируем внутри групп по порядковому индексу
    const sortedGroups = {
      completed: grouped.completed.sort((a, b) => a.order_index - b.order_index),
      in_progress: grouped.in_progress.sort((a, b) => a.order_index - b.order_index),
      available: grouped.available.sort((a, b) => a.order_index - b.order_index),
      locked: grouped.locked.sort((a, b) => a.order_index - b.order_index)
    };
    
    return sortedGroups;
  }, [filteredLevels]);
  
  // Объединяем все уровни в порядке: в процессе, доступные, пройденные, заблокированные
  const orderedLevels = useMemo(() => [
    ...groupedLevels.in_progress,
    ...groupedLevels.available,
    ...groupedLevels.completed,
    ...groupedLevels.locked
  ], [groupedLevels]);
  
  // Реагируем на изменения в поле поиска
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  // Очищаем поиск
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Карта уровней</h1>
        <div className="w-full sm:w-64 relative">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск уровней..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 pr-8 w-full"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full aspect-square rounded-l-none"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative">
        {isLoading ? (
          // Показываем скелетон при загрузке
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {searchQuery ? (
              <>
                <p>Уровни не найдены по запросу "{searchQuery}"</p>
                <Button 
                  onClick={clearSearch} 
                  variant="outline"
                  className="mt-2"
                >
                  Сбросить поиск
                </Button>
              </>
            ) : (
              <p>Уровни не найдены. Попробуйте позднее.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orderedLevels.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                progress={level.progress}
                status={level.status}
                videosCompleted={level.videosCompleted}
                totalVideos={level.totalVideos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 