import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { artifactService } from '@/lib/services';

export async function POST(request: NextRequest) {
  // Получаем данные из тела запроса
  const { artifactId } = await request.json();
  
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
    
    // Отмечаем артефакт как скачанный
    const success = await artifactService.markArtifactAsDownloaded(user.id, artifactId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark artifact as downloaded' },
        { status: 500 }
      );
    }
    
    // Обновляем общий прогресс пользователя
    await artifactService.updateLevelProgressAfterDownload(user.id, artifact.level_id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking artifact as downloaded:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 