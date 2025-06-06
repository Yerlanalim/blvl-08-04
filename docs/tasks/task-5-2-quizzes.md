# Задача 5.2: Реализация тестов

## Подготовка

Перед началом выполнения задачи, пожалуйста, ознакомьтесь с следующими документами для восстановления контекста:
- [Концепция проекта](../docs/bizlevel-concept.md)
- [План разработки](../docs/development-plan.md)
- [Текущий статус проекта](../docs/status.md)

## Описание задачи

Необходимо создать сервис для работы с тестами в приложении BizLevel и разработать компоненты для отображения и прохождения тестов после просмотра видео. Тесты должны позволять проверить усвоение материала и быть интегрированы с системой прогресса пользователя.

### Шаги выполнения:

1. **Создание сервиса testService для работы с тестами:**
   - Разработать сервис для взаимодействия с таблицей quiz_questions в Supabase
   - Реализовать методы для получения вопросов, связанных с конкретным видео
   - Добавить функционал для проверки правильности ответов
   - Реализовать сохранение результатов тестирования в базе данных

2. **Разработка компонента TestSection:**
   - Создать компонент для отображения тестов после просмотра видео
   - Реализовать различные типы вопросов (выбор одного ответа, множественный выбор, текстовый ответ)
   - Добавить визуальную индикацию правильных и неправильных ответов
   - Реализовать переход между вопросами и подведение итогов теста

3. **Реализация логики проверки ответов и подсчета результатов:**
   - Разработать алгоритм проверки ответов пользователя
   - Реализовать подсчет баллов за правильные ответы
   - Добавить отображение результатов с процентом правильных ответов
   - Реализовать возможность повторного прохождения теста в случае неудачи

4. **Сохранение результатов тестов в прогрессе пользователя:**
   - Создать механизм записи результатов в таблицу прогресса
   - Интегрировать результаты тестов с общим прогрессом по уровню
   - Добавить визуальную индикацию пройденных тестов в интерфейсе
   - Реализовать обновление общего прогресса пользователя

## Рекомендации по реализации

- Храните вопросы и варианты ответов в базе данных с указанием правильных ответов
- Разделите тесты на короткие блоки (1-2 вопроса после каждого видео), чтобы не перегружать пользователя
- Используйте анимации и визуальные эффекты для улучшения пользовательского опыта
- Предусмотрите различные форматы ответов для разнообразия тестов

## Структура данных для тестов

Рекомендуемая структура таблицы quiz_questions:
- id: уникальный идентификатор вопроса
- video_id: связь с видео
- question_text: текст вопроса
- options: массив вариантов ответов (JSON)
- correct_answers: массив индексов правильных ответов (JSON)
- type: тип вопроса (single_choice, multiple_choice, text_input)
- order_num: порядковый номер вопроса

## Проверка работы

Для проверки корректности реализации тестов выполните:
- Тестирование отображения вопросов и вариантов ответов
- Проверка корректности определения правильных и неправильных ответов
- Тестирование сохранения результатов и обновления прогресса
- Проверка интеграции с общим прогрессом пользователя
- Тестирование пользовательского опыта на разных устройствах

## Ожидаемый результат

- Функциональный сервис для работы с тестами
- Интерактивный компонент для прохождения тестов
- Механизм проверки ответов и подсчета результатов
- Система сохранения результатов и интеграция с прогрессом пользователя

## Дополнительные материалы

- [React Hook Form для форм](https://react-hook-form.com/)
- [Framer Motion для анимаций](https://www.framer.com/motion/)
- [Примеры UI для тестов](https://dribbble.com/tags/quiz)
- [PostgreSQL JSON функциональность](https://www.postgresql.org/docs/current/functions-json.html)

## После выполнения

После завершения задачи не забудьте обновить файл [status.md](../docs/status.md) с информацией о реализованной системе тестов, используемых компонентах и любых возникших проблемах при интеграции с системой прогресса. 