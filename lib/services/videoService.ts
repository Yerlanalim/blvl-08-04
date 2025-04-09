import { createServerSupabaseClient, createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Video, UserVideoProgress } from '@/lib/supabase/types';
import { cache } from 'react';

/**
 * Сервис для работы с видео
 */
export const videoService = {
  /**
   * Получает все видео для уровня
   * @param levelId ID уровня
   * @returns Массив видео
   */
  getLevelVideos: cache(async (levelId: string): Promise<Video[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('level_id', levelId)
      .eq('status', 'published')
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error(`Error fetching videos for level ${levelId}:`, error);
      throw new Error(`Failed to fetch videos for level ${levelId}`);
    }
    
    return data || [];
  }),
  
  /**
   * Получает конкретное видео по ID
   * @param videoId ID видео
   * @returns Данные видео или null, если видео не найдено
   */
  getVideoById: cache(async (videoId: string): Promise<Video | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Ошибка "нет результатов"
        return null;
      }
      console.error(`Error fetching video with id ${videoId}:`, error);
      throw new Error(`Failed to fetch video with id ${videoId}`);
    }
    
    return data;
  }),
  
  /**
   * Получает прогресс просмотра видео для пользователя
   * @param userId ID пользователя
   * @param videoId ID видео
   * @returns Прогресс просмотра видео или null, если прогресс не найден
   */
  getUserVideoProgress: cache(async (userId: string, videoId: string): Promise<UserVideoProgress | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Ошибка "нет результатов"
        return null;
      }
      console.error(`Error fetching video progress for user ${userId} and video ${videoId}:`, error);
      throw new Error(`Failed to fetch video progress`);
    }
    
    return data;
  }),
  
  /**
   * Получает прогресс просмотра всех видео для пользователя и уровня
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Массив прогресса просмотра видео
   */
  getUserLevelVideoProgress: cache(async (userId: string, levelId: string): Promise<UserVideoProgress[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_video_progress')
      .select('*, videos!inner(level_id)')
      .eq('user_id', userId)
      .eq('videos.level_id', levelId);
      
    if (error) {
      console.error(`Error fetching video progress for user ${userId} and level ${levelId}:`, error);
      throw new Error(`Failed to fetch level video progress`);
    }
    
    return data || [];
  }),
  
  /**
   * Обновляет прогресс просмотра видео
   * @param userId ID пользователя
   * @param videoId ID видео
   * @param watchedSeconds Количество просмотренных секунд
   * @param lastPosition Последняя позиция просмотра
   * @param isCompleted Флаг завершения просмотра
   * @returns Обновленные данные о прогрессе
   */
  updateVideoProgress: async (
    userId: string,
    videoId: string,
    watchedSeconds: number,
    lastPosition: number,
    isCompleted: boolean
  ): Promise<UserVideoProgress> => {
    const supabase = createBrowserSupabaseClient();
    
    // Проверяем существующий прогресс
    const { data: existingProgress } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .maybeSingle();
    
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
        throw new Error(`Failed to update video progress`);
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
        throw new Error(`Failed to create video progress`);
      }
      
      return data;
    }
  },
  
  /**
   * Вычисляет процент выполнения видеоуроков уровня
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Процент выполнения от 0 до 100
   */
  calculateLevelVideoProgress: async (userId: string, levelId: string): Promise<number> => {
    // Получаем все видео уровня
    const videos = await videoService.getLevelVideos(levelId);
    
    if (videos.length === 0) {
      return 0; // Нет видео в уровне
    }
    
    // Получаем прогресс пользователя по видео
    const progress = await videoService.getUserLevelVideoProgress(userId, levelId);
    
    if (progress.length === 0) {
      return 0; // Нет прогресса
    }
    
    // Считаем количество завершенных видео
    const completedCount = progress.filter(p => p.is_completed).length;
    
    // Вычисляем процент выполнения
    return Math.round((completedCount / videos.length) * 100);
  },
  
  /**
   * Проверяет, просмотрены ли все видео уровня до порогового значения (85%)
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns true, если все видео просмотрены достаточно
   */
  areAllLevelVideosCompleted: async (userId: string, levelId: string): Promise<boolean> => {
    // Получаем все видео уровня
    const videos = await videoService.getLevelVideos(levelId);
    
    if (videos.length === 0) {
      return true; // Нет видео в уровне, условие выполнено автоматически
    }
    
    // Получаем прогресс пользователя по видео
    const progress = await videoService.getUserLevelVideoProgress(userId, levelId);
    
    // Проверяем каждое видео
    for (const video of videos) {
      // Находим прогресс для конкретного видео
      const videoProgress = progress.find(p => p.video_id === video.id);
      
      // Если прогресса нет или видео не помечено как завершенное
      if (!videoProgress || !videoProgress.is_completed) {
        return false;
      }
      
      // Проверяем, что просмотрено минимум 85% видео
      if (video.duration) {
        const watchPercentage = (videoProgress.watched_seconds / video.duration) * 100;
        if (watchPercentage < 85) {
          return false;
        }
      }
    }
    
    // Все видео просмотрены достаточно
    return true;
  }
}; 