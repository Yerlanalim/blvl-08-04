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
   * Вычисляет общий прогресс пользователя по уровню на основе просмотра видео
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @returns Процент завершенных видео
   */
  calculateLevelVideoProgress: async (userId: string, levelId: string): Promise<number> => {
    const videos = await videoService.getLevelVideos(levelId);
    const videoProgress = await videoService.getUserLevelVideoProgress(userId, levelId);
    
    if (videos.length === 0) {
      return 0;
    }
    
    const completedVideos = videoProgress.filter(progress => progress.is_completed).length;
    return Math.round((completedVideos / videos.length) * 100);
  }
}; 