# Задача 8.3: Сохранение истории чата

## Подготовка

Перед началом выполнения задачи, пожалуйста, ознакомьтесь с следующими документами для восстановления контекста:
- [Концепция проекта](../docs/bizlevel-concept.md)
- [План разработки](../docs/development-plan.md)
- [Текущий статус проекта](../docs/status.md)

## Описание задачи

Необходимо реализовать функционал сохранения и загрузки истории чата пользователя с ИИ-ассистентом в приложении BizLevel. Это позволит пользователям возвращаться к предыдущим беседам и продолжать их, а также обеспечит персистентность взаимодействия между сеансами.

### Шаги выполнения:

1. **Создание таблицы chat_messages в базе данных:**
   - Разработать и применить миграцию для создания таблицы chat_messages в Supabase
   - Настроить поля таблицы (id, user_id, role, content, created_at)
   - Настроить RLS-политики для безопасного доступа к сообщениям
   - Создать индексы для оптимизации запросов

2. **Реализация сохранения сообщений пользователя и ответов ИИ:**
   - Расширить логику хука useChat для сохранения сообщений в БД
   - Добавить функционал создания новых чатов/диалогов
   - Реализовать обработку ошибок при сохранении
   - Добавить оптимистичные обновления UI при сохранении

3. **Добавление загрузки истории при открытии чата:**
   - Создать функционал загрузки списка диалогов пользователя
   - Реализовать загрузку сообщений конкретного диалога
   - Добавить состояние загрузки и обработку ошибок
   - Реализовать автоматическое сохранение контекста беседы

4. **Реализация пагинации для длинной истории:**
   - Добавить пагинацию или бесконечную прокрутку для больших диалогов
   - Реализовать загрузку предыдущих сообщений при прокрутке вверх
   - Оптимизировать производительность при работе с большим количеством сообщений
   - Добавить скелетон-загрузчики для улучшения UX

## Структура таблицы chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL, -- Опционально, для группировки сообщений по диалогам
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Индексы
CREATE INDEX chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX chat_messages_created_at_idx ON chat_messages(created_at);

-- RLS политики
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Обновление хука useChat

```javascript
const useChat = (conversationId = null) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const supabase = useSupabaseClient();
  
  // Загрузка истории сообщений
  useEffect(() => {
    if (!currentConversationId) return;
    
    const loadMessages = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.created_at
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [currentConversationId, supabase]);
  
  // Отправка и сохранение сообщения
  const sendMessage = async (content) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Создание нового диалога если нужно
      if (!currentConversationId) {
        const newConversationId = uuidv4();
        setCurrentConversationId(newConversationId);
      }
      
      // Создание сообщения пользователя
      const userMessage = {
        role: 'user',
        content,
        conversationId: currentConversationId,
        createdAt: new Date().toISOString()
      };
      
      // Оптимистичное обновление UI
      const tempUserMessageId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, { ...userMessage, id: tempUserMessageId }]);
      
      // Сохранение сообщения пользователя
      const { data: savedUserMessage, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: supabase.auth.user().id,
          conversation_id: currentConversationId,
          role: 'user',
          content
        })
        .select()
        .single();
        
      if (userMsgError) throw userMsgError;
      
      // Замена временного сообщения на сохраненное
      setMessages(prev => prev.map(msg => 
        msg.id === tempUserMessageId ? savedUserMessage : msg
      ));
      
      // Получение ответа от API
      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages
            .concat({ role: 'user', content })
            .map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!apiResponse.ok) throw new Error('Failed to get response');
      
      const aiData = await apiResponse.json();
      
      // Сохранение ответа ассистента
      const { data: savedAiMessage, error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: supabase.auth.user().id,
          conversation_id: currentConversationId,
          role: 'assistant',
          content: aiData.content
        })
        .select()
        .single();
        
      if (aiMsgError) throw aiMsgError;
      
      // Добавление ответа в UI
      setMessages(prev => [...prev, savedAiMessage]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    conversationId: currentConversationId 
  };
};
```

## Проверка работы

Для проверки корректности реализации функционала сохранения истории выполните:
- Тестирование создания нового диалога и сохранения сообщений
- Проверка загрузки истории при повторном открытии чата
- Тестирование пагинации или бесконечной прокрутки
- Проверка корректности обработки ошибок при сбоях
- Тестирование производительности при работе с большой историей

## Ожидаемый результат

- Созданная таблица chat_messages с настроенными RLS-политиками
- Функционал сохранения сообщений пользователя и ответов ИИ
- Загрузка истории чата при открытии приложения
- Оптимизированная работа с длинной историей сообщений

## Дополнительные материалы

- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Оптимистичные обновления в React](https://react-query.tanstack.com/guides/optimistic-updates)
- [Виртуализация списков](https://react-window.vercel.app/)
- [UUID в JavaScript](https://github.com/uuidjs/uuid)
- [Работа с датами в JavaScript](https://date-fns.org/)

## После выполнения

После завершения задачи не забудьте обновить файл [status.md](../docs/status.md) с информацией о реализованном функционале сохранения истории чата, созданной таблице в базе данных и любых возникших проблемах при разработке. 