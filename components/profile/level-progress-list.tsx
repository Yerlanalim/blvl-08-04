import React, { useState } from 'react';
import { LevelWithProgress } from '@/components/level-map/level-map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Search, SlidersHorizontal, XCircle } from 'lucide-react';
import Link from 'next/link';

interface LevelProgressListProps {
  levelsWithProgress: LevelWithProgress[];
  userId: string;
}

/**
 * Компонент отображения списка уровней с прогрессом
 */
export default function LevelProgressList({ levelsWithProgress, userId }: LevelProgressListProps) {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация уровней по статусу и поисковому запросу
  const filteredLevels = levelsWithProgress.filter((level) => {
    const matchesFilter = 
      filter === 'all' || 
      level.status === filter || 
      (filter === 'available' && level.status === 'available');
    
    const matchesSearch = 
      !searchTerm ||
      level.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (level.description && level.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Сортировка уровней: сначала в процессе, затем доступные, затем завершенные
  const sortedLevels = [...filteredLevels].sort((a, b) => {
    const statusOrder = {
      in_progress: 0,
      available: 1,
      completed: 2,
      locked: 3,
    };
    
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Прогресс по уровням</CardTitle>
          <CardDescription>
            Подробная информация о вашем прогрессе по всем уровням
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск уровней..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <XCircle
                  className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Все
              </Button>
              <Button
                variant={filter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('in_progress')}
              >
                В процессе
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Завершенные
              </Button>
              <Button
                variant={filter === 'available' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('available')}
              >
                Доступные
              </Button>
            </div>
          </div>

          {sortedLevels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                {searchTerm 
                  ? 'Не найдено уровней, соответствующих поисковому запросу' 
                  : 'Не найдено уровней с выбранным статусом'}
              </div>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchTerm('')}
                >
                  Сбросить поиск
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedLevels.map((level) => (
                <div key={level.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg flex items-center">
                        {level.title}
                        <StatusBadge status={level.status} />
                      </h3>
                      {level.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {level.description}
                        </p>
                      )}
                    </div>
                    {level.status !== 'locked' && (
                      <Link href={`/level/${level.id}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          {level.status === 'completed' ? 'Повторить' : 'Продолжить'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Прогресс</span>
                      <span>{level.progress}%</span>
                    </div>
                    <Progress value={level.progress} className="h-2" />
                  </div>
                  {level.totalVideos > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Видео: {level.videosCompleted}/{level.totalVideos} просмотрено
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Вспомогательный компонент для отображения статуса уровня
function StatusBadge({ status }: { status: string }) {
  switch(status) {
    case 'completed':
      return <Badge className="ml-2 bg-green-600">Завершен</Badge>;
    case 'in_progress':
      return <Badge className="ml-2 bg-blue-600">В процессе</Badge>;
    case 'available':
      return <Badge className="ml-2 bg-yellow-600">Доступен</Badge>;
    case 'locked':
      return <Badge className="ml-2 bg-gray-600">Заблокирован</Badge>;
    default:
      return null;
  }
} 