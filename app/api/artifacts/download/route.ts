import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { artifactService } from '@/lib/services';
import { levelService } from '@/lib/services';
import { progressService } from '@/lib/services';

export async function GET(request: NextRequest) {
  // Получаем ID артефакта из параметра запроса
  const artifactId = request.nextUrl.searchParams.get('artifactId');
  
  if (!artifactId) {
    return NextResponse.json(
      { error: 'Artifact ID is required' },
      { status: 400 }
    );
  }
  
  // Получаем пользователя
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Получаем информацию об артефакте
    const artifact = await artifactService.getArtifactById(artifactId);
    
    if (!artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }
    
    // Проверяем доступность уровня для пользователя
    const level = await levelService.getLevelById(artifact.level_id);
    
    if (!level) {
      return NextResponse.json(
        { error: 'Level not found' },
        { status: 404 }
      );
    }
    
    // Проверяем, доступен ли уровень для пользователя
    // Если это первый уровень, то он всегда доступен
    if (level.order_index !== 1) {
      // Получаем все уровни и прогресс пользователя
      const allLevels = await levelService.getAllLevels();
      const userProgress = await progressService.getUserProgress(user.id);
      
      // Определяем доступность уровня
      const levelStatus = progressService.calculateLevelStatus(
        level.order_index,
        userProgress,
        allLevels
      );
      
      // Если уровень заблокирован, запрещаем доступ к артефакту
      if (levelStatus === 'locked') {
        return NextResponse.json(
          { error: 'Access to this artifact is restricted' },
          { status: 403 }
        );
      }
    }
    
    // Получаем подписанный URL для скачивания
    const downloadUrl = await artifactService.getArtifactDownloadUrl(artifact.file_path);
    
    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      url: downloadUrl,
      artifact: {
        id: artifact.id,
        title: artifact.title,
        file_type: artifact.file_type,
        file_size: artifact.file_size
      }
    });
  } catch (error) {
    console.error('Error generating artifact download URL:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 