'use client';

import { useState } from 'react';
import { TestSection } from '@/components/test';
import { QuizQuestion } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TestSectionClientProps {
  questions: QuizQuestion[];
  userId: string;
  levelId: string;
  currentScore: number | null;
}

export default function TestSectionClient({
  questions,
  userId,
  levelId,
  currentScore,
}: TestSectionClientProps) {
  const [showTest, setShowTest] = useState(false);

  if (!showTest) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p>Доступно {questions.length} вопросов</p>
              {currentScore !== null && (
                <p className="text-sm mt-1">Ваш текущий результат: {currentScore}%</p>
              )}
            </div>
            <Button onClick={() => setShowTest(true)}>
              {currentScore !== null ? 'Пройти тест снова' : 'Пройти тест'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Обработчик завершения теста
  const handleTestComplete = (score: number) => {
    // Тест завершен, при необходимости можно выполнить дополнительные действия
  };

  return (
    <TestSection
      questions={questions}
      userId={userId}
      levelId={levelId}
      onComplete={handleTestComplete}
    />
  );
} 