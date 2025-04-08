"use client";

import { useState, useId } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

// Sample FAQ data
const faqItems = [
  {
    id: 1,
    question: "Как получить доступ к следующему уровню?",
    answer: "Для получения доступа к следующему уровню необходимо завершить текущий уровень, посмотрев все видео и пройдя тесты с результатом не менее 80%. После этого следующий уровень разблокируется автоматически.",
    category: "Доступ к уровням",
  },
  {
    id: 2,
    question: "Могу ли я скачать видео для просмотра офлайн?",
    answer: "Нет, видеоматериалы доступны только для онлайн-просмотра через платформу. Однако вы можете скачать сопутствующие артефакты, такие как конспекты и дополнительные материалы.",
    category: "Видеоматериалы",
  },
  {
    id: 3,
    question: "Что делать, если я не могу пройти тест?",
    answer: "Если вы не можете пройти тест, мы рекомендуем пересмотреть видеоматериалы уровня и изучить артефакты. Тесты можно пересдавать неограниченное количество раз. Если у вас остаются вопросы, обратитесь в чат поддержки.",
    category: "Тестирование",
  },
  {
    id: 4,
    question: "Как долго я буду иметь доступ к платформе?",
    answer: "Доступ к платформе предоставляется на 12 месяцев с момента регистрации. По истечении этого срока вы можете продлить подписку или перейти на другой тариф.",
    category: "Доступ к платформе",
  },
  {
    id: 5,
    question: "Могу ли я получить сертификат о прохождении курса?",
    answer: "Да, после прохождения всех уровней обучения вы получите сертификат, подтверждающий ваши знания. Сертификат будет доступен в электронном виде и может быть скачан из вашего профиля.",
    category: "Сертификация",
  },
  {
    id: 6,
    question: "Как связаться с преподавателем напрямую?",
    answer: "Вы можете задать вопрос преподавателю через чат поддержки. Укажите, что вопрос адресован преподавателю, и он ответит вам в течение 24 часов в рабочие дни.",
    category: "Поддержка",
  },
];

// Component for FAQ item with accordion functionality
function FAQItem({ item, isOpen, toggleOpen }: { 
  item: typeof faqItems[0], 
  isOpen: boolean, 
  toggleOpen: () => void 
}) {
  const headingId = useId();
  const contentId = useId();
  
  return (
    <div className="border-b last:border-0">
      <h3>
        <button
          className="flex justify-between items-center w-full py-4 text-left font-medium"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-controls={contentId}
          id={headingId}
        >
          {item.question}
          <span className="relative ml-2 flex h-5 w-5 items-center justify-center">
            <span 
              className={`absolute h-0.5 w-4 bg-current transition-transform ${isOpen ? "rotate-0" : ""}`}
              aria-hidden="true"
            />
            <span 
              className={`absolute h-0.5 w-4 bg-current transition-transform ${isOpen ? "rotate-90 opacity-0" : "rotate-90"}`}
              aria-hidden="true"
            />
          </span>
        </button>
      </h3>
      <div 
        id={contentId}
        role="region"
        aria-labelledby={headingId}
        className={`transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="pb-4">
          <p className="text-muted-foreground">{item.answer}</p>
          <div className="mt-2">
            <span className="inline-block bg-secondary px-2 py-1 rounded-md text-xs">
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItemId, setOpenItemId] = useState<number | null>(null);

  // Filter FAQ items based on search query
  const filteredItems = faqItems.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique categories for filter buttons
  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Часто задаваемые вопросы</h1>
        <p className="text-muted-foreground mt-2">
          Найдите ответы на распространенные вопросы о платформе
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          placeholder="Поиск по вопросам..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Поиск по часто задаваемым вопросам"
          className="w-full pl-10 pr-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* FAQ Categories */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSearchQuery(category)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              searchQuery === category 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            }`}
            aria-pressed={searchQuery === category}
          >
            {category}
          </button>
        ))}
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="px-3 py-1 rounded-md text-sm transition-colors border border-destructive/30 hover:bg-destructive/10 text-destructive"
            aria-label="Сбросить фильтр"
          >
            Сбросить фильтр
          </button>
        )}
      </div>

      {/* FAQ Items */}
      <Card>
        <CardHeader>
          <CardTitle>Вопросы и ответы</CardTitle>
          <CardDescription>
            Нашли {filteredItems.length} {filteredItems.length === 1 ? "вопрос" : 
            filteredItems.length >= 2 && filteredItems.length <= 4 ? "вопроса" : "вопросов"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" role="list">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div key={item.id} role="listitem">
                  <FAQItem
                    item={item}
                    isOpen={openItemId === item.id}
                    toggleOpen={() => setOpenItemId(openItemId === item.id ? null : item.id)}
                  />
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-muted-foreground">
                По вашему запросу ничего не найдено. Попробуйте изменить запрос или обратитесь в чат поддержки.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 