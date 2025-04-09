import { createClient } from '@supabase/supabase-js';
import { type Database } from '../lib/supabase/database.types';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env.local
dotenv.config({ path: '.env.local' });

// Инициализируем Supabase клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Необходимо указать NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Тестовые данные для уровней
const levels = [
  {
    title: 'Основы бизнеса',
    description: 'Введение в основные концепции бизнеса и предпринимательства.',
    is_free: true,
    order_index: 1,
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2342&q=80'
  },
  {
    title: 'Маркетинг и продажи',
    description: 'Изучение основных стратегий маркетинга и техник продаж.',
    is_free: true,
    order_index: 2,
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80'
  },
  {
    title: 'Финансы и инвестиции',
    description: 'Понимание финансов, бюджетирования и инвестиций для бизнеса.',
    is_free: true,
    order_index: 3,
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  },
  {
    title: 'Управление командой',
    description: 'Стратегии эффективного управления и развития команды.',
    is_free: false,
    order_index: 4,
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80'
  },
  {
    title: 'Масштабирование бизнеса',
    description: 'Методы и подходы к расширению бизнеса и выходу на новые рынки.',
    is_free: false,
    order_index: 5,
    status: 'published',
    thumbnail_url: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2342&q=80'
  }
];

// Тестовые данные для видео
const getVideosForLevel = (levelId: string, levelIndex: number) => [
  {
    title: `Введение в ${levels[levelIndex].title}`,
    description: `Обзор основных концепций и тем, которые будут рассмотрены в уровне.`,
    level_id: levelId,
    order_index: 1,
    status: 'published',
    youtube_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnail_url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    duration: 300 // 5 минут
  },
  {
    title: 'Основные концепции',
    description: 'Подробное изучение ключевых концепций данного уровня.',
    level_id: levelId,
    order_index: 2,
    status: 'published',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    duration: 450 // 7.5 минут
  },
  {
    title: 'Практическое применение',
    description: 'Как применять полученные знания на практике в реальных ситуациях.',
    level_id: levelId,
    order_index: 3,
    status: 'published',
    youtube_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    thumbnail_url: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
    duration: 600 // 10 минут
  },
  {
    title: 'Кейс-стади успешных примеров',
    description: 'Анализ успешных случаев применения изученных концепций.',
    level_id: levelId,
    order_index: 4,
    status: 'published',
    youtube_url: 'https://www.youtube.com/watch?v=VYOjWnS4cMY',
    thumbnail_url: 'https://i.ytimg.com/vi/VYOjWnS4cMY/hqdefault.jpg',
    duration: 540 // 9 минут
  },
  {
    title: 'Финальные рекомендации',
    description: 'Советы для успешного применения полученных знаний.',
    level_id: levelId,
    order_index: 5,
    status: 'published',
    youtube_url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    thumbnail_url: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: 420 // 7 минут
  }
];

// Тестовые данные для тестовых вопросов
const getQuestionsForLevel = (levelId: string, videos: any[]) => [
  {
    question: 'Какая из перечисленных стратегий наиболее эффективна для начинающего бизнеса?',
    options: ['Максимальные инвестиции в рекламу', 'Найм большого количества сотрудников', 'Фокус на MVP и изучение потребностей рынка', 'Игнорирование конкурентов'],
    correct_option: 2, // 0-индексированный (3-й вариант)
    level_id: levelId,
    video_id: videos[0].id,
    order_index: 1,
    type: 'single_choice',
    explanation: 'Для начинающего бизнеса важно сначала создать минимально жизнеспособный продукт (MVP) и изучить реальные потребности целевой аудитории.'
  },
  {
    question: 'Что такое CAC в контексте бизнеса?',
    options: ['Customer Acquisition Cost (Стоимость привлечения клиента)', 'Customer Average Check (Средний чек клиента)', 'Corporate Annual Conference (Годовая корпоративная конференция)', 'Content Analysis Certificate (Сертификат анализа контента)'],
    correct_option: 0,
    level_id: levelId,
    video_id: videos[1].id,
    order_index: 2,
    type: 'single_choice',
    explanation: 'CAC (Customer Acquisition Cost) — это стоимость привлечения нового клиента, важный показатель для оценки эффективности маркетинговых кампаний.'
  },
  {
    question: 'Какой метод ценообразования наиболее подходит для нового инновационного продукта?',
    options: ['Ценообразование на основе затрат', 'Пенетрационное ценообразование', 'Престижное ценообразование', 'Ценообразование на основе конкуренции'],
    correct_option: 2,
    level_id: levelId,
    video_id: videos[2].id,
    order_index: 3,
    type: 'single_choice',
    explanation: 'Для инновационных продуктов часто используется престижное ценообразование, чтобы подчеркнуть уникальность и премиальное качество продукта.'
  },
  {
    question: 'Выберите все верные характеристики успешного бизнес-плана:',
    options: ['Содержит детальный финансовый анализ', 'Описывает целевую аудиторию', 'Фокусируется только на краткосрочных целях', 'Включает анализ конкурентов'],
    correct_option: [0, 1, 3], // Множественный выбор
    level_id: levelId,
    video_id: videos[3].id,
    order_index: 4,
    type: 'multiple_choice',
    explanation: 'Успешный бизнес-план должен содержать детальный финансовый анализ, описание целевой аудитории и анализ конкурентов. Фокус только на краткосрочных целях - неправильный подход.'
  },
  {
    question: 'Напишите метрику, которая рассчитывается как соотношение затрат на привлечение клиента к его ценности за время сотрудничества:',
    options: ['LTV/CAC'],
    correct_option: 0,
    level_id: levelId,
    video_id: videos[4].id,
    order_index: 5,
    type: 'text_input',
    explanation: 'LTV/CAC - это соотношение пожизненной ценности клиента (Lifetime Value) к стоимости его привлечения (Customer Acquisition Cost). Идеальным считается соотношение 3:1 и выше.'
  }
];

// Тестовые данные для артефактов
const getArtifactsForLevel = (levelId: string) => [
  {
    title: 'Шаблон бизнес-плана',
    description: 'Готовый шаблон для составления вашего собственного бизнес-плана.',
    level_id: levelId,
    order_index: 1,
    file_type: 'pdf',
    file_url: 'https://example.com/business_plan_template.pdf',
    file_size: 2.5 * 1024 * 1024 // 2.5 MB
  },
  {
    title: 'Чек-лист стартапа',
    description: 'Подробный список действий для успешного запуска стартапа.',
    level_id: levelId,
    order_index: 2,
    file_type: 'xlsx',
    file_url: 'https://example.com/startup_checklist.xlsx',
    file_size: 1.8 * 1024 * 1024 // 1.8 MB
  },
  {
    title: 'Презентация для инвесторов',
    description: 'Шаблон презентации для привлечения инвестиций в ваш проект.',
    level_id: levelId,
    order_index: 3,
    file_type: 'pptx',
    file_url: 'https://example.com/investor_pitch_deck.pptx',
    file_size: 5.2 * 1024 * 1024 // 5.2 MB
  }
];

// Функция для добавления тестовых данных
async function seedTestData() {
  console.log('Начало добавления тестовых данных...');
  
  try {
    // Очищаем существующие данные (опционально)
    console.log('Очистка существующих данных...');
    await supabase.from('user_video_progress').delete().not('id', 'is', null);
    await supabase.from('user_artifacts').delete().not('id', 'is', null);
    await supabase.from('user_progress').delete().not('id', 'is', null);
    await supabase.from('quiz_questions').delete().not('id', 'is', null);
    await supabase.from('artifacts').delete().not('id', 'is', null);
    await supabase.from('videos').delete().not('id', 'is', null);
    await supabase.from('levels').delete().not('id', 'is', null);
    
    // Добавляем уровни
    console.log('Добавление уровней...');
    const { data: levelsData, error: levelsError } = await supabase
      .from('levels')
      .insert(levels)
      .select();
      
    if (levelsError) {
      throw new Error(`Ошибка при добавлении уровней: ${levelsError.message}`);
    }
    
    console.log(`Добавлено ${levelsData.length} уровней`);
    
    // Для каждого уровня добавляем видео, вопросы и артефакты
    for (let i = 0; i < levelsData.length; i++) {
      const levelId = levelsData[i].id;
      
      // Добавляем видео
      const videos = getVideosForLevel(levelId, i);
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .insert(videos)
        .select();
        
      if (videosError) {
        throw new Error(`Ошибка при добавлении видео для уровня ${levelId}: ${videosError.message}`);
      }
      
      console.log(`Добавлено ${videosData.length} видео для уровня ${levelsData[i].title}`);
      
      // Добавляем вопросы
      const questions = getQuestionsForLevel(levelId, videosData);
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions)
        .select();
        
      if (questionsError) {
        throw new Error(`Ошибка при добавлении вопросов для уровня ${levelId}: ${questionsError.message}`);
      }
      
      console.log(`Добавлено ${questionsData.length} вопросов для уровня ${levelsData[i].title}`);
      
      // Добавляем артефакты
      const artifacts = getArtifactsForLevel(levelId);
      const { data: artifactsData, error: artifactsError } = await supabase
        .from('artifacts')
        .insert(artifacts)
        .select();
        
      if (artifactsError) {
        throw new Error(`Ошибка при добавлении артефактов для уровня ${levelId}: ${artifactsError.message}`);
      }
      
      console.log(`Добавлено ${artifactsData.length} артефактов для уровня ${levelsData[i].title}`);
    }
    
    console.log('Тестовые данные успешно добавлены!');
    
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
    process.exit(1);
  }
}

// Запускаем функцию заполнения тестовыми данными
seedTestData(); 