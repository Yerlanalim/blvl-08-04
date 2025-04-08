import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Карта уровней</h1>
        <p className="text-muted-foreground mt-2">
          Исследуйте уровни обучения и отслеживайте ваш прогресс
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Level 1 */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle>Уровень 1</CardTitle>
            <CardDescription>Основы бизнеса</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>Прогресс: 100%</p>
                <p>5/5 видео</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                Завершено
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level 2 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle>Уровень 2</CardTitle>
            <CardDescription>Маркетинг и продажи</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>Прогресс: 60%</p>
                <p>3/5 видео</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                В процессе
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level 3 */}
        <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
          <CardHeader className="pb-2">
            <CardTitle>Уровень 3</CardTitle>
            <CardDescription>Финансы и инвестиции</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>Прогресс: 0%</p>
                <p>0/5 видео</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                Заблокировано
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level 4 */}
        <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
          <CardHeader className="pb-2">
            <CardTitle>Уровень 4</CardTitle>
            <CardDescription>Управление командой</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>Прогресс: 0%</p>
                <p>0/5 видео</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                Заблокировано
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level 5 */}
        <Card className="border-l-4 border-l-gray-300 dark:border-l-gray-700">
          <CardHeader className="pb-2">
            <CardTitle>Уровень 5</CardTitle>
            <CardDescription>Масштабирование бизнеса</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>Прогресс: 0%</p>
                <p>0/5 видео</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                Заблокировано
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 