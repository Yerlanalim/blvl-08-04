import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
        <p className="text-muted-foreground mt-2">
          Управляйте вашим профилем и просматривайте статистику прогресса
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Info Card */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Информация о профиле</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Фото профиля" />
                <AvatarFallback className="text-xl">ПЗ</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-medium">Пользователь</h3>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Дата регистрации:</span>
                <span className="text-sm text-muted-foreground">15.03.2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Последний вход:</span>
                <span className="text-sm text-muted-foreground">Сегодня</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Уровень:</span>
                <span className="text-sm text-muted-foreground">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс обучения</CardTitle>
              <CardDescription>Статистика вашего обучения</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Общий прогресс:</span>
                    <span className="text-sm">32%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "32%" }} />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-muted-foreground">Просмотрено видео</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-2xl font-bold">2</div>
                    <div className="text-sm text-muted-foreground">Пройдено тестов</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-muted-foreground">Скачано артефактов</div>
                  </div>
                </div>
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
                <div className="border-l-2 border-primary pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px]"></div>
                  <div className="text-sm font-medium">Просмотрено видео "Финансовое планирование"</div>
                  <div className="text-xs text-muted-foreground">Сегодня, 12:45</div>
                </div>
                <div className="border-l-2 border-primary pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px]"></div>
                  <div className="text-sm font-medium">Пройден тест "Маркетинговые стратегии"</div>
                  <div className="text-xs text-muted-foreground">Вчера, 16:30</div>
                </div>
                <div className="border-l-2 border-primary pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px]"></div>
                  <div className="text-sm font-medium">Скачан артефакт "Шаблон бизнес-плана"</div>
                  <div className="text-xs text-muted-foreground">02.04.2024, 10:15</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 