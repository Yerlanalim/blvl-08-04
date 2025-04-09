const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Инициализируем Supabase клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Необходимо указать NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Функция для создания видео для уровня
const getVideosForLevel = (levelId, levelIndex) => [
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
  }
];

// Функция для создания вопросов для тестов
const getQuestionsForLevel = (levelId, videos) => [
  {
    question: 'Какая из перечисленных стратегий наиболее эффективна для начинающего бизнеса?',
    options: ['Максимальные инвестиции в рекламу', 'Найм большого количества сотрудников', 'Фокус на MVP и изучение потребностей рынка', 'Игнорирование конкурентов'],
    correct_option: 2, // 0-индексированный (3-й вариант)
    level_id: levelId,
    video_id: videos[0].id,
    order_index: 1,
    question_type: 'single_choice',
    explanation: 'Для начинающего бизнеса важно сначала создать минимально жизнеспособный продукт (MVP) и изучить реальные потребности целевой аудитории.'
  },
  {
    question: 'Что такое CAC в контексте бизнеса?',
    options: ['Customer Acquisition Cost (Стоимость привлечения клиента)', 'Customer Average Check (Средний чек клиента)', 'Corporate Annual Conference (Годовая корпоративная конференция)', 'Content Analysis Certificate (Сертификат анализа контента)'],
    correct_option: 0,
    level_id: levelId,
    video_id: videos[1].id,
    order_index: 2,
    question_type: 'single_choice',
    explanation: 'CAC (Customer Acquisition Cost) — это стоимость привлечения нового клиента, важный показатель для оценки эффективности маркетинговых кампаний.'
  }
];

// Функция для создания артефактов
const getArtifactsForLevel = (levelId) => [
  {
    title: 'Шаблон бизнес-плана',
    description: 'Готовый шаблон для составления вашего собственного бизнес-плана.',
    level_id: levelId,
    order_index: 1,
    file_type: 'pdf',
    file_path: 'public/artifacts/business_plan_template.pdf',
    file_size: 2.5 * 1024 * 1024 // 2.5 MB
  },
  {
    title: 'Чек-лист стартапа',
    description: 'Подробный список действий для успешного запуска стартапа.',
    level_id: levelId,
    order_index: 2,
    file_type: 'xlsx',
    file_path: 'public/artifacts/startup_checklist.xlsx',
    file_size: 1.8 * 1024 * 1024 // 1.8 MB
  }
];

// Основная функция для заполнения базы данных
async function seedTestData() {
  console.log('Начинаю заполнение базы данных тестовыми данными...');
  
  try {
    // Очищаем существующие данные (по необходимости)
    console.log('Очищаем существующие данные...');
    await supabase.from('user_artifacts').delete().neq('id', 0);
    await supabase.from('user_video_progress').delete().neq('id', 0);
    await supabase.from('user_progress').delete().neq('id', 0);
    await supabase.from('quiz_questions').delete().neq('id', 0);
    await supabase.from('artifacts').delete().neq('id', 0);
    await supabase.from('videos').delete().neq('id', 0);
    await supabase.from('levels').delete().neq('id', 0);
    
    // Добавляем уровни
    console.log('Добавляем уровни...');
    const { data: insertedLevels, error: levelsError } = await supabase
      .from('levels')
      .insert(levels)
      .select();
    
    if (levelsError) {
      throw new Error(`Ошибка при добавлении уровней: ${levelsError.message}`);
    }
    
    console.log(`Добавлено ${insertedLevels.length} уровней.`);
    
    // Для каждого уровня добавляем видео, вопросы и артефакты
    for (let i = 0; i < insertedLevels.length; i++) {
      const level = insertedLevels[i];
      
      // Добавляем видео
      console.log(`Добавляем видео для уровня "${level.title}"...`);
      const levelVideos = getVideosForLevel(level.id, i);
      const { data: insertedVideos, error: videosError } = await supabase
        .from('videos')
        .insert(levelVideos)
        .select();
      
      if (videosError) {
        throw new Error(`Ошибка при добавлении видео: ${videosError.message}`);
      }
      
      console.log(`Добавлено ${insertedVideos.length} видео для уровня "${level.title}".`);
      
      // Добавляем вопросы
      console.log(`Добавляем вопросы для уровня "${level.title}"...`);
      const levelQuestions = getQuestionsForLevel(level.id, insertedVideos);
      const { data: insertedQuestions, error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(levelQuestions)
        .select();
      
      if (questionsError) {
        throw new Error(`Ошибка при добавлении вопросов: ${questionsError.message}`);
      }
      
      console.log(`Добавлено ${insertedQuestions.length} вопросов для уровня "${level.title}".`);
      
      // Добавляем артефакты
      console.log(`Добавляем артефакты для уровня "${level.title}"...`);
      const levelArtifacts = getArtifactsForLevel(level.id);
      const { data: insertedArtifacts, error: artifactsError } = await supabase
        .from('artifacts')
        .insert(levelArtifacts)
        .select();
      
      if (artifactsError) {
        throw new Error(`Ошибка при добавлении артефактов: ${artifactsError.message}`);
      }
      
      console.log(`Добавлено ${insertedArtifacts.length} артефактов для уровня "${level.title}".`);
    }
    
    console.log('База данных успешно заполнена тестовыми данными!');
    
  } catch (error) {
    console.error('Произошла ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

// Запускаем функцию заполнения данными
seedTestData(); 