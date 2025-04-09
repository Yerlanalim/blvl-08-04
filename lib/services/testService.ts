import { createServerSupabaseClient, createBrowserSupabaseClient } from '@/lib/supabase/client';
import { QuizQuestion } from '@/lib/supabase/types';
import { cache } from 'react';

/**
 * Сервис для работы с тестовыми вопросами (quiz_questions)
 */
export const testService = {
  /**
   * Получает все вопросы для уровня
   * @param levelId ID уровня
   * @returns Массив вопросов
   */
  getLevelQuestions: cache(async (levelId: string): Promise<QuizQuestion[]> => {
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
   * Получает вопросы, связанные с конкретным видео
   * @param videoId ID видео
   * @returns Массив вопросов
   */
  getVideoQuestions: cache(async (videoId: string): Promise<QuizQuestion[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('video_id', videoId)
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error(`Error fetching quiz questions for video ${videoId}:`, error);
      throw new Error(`Failed to fetch quiz questions for video ${videoId}`);
    }
    
    return data || [];
  }),
  
  /**
   * Получает конкретный вопрос по ID
   * @param questionId ID вопроса
   * @returns Данные вопроса или null, если вопрос не найден
   */
  getQuestionById: cache(async (questionId: string): Promise<QuizQuestion | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Ошибка "нет результатов"
        return null;
      }
      console.error(`Error fetching question with id ${questionId}:`, error);
      throw new Error(`Failed to fetch question with id ${questionId}`);
    }
    
    return data;
  }),
  
  /**
   * Проверяет правильность ответа на вопрос
   * @param questionId ID вопроса
   * @param answerIndices Массив индексов выбранных ответов
   * @returns Объект с результатом проверки
   */
  checkAnswer: async (questionId: string, answerIndices: number[]): Promise<{ isCorrect: boolean; correctAnswers: number[] }> => {
    const question = await testService.getQuestionById(questionId);
    
    if (!question) {
      throw new Error(`Question with id ${questionId} not found`);
    }
    
    // Получаем правильные ответы из вопроса
    const correctAnswers = Array.isArray(question.correct_option) 
      ? question.correct_option 
      : [question.correct_option];
    
    // Проверяем, является ли ответ правильным
    let isCorrect = false;
    
    if (answerIndices.length === correctAnswers.length) {
      // Если количество выбранных ответов совпадает с количеством правильных
      isCorrect = answerIndices.every(index => correctAnswers.includes(index)) &&
                  correctAnswers.every(index => answerIndices.includes(index));
    }
    
    return { isCorrect, correctAnswers };
  },
  
  /**
   * Сохраняет результаты тестирования в прогрессе пользователя
   * @param userId ID пользователя
   * @param levelId ID уровня
   * @param score Процент правильных ответов
   */
  saveQuizResult: async (userId: string, levelId: string, score: number): Promise<void> => {
    const supabase = createBrowserSupabaseClient();
    
    // Получаем текущий прогресс пользователя по уровню
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('level_id', levelId)
      .maybeSingle();
    
    if (progress) {
      // Если есть запись о прогрессе, обновляем её
      const { error } = await supabase
        .from('user_progress')
        .update({
          quiz_score: score,
          // Если все тесты пройдены и score >= 70%, устанавливаем статус completed
          status: score >= 70 ? 'completed' : progress.status,
          // Если score >= 70%, устанавливаем прогресс 100%
          completed_percentage: score >= 70 ? 100 : progress.completed_percentage
        })
        .eq('id', progress.id);
        
      if (error) {
        console.error(`Error updating quiz result for user ${userId} and level ${levelId}:`, error);
        throw new Error(`Failed to update quiz result`);
      }
    } else {
      // Если нет записи о прогрессе, создаем её
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          level_id: levelId,
          quiz_score: score,
          status: score >= 70 ? 'completed' : 'in_progress',
          completed_percentage: score >= 70 ? 100 : 50 // Если тест пройден, 100%, иначе 50%
        });
        
      if (error) {
        console.error(`Error creating quiz result for user ${userId} and level ${levelId}:`, error);
        throw new Error(`Failed to create quiz result`);
      }
    }
  }
}; 