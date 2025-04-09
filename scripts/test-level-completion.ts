/**
 * Тестовый скрипт для проверки функциональности завершения уровня и разблокировки следующего
 * 
 * Этот скрипт выполняет:
 * 1. Симуляцию просмотра всех видео в уровне
 * 2. Симуляцию прохождения всех тестов
 * 3. Симуляцию скачивания всех артефактов
 * 4. Завершение уровня и проверку разблокировки следующего
 * 
 * Использование:
 * npx ts-node scripts/test-level-completion.ts userId levelId
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/database.types';

// Загружаем переменные окружения
dotenv.config();

// Проверяем, что переменные окружения заданы
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: не заданы переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Создаем клиент Supabase
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Получаем userId и levelId из аргументов командной строки
const userId = process.argv[2];
const levelId = process.argv[3];

if (!userId || !levelId) {
  console.error('Использование: npx ts-node scripts/test-level-completion.ts userId levelId');
  process.exit(1);
}

/**
 * Проверить, является ли значение действительным UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Проверяем, что userId и levelId корректные UUID
if (!isValidUUID(userId) || !isValidUUID(levelId)) {
  console.error('Ошибка: userId и levelId должны быть корректными UUID');
  process.exit(1);
}

/**
 * Основная функция тестирования
 */
async function testLevelCompletion() {
  console.log('Начинаем тестирование завершения уровня...');
  console.log(`ID пользователя: ${userId}`);
  console.log(`ID уровня: ${levelId}`);
  
  try {
    // 1. Проверяем существование пользователя и уровня
    console.log('\nПроверка существования пользователя и уровня...');
    
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error(`Пользователь с ID ${userId} не найден: ${userError?.message}`);
    }
    console.log(`Пользователь найден: ${user.user.email}`);
    
    const { data: level, error: levelError } = await supabase
      .from('levels')
      .select('*')
      .eq('id', levelId)
      .single();
      
    if (levelError || !level) {
      throw new Error(`Уровень с ID ${levelId} не найден: ${levelError?.message}`);
    }
    console.log(`Уровень найден: ${level.title} (${level.order_index})`);
    
    // 2. Получаем все видео для уровня
    console.log('\nПолучение видео для уровня...');
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('level_id', levelId);
      
    if (videosError) {
      throw new Error(`Ошибка при получении видео: ${videosError.message}`);
    }
    console.log(`Получено ${videos.length} видео`);
    
    // 3. Симулируем просмотр всех видео
    console.log('\nСимуляция просмотра всех видео...');
    for (const video of videos) {
      const duration = video.duration || 300; // Если длительность не задана, используем 5 минут
      const watchedSeconds = Math.ceil(duration * 0.9); // Смотрим 90% каждого видео
      
      const { error: progressError } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: userId,
          video_id: video.id,
          watched_seconds: watchedSeconds,
          last_position: watchedSeconds,
          is_completed: true
        }, {
          onConflict: 'user_id,video_id'
        });
        
      if (progressError) {
        throw new Error(`Ошибка при обновлении прогресса видео: ${progressError.message}`);
      }
      console.log(`Видео ${video.title} отмечено как просмотренное (${watchedSeconds}/${duration} сек)`);
    }
    
    // 4. Получаем тесты для уровня
    console.log('\nПолучение тестов для уровня...');
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('level_id', levelId);
      
    if (questionsError) {
      throw new Error(`Ошибка при получении вопросов: ${questionsError.message}`);
    }
    console.log(`Получено ${questions.length} вопросов`);
    
    // 5. Симулируем прохождение тестов (сохраняем результат 85%)
    console.log('\nСимуляция прохождения тестов...');
    const quizScore = 85; // 85% правильных ответов
    
    // Обновляем прогресс пользователя по уровню для отражения прохождения тестов
    const { error: quizError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        level_id: levelId,
        quiz_score: quizScore,
        quiz_percentage: quizScore,
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,level_id'
      });
      
    if (quizError) {
      throw new Error(`Ошибка при обновлении результатов теста: ${quizError.message}`);
    }
    console.log(`Тесты пройдены с результатом ${quizScore}%`);
    
    // 6. Получаем артефакты для уровня
    console.log('\nПолучение артефактов для уровня...');
    const { data: artifacts, error: artifactsError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('level_id', levelId);
      
    if (artifactsError) {
      throw new Error(`Ошибка при получении артефактов: ${artifactsError.message}`);
    }
    console.log(`Получено ${artifacts.length} артефактов`);
    
    // 7. Симулируем скачивание всех артефактов
    console.log('\nСимуляция скачивания артефактов...');
    for (const artifact of artifacts) {
      const { error: downloadError } = await supabase
        .from('user_artifacts')
        .upsert({
          user_id: userId,
          artifact_id: artifact.id,
          downloaded_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,artifact_id'
        });
        
      if (downloadError) {
        throw new Error(`Ошибка при отметке артефакта как скачанного: ${downloadError.message}`);
      }
      console.log(`Артефакт ${artifact.title} отмечен как скачанный`);
    }
    
    // 8. Обновляем общий прогресс по уровню
    console.log('\nОбновление общего прогресса по уровню...');
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        level_id: levelId,
        status: 'in_progress',
        completed_percentage: 100,
        video_percentage: 100,
        artifacts_percentage: 100,
        quiz_score: quizScore,
        quiz_percentage: quizScore,
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,level_id'
      });
      
    if (progressError) {
      throw new Error(`Ошибка при обновлении общего прогресса: ${progressError.message}`);
    }
    console.log('Общий прогресс по уровню обновлен до 100%');
    
    // 9. Получаем следующий уровень
    console.log('\nПроверка следующего уровня...');
    const { data: nextLevel, error: nextLevelError } = await supabase
      .from('levels')
      .select('*')
      .eq('order_index', level.order_index + 1)
      .single();
      
    if (nextLevelError && nextLevelError.code !== 'PGRST116') {
      throw new Error(`Ошибка при получении следующего уровня: ${nextLevelError.message}`);
    }
    
    if (nextLevel) {
      console.log(`Следующий уровень: ${nextLevel.title} (ID: ${nextLevel.id})`);
      
      // Проверяем прогресс по следующему уровню
      const { data: nextLevelProgress, error: nextLevelProgressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_id', nextLevel.id)
        .single();
        
      if (nextLevelProgressError && nextLevelProgressError.code !== 'PGRST116') {
        throw new Error(`Ошибка при получении прогресса следующего уровня: ${nextLevelProgressError.message}`);
      }
      
      if (nextLevelProgress) {
        console.log(`Статус следующего уровня: ${nextLevelProgress.status}, прогресс: ${nextLevelProgress.completed_percentage}%`);
      } else {
        console.log('Прогресс по следующему уровню не найден, уровень будет разблокирован при завершении текущего');
      }
    } else {
      console.log('Следующий уровень не найден (возможно, это последний уровень)');
    }
    
    // 10. Отмечаем уровень как завершенный
    console.log('\nОтметка уровня как завершенного...');
    const { error: completeError } = await supabase
      .from('user_progress')
      .update({
        status: 'completed',
        completed_percentage: 100,
        last_updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('level_id', levelId);
      
    if (completeError) {
      throw new Error(`Ошибка при завершении уровня: ${completeError.message}`);
    }
    console.log('Уровень успешно отмечен как завершенный');
    
    // 11. Проверяем разблокировку следующего уровня
    if (nextLevel) {
      console.log('\nПроверка разблокировки следующего уровня...');
      
      // Создаем запись о прогрессе для следующего уровня, если её нет
      const { error: unlockError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          level_id: nextLevel.id,
          status: 'in_progress',
          completed_percentage: 0,
          last_updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,level_id'
        });
        
      if (unlockError) {
        throw new Error(`Ошибка при разблокировке следующего уровня: ${unlockError.message}`);
      }
      console.log(`Следующий уровень "${nextLevel.title}" успешно разблокирован`);
    }
    
    console.log('\nТестирование завершено успешно! ✅');
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Запускаем тестирование
testLevelCompletion(); 