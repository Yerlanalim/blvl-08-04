'use client';

import { useState, useEffect } from 'react';
import { Video, UserVideoProgress } from '@/lib/supabase/types';
import VideoPlayer from './video-player';
import VideoList from './video-list';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { progressService } from '@/lib/services';
import { debounce } from '@/lib/utils';

interface VideoSectionProps {
  videos: Video[];
  userId: string;
  videoProgress?: UserVideoProgress[];
  onProgressUpdate?: (videoId: string, isCompleted: boolean) => void;
}

export default function VideoSection({
  videos,
  userId,
  videoProgress = [],
  onProgressUpdate,
}: VideoSectionProps) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [localProgress, setLocalProgress] = useState<Record<string, { progress: number; isCompleted: boolean }>>(
    {}
  );

  const activeVideo = videos[activeVideoIndex];
  
  // Инициализируем локальный прогресс на основе данных из базы
  useEffect(() => {
    const initialProgress: Record<string, { progress: number; isCompleted: boolean }> = {};
    
    videos.forEach((video) => {
      const progress = videoProgress.find((vp) => vp.video_id === video.id);
      initialProgress[video.id] = {
        progress: progress ? progress.last_position / (video.duration || 1) : 0,
        isCompleted: progress?.is_completed || false,
      };
    });
    
    setLocalProgress(initialProgress);
  }, [videos, videoProgress]);

  // Обработчик обновления прогресса
  const handleProgressUpdate = (videoId: string, progress: number) => {
    setLocalProgress((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        progress,
      },
    }));
  };

  // Обработчик завершения видео
  const handleVideoComplete = (videoId: string) => {
    setLocalProgress((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        isCompleted: true,
      },
    }));
    
    if (onProgressUpdate) {
      onProgressUpdate(videoId, true);
    }
    
    // Если это не последнее видео, переходим к следующему
    if (activeVideoIndex < videos.length - 1) {
      setTimeout(() => {
        setActiveVideoIndex(activeVideoIndex + 1);
      }, 1500); // Даем немного времени для отображения состояния завершения
    }
  };

  // Переключение на другое видео
  const handleVideoSelect = (index: number) => {
    setActiveVideoIndex(index);
  };

  // Функция для определения начальной позиции видео
  const getInitialPosition = (videoId: string) => {
    const progress = videoProgress.find((vp) => vp.video_id === videoId);
    return progress?.last_position || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">{activeVideo?.title}</h2>
            {activeVideo?.description && <p className="text-muted-foreground mb-4">{activeVideo.description}</p>}
            
            {activeVideo && (
              <VideoPlayer
                videoId={activeVideo.id}
                userId={userId}
                youtubeUrl={activeVideo.youtube_url}
                initialPosition={getInitialPosition(activeVideo.id)}
                onComplete={() => handleVideoComplete(activeVideo.id)}
                onProgressUpdate={(progress) => handleProgressUpdate(activeVideo.id, progress)}
              />
            )}
            
            {!activeVideo && (
              <div className="aspect-video w-full bg-gray-900 rounded-lg flex items-center justify-center">
                <p className="text-white">Видео не найдено</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Список видео</h3>
            <Separator className="mb-4" />
            <VideoList
              videos={videos}
              activeIndex={activeVideoIndex}
              progress={localProgress}
              onSelect={handleVideoSelect}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 