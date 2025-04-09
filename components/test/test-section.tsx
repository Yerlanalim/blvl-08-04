'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import QuizQuestionComponent from './quiz-question';
import { testService } from '@/lib/services';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface TestSectionProps {
  questions: QuizQuestion[];
  userId: string;
  levelId: string;
  onComplete?: (score: number) => void;
}

export default function TestSection({
  questions,
  userId,
  levelId,
  onComplete,
}: TestSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { indices: number[]; isCorrect: boolean }>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const hasNextQuestion = currentQuestionIndex < questions.length - 1;

  // Обработчик отправки ответа на вопрос
  const handleAnswerSubmit = (questionId: string, answerIndices: number[], isCorrect: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { indices: answerIndices, isCorrect },
    }));
  };

  // Переход к следующему вопросу
  const handleNextQuestion = () => {
    if (hasNextQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      calculateFinalScore();
    }
  };

  // Вычисление итогового результата
  const calculateFinalScore = () => {
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < questions.length) {
      toast({
        title: 'Тест не завершен',
        description: 'Пожалуйста, ответьте на все вопросы',
        variant: 'destructive',
      });
      return;
    }
    
    const correctAnswers = Object.values(answers).filter((a) => a.isCorrect).length;
    const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
    
    setScore(calculatedScore);
    setShowResults(true);
    
    if (onComplete) {
      onComplete(calculatedScore);
    }
  };

  // Сохранение результатов теста
  const handleSaveResults = async () => {
    setIsSubmitting(true);
    
    try {
      await testService.saveQuizResult(userId, levelId, score);
      toast({
        title: 'Результаты сохранены',
        description: `Ваш результат: ${score}%`,
      });
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить результаты теста',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Перезапуск теста
  const handleRestartTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  // Проверка завершенности теста
  const isQuestionAnswered = (questionId: string) => {
    return !!answers[questionId];
  };

  // Подсчет текущего прогресса
  const progressPercentage = questions.length > 0
    ? Math.round(((currentQuestionIndex + (isQuestionAnswered(currentQuestion?.id) ? 1 : 0)) / questions.length) * 100)
    : 0;

  if (!questions.length) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Нет доступных вопросов</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Тест: Вопрос {currentQuestionIndex + 1} из {questions.length}</CardTitle>
                <span className="text-sm text-muted-foreground">Прогресс: {progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </CardHeader>
          </Card>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <QuizQuestionComponent
                question={currentQuestion}
                onAnswerSubmit={handleAnswerSubmit}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Предыдущий вопрос
            </Button>
            
            <Button
              onClick={handleNextQuestion}
              disabled={!isQuestionAnswered(currentQuestion?.id)}
            >
              {hasNextQuestion ? 'Следующий вопрос' : 'Завершить тест'}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Результаты теста</CardTitle>
            <CardDescription>
              Вы ответили правильно на {Object.values(answers).filter(a => a.isCorrect).length} из {questions.length} вопросов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Ваш результат: {score}%</p>
                <Progress value={score} className="h-3" />
              </div>
              
              {score >= 70 ? (
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Поздравляем!</p>
                    <p className="text-sm text-green-700/90 dark:text-green-400/90">
                      Вы успешно прошли тест. Ваш прогресс будет сохранен, и вы сможете перейти к следующему уровню.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                    !
                  </div>
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">Еще немного усилий!</p>
                    <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
                      Для успешного прохождения уровня необходимо набрать не менее 70%. Вы можете попробовать снова.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleRestartTest}>
              Пройти тест еще раз
            </Button>
            <Button onClick={handleSaveResults} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить результаты'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 