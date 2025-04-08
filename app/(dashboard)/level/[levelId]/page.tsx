import { levelService } from '@/lib/services/levelService';
import { progressService } from '@/lib/services/progressService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle, FileText, List, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import UpdateLevelProgress from './update-level-progress';

interface LevelPageProps {
  params: {
    levelId: string;
  };
}

export default async function LevelPage({ params }: LevelPageProps) {
  // Получаем данные уровня по ID
  const level = await levelService.getLevelById(params.levelId);
  
  // Если уровень не найден, возвращаем 404
  if (!level) {
    notFound();
  }
  
  // Загружаем видео для этого уровня
  const videos = await levelService.getLevelVideos(params.levelId);
  
  // Получаем артефакты уровня
  const artifacts = await levelService.getLevelArtifacts(params.levelId);
  
  // Получаем вопросы для теста
  const quizQuestions = await levelService.getLevelQuizQuestions(params.levelId);
  
  // Получаем текущего пользователя
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Получаем информацию о прогрессе пользователя для этого уровня, если пользователь авторизован
  let userProgress = null;
  let videoProgress = [];
  let isLevelAvailable = level.order_index === 1; // Первый уровень всегда доступен
  
  if (user) {
    // Получаем прогресс пользователя по уровню
    userProgress = await progressService.getUserLevelProgress(user.id, params.levelId);
    
    // Получаем прогресс пользователя по видео
    videoProgress = await progressService.getUserVideoProgress(user.id, params.levelId);
    
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
  const completedVideos = videoProgress.filter((vp: any) => vp.is_completed).length;
  const videoProgressPercentage = videos.length > 0 
    ? Math.round((completedVideos / videos.length) * 100) 
    : 0;
  
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
              currentProgress={userProgress?.completed_percentage || videoProgressPercentage}
              currentStatus={userProgress?.status || 'not_started'}
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
          
          {user && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Прогресс: {userProgress?.completed_percentage || videoProgressPercentage}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{width: `${userProgress?.completed_percentage || videoProgressPercentage}%`}}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Список видео */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Видео</h2>
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Нет доступных видео для этого уровня</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {videos.map((video) => {
              // Находим прогресс для видео
              const vidProgress = videoProgress.find((vp: any) => vp.video_id === video.id);
              const isCompleted = vidProgress?.is_completed || false;
              
              return (
                <Card key={video.id} className={isCompleted ? 'border-green-200' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      {isCompleted && (
                        <div className="text-green-500 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          <span className="text-xs">Просмотрено</span>
                        </div>
                      )}
                    </div>
                    <CardDescription>
                      {video.description || 'Нет описания'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <p className="text-sm">
                        Длительность: {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                      </p>
                      <Button variant="outline" size="sm">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Смотреть
                      </Button>
                    </div>
                    
                    {vidProgress && !isCompleted && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{width: `${(vidProgress.watched_seconds / (video.duration || 1)) * 100}%`}}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Просмотрено: {Math.floor(vidProgress.watched_seconds / 60)}:{(vidProgress.watched_seconds % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Тестовые вопросы - заглушка */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Тестовые вопросы</h2>
        {quizQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-4">
              <p className="text-center text-muted-foreground">Нет тестовых вопросов для этого уровня</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-4">
              <p>Доступно {quizQuestions.length} вопросов</p>
              <Button className="mt-2">Пройти тест</Button>
              
              {userProgress?.quiz_score !== null && (
                <div className="mt-4">
                  <p className="text-sm">Ваш текущий результат: {userProgress?.quiz_score}%</p>
                </div>
              )}
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
        ) : (
          <div className="grid gap-4">
            {artifacts.map((artifact) => (
              <Card key={artifact.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{artifact.title}</CardTitle>
                  <CardDescription>
                    {artifact.description || 'Нет описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {artifact.file_type.toUpperCase()}
                      </div>
                      {artifact.file_size && (
                        <p className="text-sm text-muted-foreground">
                          {(artifact.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Скачать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 