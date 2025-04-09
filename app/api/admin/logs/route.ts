import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Необходима авторизация' },
      { status: 401 }
    );
  }
  
  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Отсутствуют права администратора' },
      { status: 403 }
    );
  }
  
  try {
    const { action, resource_type, resource_id, details } = await request.json();
    
    // Validate required fields
    if (!action || !resource_type) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }
    
    // Log the admin action
    const { data, error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: session.user.id,
        action,
        resource_type,
        resource_id: resource_id || null,
        details: details || null,
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error logging admin action:', error);
      return NextResponse.json(
        { error: 'Ошибка при сохранении действия' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in admin log API:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Необходима авторизация' },
      { status: 401 }
    );
  }
  
  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Отсутствуют права администратора' },
      { status: 403 }
    );
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const resourceType = searchParams.get('resource_type');
    
    // Build the query
    let query = supabase
      .from('admin_logs')
      .select(`
        id,
        admin_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at,
        profiles:admin_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    // Add filter if resource_type is provided
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching admin logs:', error);
      return NextResponse.json(
        { error: 'Ошибка при получении журнала действий' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('Error in admin log API:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 