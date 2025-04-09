import { createServerSupabaseClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Тестовый запрос к таблице test_connection
    const { data, error } = await supabase
      .from('test_connection')
      .select('*')
      .limit(5);
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    // Тестовый запрос к таблице levels
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('id, title, order_index')
      .limit(5);
    
    if (levelsError) {
      return NextResponse.json(
        { success: false, error: levelsError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      testConnection: data,
      levels,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Supabase test error:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }
} 