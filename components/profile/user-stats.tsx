import React from 'react';

interface UserStatsProps {
  watchedVideos: number;
  testsCompleted: number;
  artifactsDownloaded: number;
}

/**
 * Компонент для отображения статистики пользователя
 */
export default function UserStats({ 
  watchedVideos, 
  testsCompleted, 
  artifactsDownloaded 
}: UserStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-card border rounded-lg p-4">
        <div className="text-2xl font-bold">{watchedVideos}</div>
        <div className="text-sm text-muted-foreground">Просмотрено видео</div>
      </div>
      
      <div className="bg-card border rounded-lg p-4">
        <div className="text-2xl font-bold">{testsCompleted}</div>
        <div className="text-sm text-muted-foreground">Пройдено тестов</div>
      </div>
      
      <div className="bg-card border rounded-lg p-4">
        <div className="text-2xl font-bold">{artifactsDownloaded}</div>
        <div className="text-sm text-muted-foreground">Скачано артефактов</div>
      </div>
    </div>
  );
} 