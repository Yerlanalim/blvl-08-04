import { levelService } from '@/lib/services/levelService';
import { progressService } from '@/lib/services/progressService';
import { videoService } from '@/lib/services/videoService';
import { testService } from '@/lib/services/testService';
import { artifactService } from '@/lib/services/artifactService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle, FileText, List, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import UpdateLevelProgress from '@/app/(dashboard)/level/[levelId]/update-level-progress';
import VideoSectionClient from './video-section-client';
import TestSectionClient from './test-section-client';
import ArtifactSectionClient from './artifact-section-client';
import { UserVideoProgress, ProgressStatus, UserArtifact, UserProgress } from '@/lib/supabase/types';

// Расширенный интерфейс прогресса пользователя с дополнительными полями
interface ExtendedUserProgress extends UserProgress {
  video_percentage?: number;
  quiz_percentage?: number;
  artifacts_percentage?: number;
  overall_progress?: number;
}

interface LevelPageProps {
  params: {
    levelId: string;
  };
}

// Функция для расчета общего прогресса пользователя по уровню
async function calculateOverallProgress(userId: string, levelId: string) {
  // Получаем информацию о прогрессе пользователя
  const userProgress = await progressService.getUserLevelProgress(userId, levelId) as ExtendedUserProgress;
  
  if (!userProgress) {
    // Если нет записи о прогрессе, возвращаем 0
    return 0;
  }
  
  // Получаем отдельные компоненты прогресса
  const videoPercentage = userProgress.video_percentage || 0;
  const quizPercentage = userProgress.quiz_percentage || 0;
  const artifactsPercentage = userProgress.artifacts_percentage || 0;
  
  // Вычисляем общий прогресс (среднее значение всех компонентов)
  // Учитываем только те компоненты, для которых задан вес больше 0
  let totalWeight = 0;
  let weightedProgress = 0;
  
  if (videoPercentage > 0) {
    weightedProgress += videoPercentage * 0.6; // 60% от общего прогресса
    totalWeight += 0.6;
  }
  
  if (quizPercentage > 0) {
    weightedProgress += quizPercentage * 0.3; // 30% от общего прогресса
    totalWeight += 0.3;
  }
  
  if (artifactsPercentage > 0) {
    weightedProgress += artifactsPercentage * 0.1; // 10% от общего прогресса
    totalWeight += 0.1;
  }
  
  if (totalWeight === 0) {
    return 0;
  }
  
  // Нормализуем прогресс по фактическому весу компонентов
  return Math.round(weightedProgress / totalWeight);
}

export default async function LevelPage({ params }: LevelPageProps) {
  // Получаем данные уровня по ID
  const level = await levelService.getLevelById(params.levelId);
  
  // Если уровень не найден, возвращаем 404
  if (!level) {
    notFound();
  }
  
  // Загружаем видео для этого уровня
  const videos = await videoService.getLevelVideos(params.levelId);
  
  // Получаем артефакты уровня
  const artifacts = await artifactService.getLevelArtifacts(params.levelId);
  
  // Получаем вопросы для теста
  const quizQuestions = await testService.getLevelQuestions(params.levelId);
  
  // Получаем текущего пользователя
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Получаем информацию о прогрессе пользователя для этого уровня, если пользователь авторизован
  let userProgress: ExtendedUserProgress | null = null;
  let videoProgress: UserVideoProgress[] = [];
  let downloadedArtifacts: UserArtifact[] = [];
  let isLevelAvailable = level.order_index === 1; // Первый уровень всегда доступен
  
  if (user) {
    // Получаем прогресс пользователя по уровню
    userProgress = await progressService.getUserLevelProgress(user.id, params.levelId) as ExtendedUserProgress;
    
    // Получаем прогресс пользователя по видео
    videoProgress = await videoService.getUserLevelVideoProgress(user.id, params.levelId);
    
    // Получаем скачанные артефакты пользователя
    downloadedArtifacts = await artifactService.getUserLevelArtifacts(user.id, params.levelId);
    
    // Определяем доступность уровня
    if (!userProgress) {
      // Если нет записи о прогрессе, проверяем статус уровня
      const allLevels = await levelService.getAllLevels();
      const allUserProgress = await progressService.getUserProgress(user.id);
      
      const levelStatus = progressService.calculateLevelStatus(
        level.order_index,
        allUserProgress,
        allLevels
      );
      
      isLevelAvailable = levelStatus !== 'locked';
    } else {
      // Если есть запись о прогрессе, уровень доступен
      isLevelAvailable = true;
    }
    
    // Рассчитываем общий прогресс пользователя по уровню
    if (userProgress) {
      userProgress.overall_progress = await calculateOverallProgress(user.id, params.levelId);
    }
  }
  
  // Если уровень недоступен, показываем соответствующий UI
  if (!isLevelAvailable) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{level.title}</h1>
            {!level.is_free && (
              <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
                Премиум
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Link href="/">
              <Button variant="outline">Вернуться на карту</Button>
            </Link>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Уровень заблокирован
            </CardTitle>
            <CardDescription>
              Пожалуйста, завершите предыдущие уровни, чтобы получить доступ к этому уровню.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>
                Вернуться к карте уровней
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Вычисляем прогресс по видео
  const videoProgressPercentage = user 
    ? await videoService.calculateLevelVideoProgress(user.id, params.levelId)
    : 0;
  
  let overallProgress = 0;
  
  if (user && userProgress) {
    overallProgress = userProgress.overall_progress || 0;
  }
  
  return (
    <div className="space-y-8">
      {/* Заголовок страницы с кнопкой назад */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{level.title}</h1>
          {!level.is_free && (
            <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
              Премиум
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <Link href="/">
            <Button variant="outline">Вернуться на карту</Button>
          </Link>
          
          {user && (
            <UpdateLevelProgress
              levelId={params.levelId}
              userId={user.id}
              currentProgress={overallProgress}
              currentStatus={(userProgress?.status as ProgressStatus) || 'not_started'}
            />
          )}
        </div>
      </div>

      {/* Карточка информации о уровне */}
      <Card>
        <CardHeader>
          <CardTitle>Об уровне</CardTitle>
          <CardDescription>
            {level.description || 'Нет описания'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {level.thumbnail_url && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
              <Image
                src={level.thumbnail_url}
                alt={level.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          )}
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-4">
            <div className="flex items-center gap-2">
              <PlayCircle className="text-blue-500" />
              <div>
                <p className="text-sm font-medium">Видео</p>
                <p className="text-sm text-muted-foreground">{videos.length} шт.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <List className="text-amber-500" />
              <div>
                <p className="text-sm font-medium">Тестовые вопросы</p>
                <p className="text-sm text-muted-foreground">{quizQuestions.length} шт.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="text-green-500" />
              <div>
                <p className="text-sm font-medium">Артефакты</p>
                <p className="text-sm text-muted-foreground">{artifacts.length} шт.</p>
              </div>
            </div>
          </div>
          
          {user && userProgress && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Прогресс: {overallProgress}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{width: `${overallProgress}%`}}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                <div>Видео: {userProgress.video_percentage || 0}%</div>
                <div>Тесты: {userProgress.quiz_percentage || 0}%</div>
                <div>Материалы: {userProgress.artifacts_percentage || 0}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Секция видео */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Видео</h2>
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Нет доступных видео для этого уровня</p>
            </CardContent>
          </Card>
        ) : user ? (
          <VideoSectionClient 
            videos={videos}
            userId={user.id}
            levelId={params.levelId}
            videoProgress={videoProgress}
          />
        ) : (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Войдите в систему для просмотра видео</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Тестовые вопросы */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Тестовые вопросы</h2>
        {quizQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Нет тестовых вопросов для этого уровня</p>
            </CardContent>
          </Card>
        ) : user ? (
          <TestSectionClient 
            questions={quizQuestions}
            userId={user.id}
            levelId={params.levelId}
            currentScore={userProgress?.quiz_score || null}
          />
        ) : (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Войдите в систему для прохождения тестов</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Артефакты */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Артефакты</h2>
        {artifacts.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Нет артефактов для этого уровня</p>
            </CardContent>
          </Card>
        ) : user ? (
          <ArtifactSectionClient
            artifacts={artifacts}
            userId={user.id}
            levelId={params.levelId}
            downloadedArtifacts={downloadedArtifacts}
          />
        ) : (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Войдите в систему для скачивания артефактов</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 