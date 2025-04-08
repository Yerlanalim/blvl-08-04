# Задача 10.1: Реализация панели администратора

## Подготовка

Перед началом выполнения задачи, пожалуйста, ознакомьтесь с следующими документами для восстановления контекста:
- [Концепция проекта](../docs/bizlevel-concept.md)
- [План разработки](../docs/development-plan.md)
- [Текущий статус проекта](../docs/status.md)

## Описание задачи

Необходимо разработать защищенную панель администратора для управления контентом и пользователями в приложении BizLevel. Административная панель должна предоставлять интерфейс для управления образовательными материалами, пользователями и настройками приложения.

### Шаги выполнения:

1. **Создание защищенного маршрута админ-панели:**
   - Создать структуру страниц в директории `/app/admin/`
   - Разработать middleware для проверки прав администратора
   - Реализовать перенаправление неавторизованных пользователей
   - Создать базовый макет административной панели

2. **Разработка дашборда с основными метриками:**
   - Создать компонент для отображения общей статистики
   - Реализовать счетчики пользователей, уровней, видео и артефактов
   - Добавить графики активности пользователей
   - Реализовать карточки с ключевыми показателями

3. **Создание навигации по разделам админ-панели:**
   - Разработать боковое меню с разделами (пользователи, уровни, контент, etc.)
   - Реализовать активные состояния для текущего раздела
   - Добавить хлебные крошки для навигации
   - Настроить адаптивный дизайн для мобильных устройств

4. **Настройка безопасности и прав доступа:**
   - Расширить таблицу profiles для хранения роли пользователя
   - Создать RLS-политики для ограничения доступа к административным функциям
   - Реализовать проверку прав на бэкенде для всех административных API
   - Добавить журналирование действий администраторов

## Обновление таблицы profiles для поддержки ролей

```sql
-- Добавление поля для роли пользователя
ALTER TABLE profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor'));

-- Обновление RLS-политик для учета ролей
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Создание таблицы для логирования действий администраторов
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS для логов администратора
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all logs"
  ON admin_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can insert logs"
  ON admin_logs FOR INSERT
  WITH CHECK (auth.uid() = admin_id);
```

## Структура middleware для проверки прав администратора

```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // Проверка авторизации
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Проверка прав администратора
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (error || profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return res;
}

export const config = {
  matcher: '/admin/:path*',
};
```

## Компоненты административной панели

Основные компоненты для разработки:
1. **AdminLayout** - общий макет для всех страниц администратора
2. **AdminSidebar** - боковая панель с навигацией по разделам
3. **AdminHeader** - верхняя панель с информацией о текущем администраторе
4. **DashboardStats** - компонент с ключевыми метриками
5. **ActivityChart** - график активности пользователей
6. **AdminBreadcrumbs** - хлебные крошки для навигации

## Проверка работы

Для проверки корректности реализации административной панели выполните:
- Тестирование доступа с аккаунтами разных ролей
- Проверка отображения статистики и метрик
- Тестирование навигации между разделами
- Проверка работы middleware и редиректов
- Тестирование адаптивности на разных устройствах

## Ожидаемый результат

- Защищенная административная панель с проверкой прав доступа
- Дашборд с ключевыми метриками и статистикой
- Навигация по разделам администрирования
- Обновленная система ролей пользователей
- Журналирование действий администраторов

## Дополнительные материалы

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Административные панели UI/UX](https://dribbble.com/tags/admin_dashboard)
- [Recharts для графиков](https://recharts.org/en-US/)
- [Аутентификация в Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## После выполнения

После завершения задачи не забудьте обновить файл [status.md](../docs/status.md) с информацией о реализованной административной панели, созданной системе ролей и любых возникших проблемах при разработке функционала. 