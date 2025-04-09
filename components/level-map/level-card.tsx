'use client';

import { Level } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Award, TrendingUp, Unlock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { memo, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type LevelState = 'available' | 'in_progress' | 'completed' | 'locked';

interface LevelCardProps {
  level: Level;
  progress?: number;
  status?: LevelState;
  videosCompleted?: number;
  totalVideos?: number;
  isNewlyUnlocked?: boolean;
}

function LevelCardComponent({
  level,
  progress = 0,
  status = 'locked',
  videosCompleted = 0,
  totalVideos = 0,
  isNewlyUnlocked = false,
}: LevelCardProps) {
  // Добавляем состояние для эффекта подсветки
  const [isHighlighted, setIsHighlighted] = useState(isNewlyUnlocked);
  
  // Автоматически сбрасываем эффект подсветки через 5 секунд
  useEffect(() => {
    if (isNewlyUnlocked) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isNewlyUnlocked]);

  // Мемоизируем вычисления стилей для улучшения производительности
  const borderColor = useMemo(() => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500';
      case 'in_progress':
        return 'border-l-blue-500';
      case 'available':
        return isHighlighted ? 'border-l-amber-400' : 'border-l-amber-500';
      case 'locked':
      default:
        return 'border-l-gray-300 dark:border-l-gray-700';
    }
  }, [status, isHighlighted]);

  // Мемоизируем компонент бейджа статуса для предотвращения ненужных ререндеров
  const statusBadge = useMemo(() => {
    switch (status) {
      case 'completed':
        return (
          <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>Завершено</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>В процессе</span>
          </div>
        );
      case 'available':
        return (
          <div className={`${isHighlighted ? 'bg-amber-100 dark:bg-amber-800 animate-pulse' : 'bg-amber-100 dark:bg-amber-900'} text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
            <Unlock className="w-3 h-3" />
            <span>{isHighlighted ? 'Новый!' : 'Доступен'}</span>
          </div>
        );
      case 'locked':
      default:
        return (
          <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Заблокирован</span>
          </div>
        );
    }
  }, [status, isHighlighted]);

  // Мемоизируем контент карточки для предотвращения ненужных ререндеров
  const cardContent = useMemo(() => (
    <>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{level.title}</CardTitle>
          {!level.is_free && (
            <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-medium">
              Премиум
            </div>
          )}
        </div>
        <CardDescription>{level.description || 'Нет описания'}</CardDescription>
      </CardHeader>
      <CardContent>
        {level.thumbnail_url && (
          <div className="relative w-full h-32 mb-4 rounded-md overflow-hidden">
            <Image
              src={level.thumbnail_url}
              alt={level.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <p>Прогресс: {progress}%</p>
            <p>{videosCompleted}/{totalVideos} видео</p>
          </div>
          {statusBadge}
        </div>
        
        {status !== 'locked' && progress > 0 && progress < 100 && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </CardContent>
    </>
  ), [level, progress, videosCompleted, totalVideos, statusBadge, status]);

  // Мемоизируем классы для карточки
  const cardClasses = useMemo(() => 
    `border-l-4 ${borderColor} transition-all duration-200 ${
      status !== 'locked' ? 'hover:shadow-md cursor-pointer' : 'opacity-80'
    } ${isHighlighted ? 'shadow-lg shadow-amber-200 dark:shadow-amber-900/30' : ''}`,
    [borderColor, status, isHighlighted]
  );

  // Обертываем в motion.div для анимации, если уровень только что разблокирован
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isHighlighted) {
      return (
        <motion.div
          initial={{ scale: 0.95, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, repeat: 0, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      );
    }
    return <>{children}</>;
  };

  return (
    <CardWrapper>
      <Card className={cardClasses}>
        {status !== 'locked' ? (
          <Link href={`/level/${level.id}`} className="block">
            {cardContent}
          </Link>
        ) : (
          cardContent
        )}
      </Card>
    </CardWrapper>
  );
}

// Используем memo для предотвращения ненужных перерендеров
export const LevelCard = memo(LevelCardComponent); 