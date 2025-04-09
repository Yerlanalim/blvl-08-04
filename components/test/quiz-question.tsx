'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/lib/supabase/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: QuizQuestion;
  onAnswerSubmit: (questionId: string, answerIndices: number[], isCorrect: boolean) => void;
  showResults?: boolean;
  correctAnswers?: number[];
}

export default function QuizQuestionComponent({
  question,
  onAnswerSubmit,
  showResults = false,
  correctAnswers = [],
}: QuizQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Сбрасываем состояние при изменении вопроса
  useEffect(() => {
    setSelectedAnswers([]);
    setTextAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
  }, [question.id]);

  // Обработчик выбора варианта ответа
  const handleSingleChoiceChange = (value: string) => {
    const index = parseInt(value, 10);
    setSelectedAnswers([index]);
  };

  // Обработчик выбора вариантов ответа (множественный выбор)
  const handleMultipleChoiceChange = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedAnswers((prev) => [...prev, index]);
    } else {
      setSelectedAnswers((prev) => prev.filter((i) => i !== index));
    }
  };

  // Обработчик отправки ответа
  const handleSubmit = () => {
    // Для вопросов с вводом текста
    if (question.type === 'text_input') {
      // Преобразуем текстовый ответ в индекс (проверяем, совпадает ли с правильным)
      const answerOptions = question.options as string[];
      const correctTextAnswer = answerOptions[question.correct_option as number].toLowerCase().trim();
      const isTextCorrect = textAnswer.toLowerCase().trim() === correctTextAnswer;
      
      setIsCorrect(isTextCorrect);
      setSubmitted(true);
      onAnswerSubmit(question.id, isTextCorrect ? [question.correct_option as number] : [], isTextCorrect);
      return;
    }

    setSubmitted(true);
    
    // Проверяем, совпадают ли выбранные ответы с правильными
    const correctOption = Array.isArray(question.correct_option)
      ? question.correct_option
      : [question.correct_option];
      
    const isAnswerCorrect = 
      selectedAnswers.length === correctOption.length &&
      selectedAnswers.every(index => correctOption.includes(index)) &&
      correctOption.every(index => selectedAnswers.includes(index));
    
    setIsCorrect(isAnswerCorrect);
    onAnswerSubmit(question.id, selectedAnswers, isAnswerCorrect);
  };

  // Отображаем правильные/неправильные ответы
  const renderAnswerFeedback = (index: number) => {
    if (!showResults && !submitted) return null;

    const isSelected = selectedAnswers.includes(index);
    const isCorrectAnswer = correctAnswers.includes(index);

    if (isSelected && isCorrectAnswer) {
      return <Check className="text-green-500 ml-2 h-5 w-5" />;
    } else if (isSelected && !isCorrectAnswer) {
      return <X className="text-red-500 ml-2 h-5 w-5" />;
    } else if (!isSelected && isCorrectAnswer) {
      return <AlertCircle className="text-amber-500 ml-2 h-5 w-5" />;
    }

    return null;
  };

  return (
    <Card className={cn(
      submitted && (isCorrect ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800')
    )}>
      <CardHeader>
        <CardTitle className="text-lg">{question.question}</CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === 'single_choice' && (
          <RadioGroup
            value={selectedAnswers[0]?.toString()}
            onValueChange={handleSingleChoiceChange}
            className="space-y-2"
            disabled={submitted || showResults}
          >
            {(question.options as string[]).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${question.id}-${index}`} />
                <Label
                  htmlFor={`option-${question.id}-${index}`}
                  className={cn(
                    'flex-1',
                    showResults && correctAnswers.includes(index) && 'text-green-600 dark:text-green-400 font-medium'
                  )}
                >
                  <div className="flex items-center">
                    {option}
                    {renderAnswerFeedback(index)}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {(question.options as string[]).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`option-${question.id}-${index}`}
                  checked={selectedAnswers.includes(index)}
                  onCheckedChange={(checked) => handleMultipleChoiceChange(index, checked as boolean)}
                  disabled={submitted || showResults}
                />
                <Label
                  htmlFor={`option-${question.id}-${index}`}
                  className={cn(
                    'flex-1',
                    showResults && correctAnswers.includes(index) && 'text-green-600 dark:text-green-400 font-medium'
                  )}
                >
                  <div className="flex items-center">
                    {option}
                    {renderAnswerFeedback(index)}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        )}

        {question.type === 'text_input' && (
          <div className="space-y-2">
            <Label htmlFor={`text-answer-${question.id}`}>Введите ответ:</Label>
            <Input
              id={`text-answer-${question.id}`}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={submitted || showResults}
              placeholder="Введите ваш ответ..."
            />
            
            {(submitted || showResults) && (
              <div className={`mt-2 p-2 rounded text-sm ${isCorrect ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {isCorrect ? (
                  <div className="flex items-center">
                    <Check className="mr-2 h-4 w-4" />
                    Правильно!
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center">
                      <X className="mr-2 h-4 w-4" />
                      Неправильно.
                    </div>
                    <p className="mt-1">
                      Правильный ответ: {(question.options as string[])[question.correct_option as number]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!submitted && !showResults && (
          <Button onClick={handleSubmit} disabled={
            (question.type !== 'text_input' && selectedAnswers.length === 0) ||
            (question.type === 'text_input' && textAnswer.trim() === '')
          }>
            Ответить
          </Button>
        )}
        
        {(submitted || showResults) && (
          <div className={`p-2 rounded text-sm w-full ${isCorrect ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isCorrect ? (
              <div className="flex items-center">
                <Check className="mr-2 h-4 w-4" />
                Правильно!
              </div>
            ) : (
              <div className="flex items-center">
                <X className="mr-2 h-4 w-4" />
                Неправильно. Пожалуйста, проверьте правильные ответы.
              </div>
            )}
            {question.explanation && (
              <p className="mt-2 text-muted-foreground">{question.explanation}</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 