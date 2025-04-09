'use client';

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { progressService } from '@/lib/services';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  userId: string;
  youtubeUrl: string;
  initialPosition?: number;
  onComplete?: () => void;
  onProgressUpdate?: (progress: number) => void;
}

export default function VideoPlayer({
  videoId,
  userId,
  youtubeUrl,
  initialPosition = 0,
  onComplete,
  onProgressUpdate,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [isReady, setIsReady] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressUpdateTimeout, setProgressUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Обработчик готовности плеера
  const handleReady = () => {
    setIsReady(true);
    if (initialPosition > 0 && playerRef.current) {
      playerRef.current.seekTo(initialPosition, 'seconds');
    }
  };

  // Обработчик прогресса видео
  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.played);
    setWatchedSeconds(state.playedSeconds);

    // Вызываем обновление прогресса для родительского компонента
    if (onProgressUpdate) {
      onProgressUpdate(state.played);
    }

    // Определяем, когда видео считается просмотренным (85%)
    if (state.played >= 0.85 && !isCompleted) {
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }

    // Периодически сохраняем прогресс в базу данных
    if (progressUpdateTimeout) {
      clearTimeout(progressUpdateTimeout);
    }

    const timeout = setTimeout(() => {
      updateVideoProgress(state.playedSeconds, state.played >= 0.85);
    }, 3000); // Обновляем не чаще чем раз в 3 секунды

    setProgressUpdateTimeout(timeout);
  };

  // Обработчик длительности видео
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  // Обновляем прогресс видео в базе данных
  const updateVideoProgress = async (seconds: number, completed: boolean) => {
    try {
      await progressService.updateVideoProgress(
        userId,
        videoId,
        seconds,
        seconds,
        completed
      );
    } catch (error) {
      console.error('Failed to update video progress:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить прогресс просмотра',
        variant: 'destructive',
      });
    }
  };

  // Обработчик завершения видео
  const handleEnded = () => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete();
    }
    updateVideoProgress(duration, true);
  };

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (progressUpdateTimeout) {
        clearTimeout(progressUpdateTimeout);
        updateVideoProgress(watchedSeconds, isCompleted);
      }
    };
  }, [progressUpdateTimeout, watchedSeconds, isCompleted]);

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <ReactPlayer
        ref={playerRef}
        url={youtubeUrl}
        width="100%"
        height="100%"
        controls
        playing={false}
        onReady={handleReady}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
            },
          },
        }}
      />
    </div>
  );
} 