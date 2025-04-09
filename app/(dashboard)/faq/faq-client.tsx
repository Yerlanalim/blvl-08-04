"use client";

import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQ } from "@/lib/supabase/types";
import { Search } from "lucide-react";

interface FaqClientProps {
  faqs: FAQ[];
  categories: string[];
}

export default function FaqClient({ faqs, categories }: FaqClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter faqs based on search query and selected category
  const filteredFaqs = faqs.filter(faq => {
    const matchesQuery = 
      searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    
    return matchesQuery && matchesCategory;
  });

  // Group FAQs by category for display
  const faqsByCategory = filteredFaqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});
  
  // Calculate the count of faqs for the description
  const faqCount = filteredFaqs.length;
  const faqCountText = 
    faqCount === 0 ? "вопросов не найдено" :
    faqCount === 1 ? "1 вопрос" :
    faqCount >= 2 && faqCount <= 4 ? `${faqCount} вопроса` :
    `${faqCount} вопросов`;

  return (
    <>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          placeholder="Поиск по вопросам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Поиск по часто задаваемым вопросам"
          className="w-full pl-10 pr-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          aria-pressed={selectedCategory === null}
        >
          Все категории
        </button>
        
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              category === selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            aria-pressed={category === selectedCategory}
          >
            {category}
          </button>
        ))}
        
        {(searchQuery || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
            }}
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
            {selectedCategory ? `Категория: ${selectedCategory} - ` : ""}{faqCountText}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaqs.length > 0 ? (
            <>
              {/* When a category is selected, show only that category */}
              {selectedCategory ? (
                <Accordion type="multiple" className="w-full">
                  {faqsByCategory[selectedCategory]?.map((faq) => (
                    <AccordionItem key={`faq-${faq.id}`} value={`faq-${faq.id}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4">
                          <p className="text-muted-foreground whitespace-pre-line">{faq.answer}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                /* Otherwise, group by category */
                <div className="space-y-6">
                  {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                    <div key={category}>
                      <h3 className="font-medium text-lg mb-3">{category}</h3>
                      <Accordion type="multiple" className="w-full">
                        {categoryFaqs.map((faq) => (
                          <AccordionItem key={`faq-${faq.id}`} value={`faq-${faq.id}`}>
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 pb-4">
                                <p className="text-muted-foreground whitespace-pre-line">{faq.answer}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              По вашему запросу ничего не найдено. Попробуйте изменить запрос или обратитесь в чат поддержки.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
} 