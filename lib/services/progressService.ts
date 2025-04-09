import { createServerSupabaseClient, createBrowserSupabaseClient } from '@/lib/supabase/client';
import { ProgressStatus, UserProgress, UserVideoProgress } from '@/lib/supabase/types';
import { LevelWithProgress } from '@/components/level-map/level-map';
import { cache } from 'react';

/**
 * Сервис для работы с прогрессом пользователя
 */
export const progressService = {
  /**
   * Получает прогресс пользователя по всем уровням
   * @param userId ID пользователя
   * @returns Массив записей о прогрессе пользователя
   */
  getUserProgress: cache(async (userId: string): Promise<UserProgress[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
    
    return data || [];
  }),
  
  /**
   * Получает прогресс пользователя по конкретному уровню
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Запись о прогрессе пользователя или null, если прогресс не найден
   */
  getUserLevelProgress: cache(async (userId: string, levelId: string): Promise<UserProgress | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Ошибка "нет результатов"
        return null;
      }
      console.error(`Error fetching user progress for level ${levelId}:`, error);
      throw new Error(`Failed to fetch user progress for level ${levelId}`);
    }
    
    return data;
  }),
  
  /**
   * Получает прогресс пользователя по видео
   * @param userId ID пользователя
   * @param levelId ID уровня (опционально, для фильтрации)
   * @returns Массив записей о прогрессе пользователя по видео
   */
  getUserVideoProgress: cache(async (userId: string, levelId?: string): Promise<UserVideoProgress[]> => {
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('user_video_progress')
      .select('*, videos(level_id)')
      .eq('user_id', userId);
      
    if (levelId) {
      query = query.eq('videos.level_id', levelId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user video progress:', error);
      throw new Error('Failed to fetch user video progress');
    }
    
    return data || [];
  }),
  
  /**
   * Вычисляет статус уровня на основе прогресса и порядкового номера
   * @param levelOrderIndex Порядковый номер уровня
   * @param userProgress Массив записей о прогрессе пользователя
   * @param allLevels Массив всех уровней
   * @returns Статус уровня (locked, available, in_progress, completed)
   */
  calculateLevelStatus: (
    levelOrderIndex: number, 
    userProgress: UserProgress[],
    allLevels: { id: string; order_index: number }[]
  ): 'locked' | 'available' | 'in_progress' | 'completed' => {
    try {
      // Находим уровень по его порядковому номеру
      const currentLevel = allLevels.find(level => level.order_index === levelOrderIndex);
      if (!currentLevel) return 'locked';
      
      // Находим прогресс для текущего уровня
      const progress = userProgress.find(p => p.level_id === currentLevel.id);
      
      // Если уровень первый или предыдущий уровень пройден, он доступен
      const isFirstLevel = levelOrderIndex === 1;
      
      // Находим предыдущий уровень
      const prevLevel = allLevels.find(level => level.order_index === levelOrderIndex - 1);
      
      // Находим прогресс для предыдущего уровня
      const prevLevelProgress = prevLevel 
        ? userProgress.find(p => p.level_id === prevLevel.id)
        : null;
      
      // Проверяем, пройден ли предыдущий уровень
      const isPrevLevelCompleted = !prevLevel || 
        (prevLevelProgress && prevLevelProgress.status === 'completed');
      
      // Если есть запись о прогрессе, возвращаем соответствующий статус
      if (progress) {
        return progress.status as 'in_progress' | 'completed';
      }
      
      // Если уровень первый или предыдущий пройден, он доступен
      if (isFirstLevel || isPrevLevelCompleted) {
        return 'available';
      }
      
      // В остальных случаях уровень заблокирован
      return 'locked';
    } catch (error) {
      console.error('Error calculating level status:', error);
      // В случае ошибки считаем уровень заблокированным для безопасности
      return 'locked';
    }
  },
  
  /**
   * Обновляет прогресс пользователя по уровню
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @param status Статус прогресса
   * @param completedPercentage Процент выполнения
   * @param quizScore Результат теста (если применимо)
   * @returns Обновленная запись о прогрессе
   */
  updateLevelProgress: async (
    userId: string, 
    levelId: string, 
    status: ProgressStatus, 
    completedPercentage: number,
    quizScore?: number | null
  ): Promise<UserProgress> => {
    const supabase = createBrowserSupabaseClient();
    
    try {
      // Проверяем валидность входных данных
      if (!userId || !levelId) {
        throw new Error('Invalid userId or levelId');
      }
      
      // Проверяем, существует ли запись о прогрессе
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_id', levelId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching progress for level ${levelId}:`, fetchError);
        throw new Error(`Failed to fetch progress for level ${levelId}`);
      }
      
      const progressData = {
        user_id: userId,
        level_id: levelId,
        status,
        completed_percentage: completedPercentage,
        quiz_score: quizScore,
        last_updated_at: new Date().toISOString()
      };
      
      if (existingProgress) {
        // Обновляем существующую запись
        const { data, error } = await supabase
          .from('user_progress')
          .update(progressData)
          .eq('id', existingProgress.id)
          .select()
          .single();
          
        if (error) {
          console.error(`Error updating progress for level ${levelId}:`, error);
          throw new Error(`Failed to update progress for level ${levelId}`);
        }
        
        return data;
      } else {
        // Создаем новую запись
        const { data, error } = await supabase
          .from('user_progress')
          .insert(progressData)
          .select()
          .single();
          
        if (error) {
          console.error(`Error creating progress for level ${levelId}:`, error);
          throw new Error(`Failed to create progress for level ${levelId}`);
        }
        
        return data;
      }
    } catch (error) {
      console.error(`Error in updateLevelProgress for level ${levelId}:`, error);
      throw error; // Прокидываем ошибку выше для обработки вызывающим кодом
    }
  },
  
  /**
   * Обновляет прогресс просмотра видео
   * @param userId ID пользователя
   * @param videoId ID видео
   * @param watchedSeconds Количество просмотренных секунд
   * @param isCompleted Флаг завершения просмотра
   * @returns Обновленная запись о прогрессе видео
   */
  updateVideoProgress: async (
    userId: string, 
    videoId: string, 
    watchedSeconds: number,
    lastPosition: number,
    isCompleted: boolean
  ) => {
    const supabase = createBrowserSupabaseClient();
    
    // Проверяем, существует ли запись о прогрессе
    const { data: existingProgress } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();
    
    const progressData = {
      user_id: userId,
      video_id: videoId,
      watched_seconds: watchedSeconds,
      last_position: lastPosition,
      is_completed: isCompleted
    };
    
    if (existingProgress) {
      // Обновляем существующую запись
      const { data, error } = await supabase
        .from('user_video_progress')
        .update(progressData)
        .eq('id', existingProgress.id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating video progress for video ${videoId}:`, error);
        throw new Error(`Failed to update video progress for video ${videoId}`);
      }
      
      return data;
    } else {
      // Создаем новую запись
      const { data, error } = await supabase
        .from('user_video_progress')
        .insert(progressData)
        .select()
        .single();
        
      if (error) {
        console.error(`Error creating video progress for video ${videoId}:`, error);
        throw new Error(`Failed to create video progress for video ${videoId}`);
      }
      
      return data;
    }
  },
  
  /**
   * Подписка на изменения прогресса пользователя
   * @param userId ID пользователя
   * @param callback Функция обратного вызова при получении обновлений
   * @returns Функция для отписки
   */
  subscribeToProgressUpdates: (userId: string, callback: (payload: any) => void) => {
    const supabase = createBrowserSupabaseClient();
    
    const subscription = supabase
      .channel('user_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
    
    // Возвращаем функцию для отписки
    return () => {
      supabase.removeChannel(subscription);
    };
  },
  
  /**
   * Подготавливает данные уровней с прогрессом для отображения в интерфейсе
   * @param levels Массив всех уровней
   * @param userId ID пользователя
   * @returns Массив уровней с добавленной информацией о прогрессе
   */
  prepareLevelsWithProgress: async (
    levels: Array<{ id: string; order_index: number; [key: string]: any }>, 
    userId: string
  ): Promise<LevelWithProgress[]> => {
    // Получаем прогресс пользователя по всем уровням
    const userProgress = await progressService.getUserProgress(userId);
    
    // Получаем прогресс по видео для вычисления детального прогресса
    const videoProgress = await progressService.getUserVideoProgress(userId);
    
    return Promise.all(levels.map(async (level) => {
      // Получаем видео для уровня для подсчета общего количества
      const levelVideos = await progressService.getUserVideoProgress(userId, level.id);
      
      // Находим прогресс для текущего уровня
      const progress = userProgress.find(p => p.level_id === level.id);
      
      // Вычисляем статус уровня
      const status = progressService.calculateLevelStatus(
        level.order_index,
        userProgress,
        levels
      );
      
      // Вычисляем количество завершенных видео
      const completedVideos = levelVideos.filter(v => v.is_completed).length;
      
      // Общее количество видео в уровне
      const totalVideos = await progressService.getLevelVideoCount(level.id);
      
      // Вычисляем процент прогресса
      const progressPercentage = progress
        ? progress.completed_percentage
        : status === 'completed'
          ? 100
          : totalVideos > 0
            ? Math.round((completedVideos / totalVideos) * 100)
            : 0;
      
      return {
        ...level,
        progress: progressPercentage,
        status,
        videosCompleted: completedVideos,
        totalVideos
      };
    }));
  },
  
  /**
   * Получает количество видео в уровне
   * @param levelId ID уровня
   * @returns Количество видео в уровне
   */
  getLevelVideoCount: cache(async (levelId: string): Promise<number> => {
    const supabase = createServerSupabaseClient();
    
    const { count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', levelId)
      .eq('status', 'published');
      
    if (error) {
      console.error(`Error counting videos for level ${levelId}:`, error);
      throw new Error(`Failed to count videos for level ${levelId}`);
    }
    
    return count || 0;
  }),
  
  /**
   * Проверяет, скачал ли пользователь артефакт
   * @param userId ID пользователя
   * @param artifactId ID артефакта
   * @returns true, если пользователь скачал артефакт
   */
  hasUserDownloadedArtifact: cache(async (userId: string, artifactId: string): Promise<boolean> => {
    const supabase = createServerSupabaseClient();
    
    const { count, error } = await supabase
      .from('user_artifacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('artifact_id', artifactId);
      
    if (error) {
      console.error(`Error checking if user downloaded artifact ${artifactId}:`, error);
      throw new Error(`Failed to check if user downloaded artifact ${artifactId}`);
    }
    
    return (count || 0) > 0;
  }),
  
  /**
   * Отмечает артефакт как скачанный пользователем
   * @param userId ID пользователя
   * @param artifactId ID артефакта
   */
  markArtifactAsDownloaded: async (userId: string, artifactId: string) => {
    const supabase = createBrowserSupabaseClient();
    
    // Проверяем, существует ли запись о скачивании
    const { count } = await supabase
      .from('user_artifacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('artifact_id', artifactId);
    
    if ((count || 0) === 0) {
      // Создаем новую запись
      const { error } = await supabase
        .from('user_artifacts')
        .insert({
          user_id: userId,
          artifact_id: artifactId,
          downloaded_at: new Date().toISOString()
        });
        
      if (error) {
        console.error(`Error marking artifact ${artifactId} as downloaded:`, error);
        throw new Error(`Failed to mark artifact ${artifactId} as downloaded`);
      }
    }
  },
  
  /**
   * Проверяет условия для завершения уровня
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Объект с флагами выполнения условий и общим процентом завершения
   */
  checkLevelCompletionConditions: async (userId: string, levelId: string) => {
    try {
      // Получаем все данные, необходимые для проверки условий
      const videoService = (await import('@/lib/services/videoService')).videoService;
      const testService = (await import('@/lib/services/testService')).testService;
      const artifactService = (await import('@/lib/services/artifactService')).artifactService;
      
      // Проверка видео (минимум 85% каждого видео)
      const videosCompleted = await videoService.areAllLevelVideosCompleted(userId, levelId);
      const videoProgress = await videoService.calculateLevelVideoProgress(userId, levelId);
      
      // Проверка тестов (минимальный порог - 70% правильных ответов)
      const testsPassed = await testService.hasPassedLevelTests(userId, levelId);
      const testScore = await testService.getLevelTestScore(userId, levelId);
      
      // Проверка артефактов (скачаны все обязательные)
      const artifactsDownloaded = await artifactService.areAllRequiredArtifactsDownloaded(userId, levelId);
      const artifactsProgress = await artifactService.calculateLevelArtifactsProgress(userId, levelId);
      
      // Общий процент выполнения
      const overallProgress = progressService.calculateOverallLevelCompletion(
        videoProgress,
        testScore,
        artifactsProgress
      );
      
      // Уровень считается выполненным, если выполнены все условия
      const isCompleted = videosCompleted && testsPassed && artifactsDownloaded;
      
      return {
        videosCompleted,
        testsPassed,
        artifactsDownloaded,
        isCompleted,
        videoProgress,
        testScore,
        artifactsProgress,
        overallProgress
      };
    } catch (error) {
      console.error('Error checking level completion conditions:', error);
      // В случае ошибки возвращаем дефолтные значения
      return {
        videosCompleted: false,
        testsPassed: false,
        artifactsDownloaded: false,
        isCompleted: false,
        videoProgress: 0,
        testScore: null,
        artifactsProgress: 0,
        overallProgress: 0
      };
    }
  },
  
  /**
   * Рассчитывает общий процент выполнения уровня
   * @param videoProgress Процент просмотра видео
   * @param testScore Результат тестов
   * @param artifactsProgress Процент скачанных артефактов
   * @returns Общий процент выполнения уровня
   */
  calculateOverallLevelCompletion: (
    videoProgress: number,
    testScore: number | null,
    artifactsProgress: number
  ): number => {
    // Если тесты не пройдены, считаем их как 0
    const normalizedTestScore = testScore || 0;
    
    // Весовые коэффициенты для компонентов
    const videoWeight = 0.6; // 60%
    const testWeight = 0.3; // 30%
    const artifactsWeight = 0.1; // 10%
    
    // Рассчитываем общий прогресс с учетом весов
    const overallProgress = 
      (videoProgress * videoWeight) + 
      (normalizedTestScore * testWeight) + 
      (artifactsProgress * artifactsWeight);
    
    return Math.round(overallProgress);
  },
  
  /**
   * Завершает уровень, если все условия выполнены
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Объект с результатом операции и статусом уровня
   */
  completeLevelIfConditionsMet: async (userId: string, levelId: string) => {
    try {
      // Проверяем условия завершения уровня
      const conditions = await progressService.checkLevelCompletionConditions(userId, levelId);
      
      if (!conditions.isCompleted) {
        return {
          success: false,
          status: 'in_progress' as ProgressStatus,
          message: 'Не все условия для завершения уровня выполнены',
          conditions
        };
      }
      
      // Обновляем прогресс пользователя
      await progressService.updateLevelProgress(
        userId,
        levelId,
        'completed',
        100,
        conditions.testScore
      );
      
      // Разблокируем следующий уровень если он существует
      const nextLevelInfo = await progressService.unlockNextLevel(userId, levelId);
      
      return {
        success: true,
        status: 'completed' as ProgressStatus,
        message: 'Уровень успешно завершен',
        conditions,
        nextLevel: nextLevelInfo
      };
    } catch (error) {
      console.error(`Error completing level ${levelId}:`, error);
      throw new Error(`Failed to complete level: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  /**
   * Получает следующий уровень после указанного
   * @param levelId ID текущего уровня
   * @returns Информация о следующем уровне или null, если следующего уровня нет
   */
  getNextLevel: async (levelId: string) => {
    try {
      const levelService = (await import('@/lib/services/levelService')).levelService;
      
      // Получаем текущий уровень
      const currentLevel = await levelService.getLevelById(levelId);
      
      if (!currentLevel) {
        return null;
      }
      
      // Получаем все уровни
      const allLevels = await levelService.getAllLevels();
      
      // Находим следующий уровень по порядковому номеру
      const nextLevel = allLevels.find(level => 
        level.order_index === currentLevel.order_index + 1 && 
        level.status === 'published'
      );
      
      return nextLevel || null;
    } catch (error) {
      console.error(`Error getting next level for level ${levelId}:`, error);
      return null; // Возвращаем null в случае ошибки
    }
  },
  
  /**
   * Разблокирует следующий уровень после успешного завершения текущего
   * @param userId ID пользователя
   * @param currentLevelId ID текущего уровня
   * @returns Информация о разблокированном уровне или null, если следующего уровня нет
   */
  unlockNextLevel: async (userId: string, currentLevelId: string) => {
    try {
      // Получаем следующий уровень
      const nextLevel = await progressService.getNextLevel(currentLevelId);
      
      if (!nextLevel) {
        return null; // Следующего уровня нет
      }
      
      // Проверяем, есть ли уже запись о прогрессе для следующего уровня
      const existingProgress = await progressService.getUserLevelProgress(userId, nextLevel.id);
      
      // Если записи нет, создаем её со статусом "доступен"
      if (!existingProgress) {
        await progressService.updateLevelProgress(
          userId,
          nextLevel.id,
          'in_progress', // Устанавливаем статус "в процессе"
          0, // Начальный прогресс 0%
          null // Тесты еще не пройдены
        );
      }
      
      return {
        id: nextLevel.id,
        title: nextLevel.title,
        order_index: nextLevel.order_index,
        is_free: nextLevel.is_free
      };
    } catch (error) {
      console.error(`Error unlocking next level after level ${currentLevelId}:`, error);
      return null; // Возвращаем null в случае ошибки для предотвращения сбоев в UI
    }
  },
  
  /**
   * Проверяет, разблокирован ли уровень для пользователя
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns true, если уровень разблокирован
   */
  isLevelUnlocked: async (userId: string, levelId: string): Promise<boolean> => {
    try {
      const levelService = (await import('@/lib/services/levelService')).levelService;
      
      // Получаем уровень
      const level = await levelService.getLevelById(levelId);
      
      if (!level) {
        return false; // Уровень не существует
      }
      
      // Если это первый уровень, он всегда разблокирован
      if (level.order_index === 1) {
        return true;
      }
      
      // Получаем все уровни и прогресс пользователя
      const allLevels = await levelService.getAllLevels();
      const userProgress = await progressService.getUserProgress(userId);
      
      // Вычисляем статус уровня
      const status = progressService.calculateLevelStatus(
        level.order_index,
        userProgress,
        allLevels
      );
      
      // Уровень разблокирован, если его статус не "locked"
      return status !== 'locked';
    } catch (error) {
      console.error(`Error checking if level ${levelId} is unlocked for user ${userId}:`, error);
      return false; // В случае ошибки считаем уровень заблокированным для безопасности
    }
  }
}; 