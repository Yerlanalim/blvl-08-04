# BizLevel

BizLevel - платформа для роста и развития малого и среднего бизнеса.

## О проекте

BizLevel - это инновационная платформа, которая помогает предпринимателям развивать свой бизнес через образовательные материалы, инструменты управления бизнесом и активное сообщество предпринимателей.

## Технологии

Проект использует современный стек технологий:

- [Next.js 15](https://nextjs.org/) - React фреймворк с App Router
- [TypeScript](https://www.typescriptlang.org/) - типизированный JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - для стилизации
- [shadcn/ui](https://ui.shadcn.com/) - компоненты пользовательского интерфейса
- [Supabase](https://supabase.com/) - бэкенд платформа (база данных, аутентификация, хранилище)

## Начало работы

1. Клонирование репозитория:
   ```bash
   git clone https://github.com/Yerlanalim/blvl-08-04.git
   cd blvl-08-04
   ```

2. Установка зависимостей:
   ```bash
   npm install
   ```

3. Настройка переменных окружения:
   ```bash
   # Создайте файл .env.local из примера .env.example
   cp .env.example .env.local
   # Отредактируйте .env.local с вашими ключами Supabase
   ```

4. Запуск приложения:
   ```bash
   npm run dev
   ```

5. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
bizlevel/
├── app/                # Next.js App Router
├── components/         # Общие компоненты
├── lib/                # Утилиты и вспомогательные функции
│   └── supabase/       # Клиент Supabase и типы
├── public/             # Статические файлы
├── docs/               # Документация проекта
└── supabase/           # Миграции и конфигурация Supabase
```

## Supabase CLI

Для работы с Supabase CLI:
```bash
# Установите Supabase CLI
brew install supabase/tap/supabase

# Для инициализации проекта
supabase init

# Для создания миграции
supabase migration new <migration_name>

# Для применения миграций
supabase db push
```
