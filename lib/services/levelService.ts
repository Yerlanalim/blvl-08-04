import { createServerSupabaseClient } from '@/lib/supabase/client';
import { Level } from '@/lib/supabase/types';
import { cache } from 'react';

/**
 * Сервис для работы с данными уровней
 */
export const levelService = {
  /**
   * Получает все уровни из базы данных
   * @returns Массив уровней, отсортированных по order_index
   */
  getAllLevels: cache(async (): Promise<Level[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching levels:', error);
      throw new Error('Failed to fetch levels');
    }
    
    return data || [];
  }),
  
  /**
   * Получает уровень по его ID
   * @param id ID уровня
   * @returns Данные уровня или null, если уровень не найден
   */
  getLevelById: cache(async (id: string): Promise<Level | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Ошибка "нет результатов"
        return null;
      }
      console.error(`Error fetching level with id ${id}:`, error);
      throw new Error(`Failed to fetch level with id ${id}`);
    }
    
    return data;
  }),
  
  /**
   * Получает данные о видео, связанных с уровнем
   * @param levelId ID уровня
   * @returns Массив видео, принадлежащих уровню, отсортированных по order_index
   */
  getLevelVideos: cache(async (levelId: string) => {
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
   * Получает вопросы теста для уровня
   * @param levelId ID уровня
   * @returns Массив вопросов, принадлежащих уровню, отсортированных по order_index
   */
  getLevelQuizQuestions: cache(async (levelId: string) => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('level_id', levelId)
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error(`Error fetching quiz questions for level ${levelId}:`, error);
      throw new Error(`Failed to fetch quiz questions for level ${levelId}`);
    }
    
    return data || [];
  }),
  
  /**
   * Получает артефакты для уровня
   * @param levelId ID уровня
   * @returns Массив артефактов, принадлежащих уровню, отсортированных по order_index
   */
  getLevelArtifacts: cache(async (levelId: string) => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('level_id', levelId)
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error(`Error fetching artifacts for level ${levelId}:`, error);
      throw new Error(`Failed to fetch artifacts for level ${levelId}`);
    }
    
    return data || [];
  }),
} 