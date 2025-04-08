import { levelService } from '@/lib/services/levelService';
import { LevelMap, LevelWithProgress } from '@/components/level-map/level-map';
import { ProgressProvider } from '@/components/level-map/progress-provider';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { progressService } from '@/lib/services/progressService';

// Временные мокапы тестовых данных для демонстрации
const getTempVideoCounts = (levelId: string) => {
  const levelNumber = parseInt(levelId.slice(-1), 10) || 1;
  return {
    total: 5,
    completed: levelNumber === 1 ? 5 : levelNumber === 2 ? 3 : 0
  };
};

const getTempLevelStatus = (levelId: string): 'available' | 'in_progress' | 'completed' | 'locked' => {
  const levelNumber = parseInt(levelId.slice(-1), 10) || 1;
  
  if (levelNumber === 1) return 'completed';
  if (levelNumber === 2) return 'in_progress';
  if (levelNumber === 3) return 'available';
  return 'locked';
};

export default async function DashboardHomePage() {
  // Получаем Supabase клиент и текущего пользователя
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Получаем все уровни из базы данных
  const levels = await levelService.getAllLevels();
  
  // Если пользователь авторизован, получаем данные о прогрессе
  let levelsWithProgress: LevelWithProgress[] = [];
  
  if (user) {
    // Используем сервис прогресса для получения данных
    levelsWithProgress = await progressService.prepareLevelsWithProgress(levels, user.id);
  } else {
    // Если пользователь не авторизован, используем моковые данные
    levelsWithProgress = levels.map((level) => {
      const levelNumber = parseInt(level.id.slice(-1), 10) || 1;
      const status = levelNumber === 1 ? 'available' : 'locked';
      
      return {
        ...level,
        progress: 0,
        status: status as 'available' | 'locked',
        videosCompleted: 0,
        totalVideos: 5
      };
    });
  }
  
  // Если пользователь авторизован, оборачиваем в ProgressProvider для обновлений в реальном времени
  if (user) {
    return (
      <ProgressProvider 
        initialLevelsWithProgress={levelsWithProgress} 
        userId={user.id}
      >
        <LevelMap />
      </ProgressProvider>
    );
  }
  
  // Если пользователь не авторизован, просто отображаем карту без обновлений в реальном времени
  return <LevelMap levels={levelsWithProgress} />;
} 