import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { progressService } from "@/lib/services/progressService";
import { levelService } from "@/lib/services/levelService";
import { videoService } from "@/lib/services/videoService";
import { artifactService } from "@/lib/services/artifactService";
import { testService } from "@/lib/services/testService";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import UserProfileEditForm from "@/components/profile/user-profile-edit-form";
import LevelProgressList from "@/components/profile/level-progress-list";
import UserStats from "@/components/profile/user-stats";
import { LevelWithProgress } from "@/components/level-map/level-map";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  
  // Fetch authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Необходима авторизация для просмотра страницы</div>;
  }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  // Fetch user registration date from auth.users
  const { data: userDetails } = await supabase
    .from('auth.users')
    .select('created_at')
    .eq('id', user.id)
    .single();
    
  const registrationDate = userDetails?.created_at ? formatDate(userDetails.created_at) : 'Нет данных';
  const lastLoginDate = user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Нет данных';
  
  // Fetch user progress data
  const userProgress = await progressService.getUserProgress(user.id);
  
  // Fetch all levels
  const levels = await levelService.getAllLevels();
  
  // Prepare levels with progress info
  const levelsWithProgress = await progressService.prepareLevelsWithProgress(levels, user.id);
  
  // Calculate the total progress
  const totalLevels = levels.length;
  const completedLevels = userProgress.filter(p => p.status === 'completed').length;
  const inProgressLevels = userProgress.filter(p => p.status === 'in_progress').length;
  
  const overallProgress = totalLevels > 0 
    ? Math.round((completedLevels / totalLevels) * 100) 
    : 0;
  
  // Get video stats
  const videoProgress = await videoService.getUserVideoProgress(user.id);
  const watchedVideos = videoProgress.filter(p => p.is_completed).length;
  
  // Get artifacts stats
  const artifactsStats = await artifactService.getUserArtifactsStats(user.id);
  
  // Get tests completed count (where score >= 70%)
  const testsCompleted = userProgress.filter(p => p.quiz_score !== null && p.quiz_score >= 70).length;
  
  // Init avatar data
  const avatarUrl = profile?.avatar_url || '/placeholder-avatar.jpg';
  const avatarFallback = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'ПЗ';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground mt-2">
          Управляйте вашим профилем и просматривайте статистику прогресса
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Информация</TabsTrigger>
          <TabsTrigger value="progress">Прогресс обучения</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-12">
            {/* Profile Info Card */}
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Информация о профиле</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt="Фото профиля" />
                    <AvatarFallback className="text-xl">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-xl font-medium">{profile?.full_name || 'Пользователь'}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {profile?.position && (
                      <p className="text-sm font-medium mt-1">{profile.position}</p>
                    )}
                    {profile?.company && (
                      <p className="text-sm text-muted-foreground">{profile.company}</p>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Дата регистрации:</span>
                    <span className="text-sm text-muted-foreground">{registrationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Последний вход:</span>
                    <span className="text-sm text-muted-foreground">{lastLoginDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Статус:</span>
                    <Badge variant="outline" className="text-xs">
                      {totalLevels > 0 && completedLevels === totalLevels
                        ? 'Обучение завершено'
                        : completedLevels > 0
                          ? `Уровень ${completedLevels}`
                          : 'Новичок'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Stats */}
            <div className="md:col-span-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Прогресс обучения</CardTitle>
                  <CardDescription>
                    {completedLevels > 0 
                      ? `Вы прошли ${completedLevels} из ${totalLevels} уровней` 
                      : 'Начните прохождение уровней для отслеживания прогресса'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Общий прогресс:</span>
                        <span className="text-sm">{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                    
                    <UserStats 
                      watchedVideos={watchedVideos}
                      testsCompleted={testsCompleted}
                      artifactsDownloaded={artifactsStats.total}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Активность</CardTitle>
                  <CardDescription>Последние действия</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userProgress.length > 0 ? (
                      userProgress
                        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                        .slice(0, 3)
                        .map((progress, index) => {
                          const level = levels.find(l => l.id === progress.level_id);
                          return (
                            <div key={index} className="border-l-2 border-primary pl-4 pb-4 relative">
                              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px]"></div>
                              <div className="text-sm font-medium">
                                {progress.status === 'completed' 
                                  ? `Завершен уровень "${level?.title || 'Неизвестный уровень'}"` 
                                  : `Прогресс по уровню "${level?.title || 'Неизвестный уровень'}": ${progress.completed_percentage}%`}
                              </div>
                              <div className="text-xs text-muted-foreground">{formatDate(progress.updated_at)}</div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-sm text-muted-foreground">Нет данных об активности</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <LevelProgressList 
            levelsWithProgress={levelsWithProgress as LevelWithProgress[]} 
            userId={user.id} 
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <UserProfileEditForm 
            userId={user.id} 
            initialProfile={profile} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 