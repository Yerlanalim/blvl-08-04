'use client';

import { useState } from 'react';
import { VideoSection } from '@/components/video';
import { Video, UserVideoProgress } from '@/lib/supabase/types';
import UpdateVideoProgress from './update-video-progress';

interface VideoSectionClientProps {
  videos: Video[];
  userId: string;
  levelId: string;
  videoProgress: UserVideoProgress[];
}

export default function VideoSectionClient({
  videos,
  userId,
  levelId,
  videoProgress,
}: VideoSectionClientProps) {
  const [completedVideos, setCompletedVideos] = useState<Record<string, boolean>>({});

  // Обработчик обновления прогресса видео
  const handleVideoProgressUpdate = (videoId: string, isCompleted: boolean) => {
    if (isCompleted) {
      setCompletedVideos((prev) => ({
        ...prev,
        [videoId]: true,
      }));
    }
  };

  return (
    <>
      <VideoSection
        videos={videos}
        userId={userId}
        videoProgress={videoProgress}
        onProgressUpdate={handleVideoProgressUpdate}
      />
      
      {/* Для каждого завершенного видео создаем компонент для обновления прогресса уровня */}
      {Object.entries(completedVideos).map(([videoId, isCompleted]) => (
        <UpdateVideoProgress
          key={videoId}
          userId={userId}
          levelId={levelId}
          videoId={videoId}
          isCompleted={isCompleted}
        />
      ))}
    </>
  );
} 