'use client';

import { Button } from '@/components/ui/button';
import { ProgressStatus } from '@/lib/supabase/types';
import { progressService } from '@/lib/services/progressService';
import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface UpdateLevelProgressProps {
  levelId: string;
  userId: string;
  currentProgress: number;
  currentStatus: ProgressStatus;
}

export default function UpdateLevelProgress({
  levelId,
  userId,
  currentProgress,
  currentStatus
}: UpdateLevelProgressProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isCompleted = currentStatus === 'completed';
  
  const handleMarkAsCompleted = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await progressService.updateLevelProgress(
        userId,
        levelId,
        'completed',
        100
      );
    } catch (error) {
      console.error('Error updating level progress:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={isCompleted ? "outline" : "default"}
      onClick={handleMarkAsCompleted}
      disabled={isLoading || isCompleted}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Обновление...
        </>
      ) : isCompleted ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Завершено
        </>
      ) : (
        'Отметить завершённым'
      )}
    </Button>
  );
} 