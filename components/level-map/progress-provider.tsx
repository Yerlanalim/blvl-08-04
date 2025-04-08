'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { LevelWithProgress } from './level-map';
import { progressService } from '@/lib/services/progressService';
import { Level, UserProgress } from '@/lib/supabase/types';

type ProgressContextType = {
  levelsWithProgress: LevelWithProgress[];
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  getProgressForLevel: (levelId: string) => {
    progress: number;
    status: LevelWithProgress['status'];
  } | null;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  initialLevelsWithProgress: LevelWithProgress[];
  userId: string;
  children: React.ReactNode;
}

export function ProgressProvider({
  initialLevelsWithProgress,
  userId,
  children,
}: ProgressProviderProps) {
  const [levelsWithProgress, setLevelsWithProgress] = useState<LevelWithProgress[]>(
    initialLevelsWithProgress
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Создаем мемоизированную мапу для быстрого доступа к прогрессу по ID уровня
  const progressMap = useMemo(() => {
    const map = new Map<string, LevelWithProgress>();
    levelsWithProgress.forEach(level => {
      map.set(level.id, level);
    });
    return map;
  }, [levelsWithProgress]);
  
  // Получение прогресса для конкретного уровня
  const getProgressForLevel = useCallback((levelId: string) => {
    const level = progressMap.get(levelId);
    if (!level) return null;
    
    return {
      progress: level.progress,
      status: level.status
    };
  }, [progressMap]);

  // Функция для обновления прогресса уровней
  const refreshProgress = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Получаем базовые данные уровней
      const levels = levelsWithProgress.map(level => ({
        id: level.id,
        order_index: level.order_index,
        ...level
      }));
      
      // Получаем обновленные данные с прогрессом
      const updatedLevelsWithProgress = await progressService.prepareLevelsWithProgress(
        levels,
        userId
      );
      
      setLevelsWithProgress(updatedLevelsWithProgress);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, levelsWithProgress]);

  // Подписываемся на обновления прогресса в реальном времени
  useEffect(() => {
    if (!userId) return;
    
    // Кеш для предотвращения частых обновлений
    let lastUpdateTime = Date.now();
    const DEBOUNCE_TIME = 2000; // 2 секунды
    
    // Устанавливаем подписку на обновления прогресса
    const unsubscribe = progressService.subscribeToProgressUpdates(userId, (payload) => {
      const now = Date.now();
      
      // Вводим дебаунсинг для предотвращения слишком частых обновлений
      if (now - lastUpdateTime > DEBOUNCE_TIME) {
        refreshProgress();
        lastUpdateTime = now;
      }
    });
    
    // Отписываемся при размонтировании компонента
    return () => {
      unsubscribe();
    };
  }, [userId, refreshProgress]);

  // Мемоизируем значение контекста
  const contextValue = useMemo(() => ({ 
    levelsWithProgress, 
    isLoading, 
    refreshProgress,
    getProgressForLevel
  }), [levelsWithProgress, isLoading, refreshProgress, getProgressForLevel]);

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
} 