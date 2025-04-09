import { createServerSupabaseClient } from '@/lib/supabase/client';
import { cache } from 'react';
import { Artifact, UserArtifact, UserArtifactInsert } from '@/lib/supabase/types';

// Константы для конфигурации
const ARTIFACTS_BUCKET = 'artifacts';
const SIGNED_URL_EXPIRY = 300; // 5 минут в секундах

/**
 * Сервис для работы с артефактами (учебными материалами)
 */
class ArtifactService {
  /**
   * Получить все артефакты для указанного уровня
   */
  getLevelArtifacts = cache(async (levelId: string): Promise<Artifact[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('level_id', levelId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching artifacts:', error);
      return [];
    }
    
    return data || [];
  });

  /**
   * Получить артефакт по ID
   */
  getArtifactById = cache(async (artifactId: string): Promise<Artifact | null> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();
    
    if (error) {
      console.error('Error fetching artifact:', error);
      return null;
    }
    
    return data;
  });

  /**
   * Получить все скачанные артефакты пользователя
   */
  getUserArtifacts = cache(async (userId: string): Promise<UserArtifact[]> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_artifacts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user artifacts:', error);
      return [];
    }
    
    return data || [];
  });

  /**
   * Получить скачанные артефакты пользователя для конкретного уровня
   * Включает дополнительную информацию об артефактах
   */
  getUserLevelArtifacts = cache(async (userId: string, levelId: string): Promise<UserArtifact[]> => {
    const supabase = createServerSupabaseClient();
    
    // Оптимизированный запрос с использованием join вместо множественных запросов
    const { data, error } = await supabase
      .from('user_artifacts')
      .select(`
        *,
        artifact:artifacts(*)
      `)
      .eq('user_id', userId)
      .eq('artifact.level_id', levelId);
    
    if (error) {
      console.error('Error fetching user level artifacts:', error);
      return [];
    }
    
    return data || [];
  });

  /**
   * Проверить, скачал ли пользователь артефакт
   * Использование maybeSingle для получения null вместо ошибки, если запись не найдена
   */
  hasUserDownloadedArtifact = cache(async (userId: string, artifactId: string): Promise<boolean> => {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_artifacts')
      .select('id')
      .eq('user_id', userId)
      .eq('artifact_id', artifactId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if user downloaded artifact:', error);
      return false;
    }
    
    return !!data;
  });

  /**
   * Получить URL для скачивания артефакта
   * Создает подписанный URL для безопасного доступа к файлу
   */
  getArtifactDownloadUrl = async (filePath: string): Promise<string | null> => {
    const supabase = createServerSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .storage
        .from(ARTIFACTS_BUCKET)
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data?.signedUrl || null;
    } catch (e) {
      console.error('Error creating signed URL:', e);
      return null;
    }
  };

  /**
   * Отметить артефакт как скачанный пользователем
   * Проверяет, не скачан ли артефакт уже, и записывает информацию о скачивании
   */
  markArtifactAsDownloaded = async (userId: string, artifactId: string): Promise<boolean> => {
    const supabase = createServerSupabaseClient();
    
    try {
      // Проверяем, не скачан ли уже артефакт
      const isDownloaded = await this.hasUserDownloadedArtifact(userId, artifactId);
      if (isDownloaded) {
        return true; // Уже скачан
      }
      
      const userArtifact: UserArtifactInsert = {
        user_id: userId,
        artifact_id: artifactId,
        downloaded_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_artifacts')
        .insert(userArtifact);
      
      if (error) {
        console.error('Error marking artifact as downloaded:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error when marking artifact as downloaded:', error);
      return false;
    }
  };

  /**
   * Обновить общий прогресс пользователя по уровню после скачивания артефакта
   * Вычисляет процент скачанных артефактов и обновляет общий прогресс
   */
  updateLevelProgressAfterDownload = async (userId: string, levelId: string): Promise<void> => {
    const supabase = createServerSupabaseClient();
    
    try {
      // Получаем все артефакты уровня
      const allArtifacts = await this.getLevelArtifacts(levelId);
      
      // Получаем скачанные артефакты пользователя
      const userArtifacts = await this.getUserLevelArtifacts(userId, levelId);
      
      // Вычисляем процент скачанных артефактов
      const totalArtifacts = allArtifacts.length;
      const downloadedArtifacts = userArtifacts.length;
      
      if (totalArtifacts === 0) return;
      
      const downloadedPercentage = Math.round((downloadedArtifacts / totalArtifacts) * 100);
      
      // Обновляем прогресс в таблице user_progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          level_id: levelId,
          artifacts_percentage: downloadedPercentage,
          last_updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,level_id'
        });
      
      if (error) {
        console.error('Error updating level progress after download:', error);
      }
    } catch (error) {
      console.error('Unexpected error updating level progress after download:', error);
    }
  };
  
  /**
   * Получить статистику по скачанным артефактам для пользователя
   */
  getUserArtifactsStats = cache(async (userId: string): Promise<{ total: number, byLevel: Record<string, number> }> => {
    const supabase = createServerSupabaseClient();
    
    try {
      // Получаем все скачанные артефакты пользователя с их уровнями
      const { data, error } = await supabase
        .from('user_artifacts')
        .select(`
          *,
          artifact:artifacts(level_id)
        `)
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user artifacts stats:', error);
        return { total: 0, byLevel: {} };
      }
      
      // Подсчитываем статистику по уровням
      const byLevel: Record<string, number> = {};
      
      data?.forEach(item => {
        if (item.artifact && item.artifact.level_id) {
          const levelId = item.artifact.level_id;
          byLevel[levelId] = (byLevel[levelId] || 0) + 1;
        }
      });
      
      return {
        total: data?.length || 0,
        byLevel
      };
    } catch (error) {
      console.error('Unexpected error getting user artifacts stats:', error);
      return { total: 0, byLevel: {} };
    }
  });
}

export const artifactService = new ArtifactService(); 