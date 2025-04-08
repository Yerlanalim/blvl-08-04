# Задача 8.2: Реализация интерфейса чата

## Подготовка

Перед началом выполнения задачи, пожалуйста, ознакомьтесь с следующими документами для восстановления контекста:
- [Концепция проекта](../docs/bizlevel-concept.md)
- [План разработки](../docs/development-plan.md)
- [Текущий статус проекта](../docs/status.md)

## Описание задачи

Необходимо разработать пользовательский интерфейс чата для взаимодействия с ИИ-ассистентом в приложении BizLevel. Интерфейс должен обеспечивать удобную отправку сообщений, отображение истории переписки и корректную обработку ответов от OpenAI API.

### Шаги выполнения:

1. **Разработка компонента ChatWindow для страницы /chat:**
   - Создать компонент на странице `/app/(dashboard)/chat/page.tsx`
   - Разработать адаптивный дизайн окна чата с учетом мобильных устройств
   - Реализовать анимации для плавного появления сообщений
   - Добавить индикаторы загрузки при ожидании ответа от API

2. **Создание хука useChat для работы с API:**
   - Разработать хук для обработки запросов к API `/api/ai/chat`
   - Реализовать управление состоянием переписки (загрузка, ошибки, данные)
   - Добавить методы для отправки, получения и обработки сообщений
   - Реализовать типизацию данных для TypeScript

3. **Реализация отображения истории сообщений:**
   - Создать компоненты для отображения сообщений пользователя и ИИ
   - Реализовать парсинг и рендеринг Markdown в ответах ИИ
   - Добавить автоматическую прокрутку к последнему сообщению
   - Настроить группировку сообщений и отображение временных меток

4. **Добавление функциональности отправки сообщений:**
   - Разработать компонент формы для ввода сообщений
   - Реализовать обработку отправки через клавишу Enter и кнопку
   - Добавить валидацию вводимых сообщений
   - Реализовать автоматическую фокусировку на поле ввода

## Компоненты интерфейса чата

### 1. Структура компонента ChatWindow
```jsx
const ChatWindow = () => {
  const { messages, isLoading, error, sendMessage } = useChat();

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
        {error && <ErrorMessage error={error} />}
      </div>
      <ChatForm onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};
```

### 2. Структура хука useChat
```jsx
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (content) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Обновление локального состояния
      const userMessage = { id: Date.now(), role: 'user', content };
      setMessages(prev => [...prev, userMessage]);
      
      // Отправка запроса к API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.concat(userMessage)
            .map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      // Добавление ответа от ИИ
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.content 
      }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, error, sendMessage };
};
```

## Проверка работы

Для проверки корректности реализации интерфейса чата выполните:
- Тестирование отправки сообщений и получения ответов
- Проверка корректного отображения истории сообщений
- Тестирование обработки ошибок при проблемах с API
- Проверка адаптивности интерфейса на различных устройствах
- Тестирование производительности при длинной истории сообщений

## Ожидаемый результат

- Полностью функциональный интерфейс чата с ИИ-ассистентом
- Адаптивный дизайн с поддержкой мобильных устройств
- Корректное отображение истории сообщений с поддержкой Markdown
- Интуитивный процесс отправки сообщений и получения ответов

## Дополнительные материалы

- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Markdown рендеринг в React](https://github.com/remarkjs/react-markdown)
- [Анимации в React](https://www.framer.com/motion/)
- [Примеры UI для чатов](https://dribbble.com/tags/chat_interface)
- [Next.js App Router](https://nextjs.org/docs/app/building-your-application/routing)

## После выполнения

После завершения задачи не забудьте обновить файл [status.md](../docs/status.md) с информацией о реализованном интерфейсе чата, созданных компонентах и любых возникших проблемах при разработке функционала. 