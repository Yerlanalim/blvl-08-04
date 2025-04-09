'use client';

import { Video } from '@/lib/supabase/types';
import { Check, Play, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface VideoListProps {
  videos: Video[];
  activeIndex: number;
  progress: Record<string, { progress: number; isCompleted: boolean }>;
  onSelect: (index: number) => void;
}

export default function VideoList({ videos, activeIndex, progress, onSelect }: VideoListProps) {
  // Функция для форматирования длительности видео
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {videos.map((video, index) => {
        const isActive = index === activeIndex;
        const videoProgress = progress[video.id] || { progress: 0, isCompleted: false };
        const isLocked = index > 0 && !progress[videos[index - 1].id]?.isCompleted;
        
        return (
          <button
            key={video.id}
            className={cn(
              'w-full text-left p-3 rounded-md border transition-all',
              isActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700',
              isLocked && 'opacity-70 cursor-not-allowed'
            )}
            onClick={() => !isLocked && onSelect(index)}
            disabled={isLocked}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                {videoProgress.isCompleted ? (
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : isLocked ? (
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-800">
                    <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                    <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{video.title}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(video.duration)}
                </div>
                
                <div className="mt-2">
                  <Progress
                    value={videoProgress.isCompleted ? 100 : videoProgress.progress * 100}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
      
      {videos.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Нет доступных видео
        </div>
      )}
    </div>
  );
} 