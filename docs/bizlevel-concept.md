# Упрощенная техническая концепция BizLevel

## 1. Технологический стек

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: Zustand (для глобального состояния)
- **Form Handling**: React Hook Form + Zod
- **Media Player**: React Player для воспроизведения YouTube видео

### Backend & Инфраструктура
- **Supabase Platform** (единая основа для всего бэкенда):
  - **Auth**: Встроенная аутентификация Supabase
  - **Database**: PostgreSQL с Row Level Security (RLS)
  - **Storage**: Хранение артефактов с подписанными URL
  - **Edge Functions**: Только для критической серверной логики
  - **Migrations**: Управление схемой через Supabase CLI
- **Платежи**: Stripe с прямой интеграцией (без сложных очередей)
- **Деплой**: Vercel + GitHub для CI/CD
- **Аналитика**: Простая интеграция Vercel Analytics
- **Видеохостинг**: YouTube с приватными/непубличными видео

## 2. Структура приложения

### Основные страницы
```
/app
  /(auth)             # Маршруты аутентификации
    /login            # Страница входа
    /register         # Страница регистрации
    /forgot-password  # Восстановление пароля
  /(dashboard)        # Защищенные маршруты
    /page.tsx         # Главная страница (карта уровней)
    /profile          # Личный кабинет
    /level/[id]       # Страница уровня
    /payment          # Страница оплаты
  /admin              # Административный интерфейс
    /levels           # Управление уровнями
    /users            # Управление пользователями
/components           # React компоненты
/lib                  # Утилиты и сервисы
  /supabase           # Клиент Supabase
  /stripe             # Интеграция платежей
```

## 3. Схема базы данных

### Основные таблицы
- **profiles**: Данные пользователей (расширяет auth.users)
- **levels**: Уровни обучения
- **videos**: Видео внутри уровней
- **quiz_questions**: Вопросы тестов, связанные с видео
- **artifacts**: Учебные материалы для скачивания
- **user_progress**: Прогресс пользователя по уровням
- **user_video_progress**: Отслеживание просмотренных видео
- **user_artifacts**: Отслеживание скачанных артефактов

### Пример схемы таблицы (SQL)
```sql
CREATE TABLE levels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_num INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'published'
);

CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- YouTube URL
  order_num INTEGER NOT NULL
);
```

## 4. Управление доступом с RLS

Политики безопасности на уровне строк (RLS) для контроля доступа:

```sql
-- Доступ к уровням
CREATE POLICY "Levels are viewable by authenticated users"
  ON levels FOR SELECT
  USING (auth.role() = 'authenticated');

-- Доступ к видео с проверкой уровня
CREATE POLICY "Videos are viewable by users with level access"
  ON videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM levels l
      WHERE l.id = level_id
      AND (
        l.is_free = TRUE OR
        EXISTS (
          SELECT 1 FROM user_progress up
          WHERE up.user_id = auth.uid()
          AND up.level_id = level_id
        )
      )
    )
  );
```

## 5. Ключевые функциональные компоненты

### Аутентификация
- Использование встроенной системы Supabase Auth
- Email/пароль аутентификация
- Восстановление пароля
- Опционально: OAuth через социальные сети

### Карта уровней
- Отображение списка уровней с индикацией статуса
- Разблокировка следующего уровня после завершения текущего
- Отслеживание общего прогресса

### Страница уровня
- Проигрывание видео через YouTube API
- Тесты после каждого видео (1-2 вопроса)
- Скачивание артефактов из Supabase Storage
- Кнопка "Завершить уровень" для обновления прогресса

### Профиль пользователя
- Просмотр своего прогресса
- Доступ к ранее скачанным материалам
- Простые бейджи за достижения

### Платежная система
- Интеграция с Stripe Checkout
- Платежи за доступ к уровням
- Webhook для обработки успешной оплаты

### Администрирование
- Управление уровнями и видео
- Загрузка артефактов
- Просмотр пользователей и их прогресса

## 6. Обработка данных

### Подход к хранению состояния
- Серверные компоненты Next.js для начальной загрузки данных
- Zustand для глобального состояния на клиенте:

```javascript
// Пример store для прогресса
const useProgressStore = create((set) => ({
  completedLevels: [],
  completedVideos: [],
  setCompletedLevel: (levelId) => set((state) => ({
    completedLevels: [...state.completedLevels, levelId]
  })),
  setCompletedVideo: (videoId) => set((state) => ({
    completedVideos: [...state.completedVideos, videoId]
  }))
}));
```

### Управление прогрессом
- Supabase Realtime для мгновенного обновления прогресса
- Прямые RPC-вызовы для обновления прогресса без сложных абстракций

## 7. Интеграции

### YouTube
- Встраивание YouTube плеера с параметрами приватности
- Отслеживание событий просмотра для обновления прогресса

### Stripe
- Использование Stripe Checkout для простой интеграции платежей
- Обработка webhook'ов для подтверждения оплаты

## 8. Упрощенный подход к деплою

### Настройка окружения
- Использование переменных окружения Vercel
- Подключение к Supabase через официальные клиенты

### CI/CD
- GitHub Actions для автоматизации тестов
- Автодеплой на Vercel при пуше в main

## 9. Управление миграциями

- Использование Supabase CLI для миграций:
```bash
# Создание миграции
supabase migration new create_levels_table

# Применение миграций
supabase db push
```

## 10. Масштабирование (в будущем)

- Индексы PostgreSQL для часто запрашиваемых данных
- Кеширование на стороне Vercel Edge
- Постепенный переход к специализированным сервисам по мере роста

---

**Примечание для разработки**: Этот подход обеспечивает быстрый запуск MVP с минимальной сложностью, используя всю мощь Supabase и Vercel. Добавляйте дополнительные абстракции и паттерны только при возникновении реальной необходимости.