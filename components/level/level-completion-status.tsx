'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, PlayCircle, FileText, List, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { progressService } from "@/lib/services/progressService";
import LevelUnlockNotification from "./level-unlock-notification";

interface LevelCompletionStatusProps {
  userId: string;
  levelId: string;
  isCompleted: boolean;
  videoProgress: number;
  testScore: number | null;
  artifactsProgress: number;
  overallProgress: number;
  videosCompleted: boolean;
  testsPassed: boolean;
  artifactsDownloaded: boolean;
  onComplete?: () => void;
}

export default function LevelCompletionStatus({
  userId,
  levelId,
  isCompleted,
  videoProgress,
  testScore,
  artifactsProgress,
  overallProgress,
  videosCompleted,
  testsPassed,
  artifactsDownloaded,
  onComplete
}: LevelCompletionStatusProps) {
  const [loading, setLoading] = useState(false);
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [nextLevel, setNextLevel] = useState<{ id: string; title: string } | null>(null);
  
  // Обработчик нажатия на кнопку "Завершить уровень"
  const handleCompleteLevel = useCallback(async () => {
    if (loading) return; // Предотвращаем двойное нажатие
    
    setLoading(true);
    try {
      // Проверяем входные данные
      if (!userId || !levelId) {
        throw new Error('Некорректные данные пользователя или уровня');
      }
      
      const result = await progressService.completeLevelIfConditionsMet(userId, levelId);
      
      if (result.success) {
        toast.success("Уровень успешно завершен!");
        
        // Если есть следующий уровень, показываем уведомление о разблокировке
        if (result.nextLevel) {
          setNextLevel({
            id: result.nextLevel.id,
            title: result.nextLevel.title
          });
          setShowUnlockNotification(true);
        }
        
        if (onComplete) {
          onComplete();
        }
      } else {
        // Более детальное сообщение об ошибке
        const missingConditions = [];
        if (!result.conditions.videosCompleted) missingConditions.push('просмотр видео');
        if (!result.conditions.testsPassed) missingConditions.push('прохождение тестов');
        if (!result.conditions.artifactsDownloaded) missingConditions.push('скачивание артефактов');
        
        const message = missingConditions.length > 0
          ? `Не выполнены условия: ${missingConditions.join(', ')}`
          : result.message;
          
        toast.error(message);
      }
    } catch (error) {
      console.error("Error completing level:", error);
      toast.error(error instanceof Error 
        ? `Ошибка: ${error.message}` 
        : "Неизвестная ошибка при завершении уровня. Попробуйте еще раз."
      );
    } finally {
      setLoading(false);
    }
  }, [userId, levelId, loading, onComplete]);
  
  // Обработчик закрытия уведомления о новом уровне
  const handleCloseNotification = useCallback(() => {
    setShowUnlockNotification(false);
  }, []);
  
  // Определяем, доступна ли кнопка завершения уровня
  const isCompletionAvailable = !isCompleted && !loading && videosCompleted && testsPassed && artifactsDownloaded;
  
  return (
    <>
      <Card className={isCompleted ? "border-green-200 bg-green-50/50 dark:bg-green-900/10" : ""}>
        <CardHeader>
          <CardTitle>Статус выполнения уровня</CardTitle>
          <CardDescription>
            {isCompleted 
              ? "Поздравляем! Вы успешно завершили этот уровень."
              : "Выполните все необходимые условия для завершения уровня."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Прогресс */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Общий прогресс</span>
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
          
          {/* Условия завершения */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Условия для завершения уровня:</h4>
            
            <div className="grid gap-3">
              {/* Условие просмотра видео */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {videosCompleted ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <PlayCircle className="h-4 w-4 text-blue-500" />
                      Просмотреть все видео
                    </p>
                    <span className="text-xs">{videoProgress}%</span>
                  </div>
                  <Progress value={videoProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Требуется просмотреть минимум 85% каждого видео
                  </p>
                </div>
              </div>
              
              {/* Условие прохождения тестов */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {testsPassed ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <List className="h-4 w-4 text-amber-500" />
                      Пройти все тесты
                    </p>
                    <span className="text-xs">{testScore !== null ? `${testScore}%` : 'Не пройден'}</span>
                  </div>
                  <Progress value={testScore || 0} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Минимальный порог - 70% правильных ответов
                  </p>
                </div>
              </div>
              
              {/* Условие скачивания артефактов */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {artifactsDownloaded ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <FileText className="h-4 w-4 text-green-500" />
                      Скачать все обязательные артефакты
                    </p>
                    <span className="text-xs">{artifactsProgress}%</span>
                  </div>
                  <Progress value={artifactsProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Необходимо скачать все обязательные материалы
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Кнопка завершения уровня */}
          <Button 
            className="w-full"
            disabled={!isCompletionAvailable}
            onClick={handleCompleteLevel}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : isCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Уровень завершен
              </>
            ) : (
              'Завершить уровень'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Уведомление о разблокировке следующего уровня */}
      {nextLevel && (
        <LevelUnlockNotification
          levelId={nextLevel.id}
          levelTitle={nextLevel.title}
          isVisible={showUnlockNotification}
          onClose={handleCloseNotification}
        />
      )}
    </>
  );
} 