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
  newlyUnlockedLevels: Set<string>;
  markLevelSeen: (levelId: string) => void;
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
  
  // Добавляем отслеживание недавно разблокированных уровней
  const [newlyUnlockedLevels, setNewlyUnlockedLevels] = useState<Set<string>>(new Set());
  
  // Метод для отметки уровня как просмотренного (удаление из списка недавно разблокированных)
  const markLevelSeen = useCallback((levelId: string) => {
    setNewlyUnlockedLevels(prev => {
      const updated = new Set(prev);
      updated.delete(levelId);
      return updated;
    });
  }, []);
  
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
      
      // Создаем мапу текущих статусов для сравнения
      const currentStatusMap = new Map<string, string>();
      levelsWithProgress.forEach(level => {
        currentStatusMap.set(level.id, level.status);
      });
      
      // Получаем обновленные данные с прогрессом
      const updatedLevelsWithProgress = await progressService.prepareLevelsWithProgress(
        levels,
        userId
      );
      
      // Проверяем, появились ли новые доступные уровни
      const newlyUnlocked = new Set(newlyUnlockedLevels);
      updatedLevelsWithProgress.forEach(level => {
        // Если уровень изменил статус с locked на available или in_progress,
        // то считаем его недавно разблокированным
        const previousStatus = currentStatusMap.get(level.id);
        if (previousStatus === 'locked' && 
            (level.status === 'available' || level.status === 'in_progress')) {
          newlyUnlocked.add(level.id);
        }
      });
      
      // Обновляем список недавно разблокированных уровней
      if (newlyUnlocked.size !== newlyUnlockedLevels.size) {
        setNewlyUnlockedLevels(newlyUnlocked);
      }
      
      setLevelsWithProgress(updatedLevelsWithProgress);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, levelsWithProgress, newlyUnlockedLevels]);

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

  // Сохраняем список недавно разблокированных уровней в localStorage
  useEffect(() => {
    try {
      if (newlyUnlockedLevels.size > 0) {
        localStorage.setItem(
          `newly_unlocked_${userId}`, 
          JSON.stringify(Array.from(newlyUnlockedLevels))
        );
      }
    } catch (error) {
      console.error('Error saving newly unlocked levels to localStorage:', error);
    }
  }, [newlyUnlockedLevels, userId]);
  
  // Загружаем список недавно разблокированных уровней из localStorage при инициализации
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`newly_unlocked_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNewlyUnlockedLevels(new Set(parsed));
        }
      }
    } catch (error) {
      console.error('Error loading newly unlocked levels from localStorage:', error);
    }
  }, [userId]);

  // Мемоизируем значение контекста
  const contextValue = useMemo(() => ({ 
    levelsWithProgress, 
    isLoading, 
    refreshProgress,
    getProgressForLevel,
    newlyUnlockedLevels,
    markLevelSeen
  }), [
    levelsWithProgress, 
    isLoading, 
    refreshProgress, 
    getProgressForLevel, 
    newlyUnlockedLevels,
    markLevelSeen
  ]);

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