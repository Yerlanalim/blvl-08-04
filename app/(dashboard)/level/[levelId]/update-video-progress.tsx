'use client';

import { useEffect } from 'react';
import { progressService } from '@/lib/services/progressService';
import { videoService } from '@/lib/services/videoService';
import { useToast } from '@/components/ui/use-toast';

interface UpdateVideoProgressProps {
  userId: string;
  levelId: string;
  videoId: string;
  isCompleted: boolean;
}

export default function UpdateVideoProgress({
  userId,
  levelId,
  videoId,
  isCompleted,
}: UpdateVideoProgressProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (isCompleted) {
      const updateProgress = async () => {
        try {
          // Получаем текущий прогресс уровня
          const levelProgress = await progressService.getUserLevelProgress(userId, levelId);
          
          // Вычисляем новый прогресс на основе просмотренных видео
          const videoProgressPercentage = await videoService.calculateLevelVideoProgress(
            userId,
            levelId
          );
          
          // Если уже есть запись о прогрессе, обновляем её
          if (levelProgress) {
            await progressService.updateLevelProgress(
              userId,
              levelId,
              levelProgress.status === 'completed' ? 'completed' : 'in_progress',
              videoProgressPercentage
            );
          } else {
            // Создаем новую запись о прогрессе
            await progressService.updateLevelProgress(
              userId,
              levelId,
              'in_progress',
              videoProgressPercentage
            );
          }
          
          // Показываем уведомление
          toast({
            title: 'Прогресс обновлен',
            description: `Ваш прогресс по уровню: ${videoProgressPercentage}%`,
          });
        } catch (error) {
          console.error('Error updating level progress:', error);
          toast({
            title: 'Ошибка',
            description: 'Не удалось обновить прогресс уровня',
            variant: 'destructive',
          });
        }
      };
      
      updateProgress();
    }
  }, [userId, levelId, videoId, isCompleted, toast]);

  // Это компонент с эффектами, не рендерим ничего видимого
  return null;
} 