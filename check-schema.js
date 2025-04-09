const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Ошибка: Необходимо указать NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Получаем список всех таблиц
    console.log('Получаем список таблиц...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Ошибка при получении списка таблиц:', tablesError);
      return;
    }
    
    console.log('Найдены таблицы:', tables.map(t => t.tablename).join(', '));
    
    // Проверяем структуру таблицы quiz_questions
    console.log('\nПроверяем структуру таблицы quiz_questions...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'quiz_questions');
    
    if (columnsError) {
      console.error('Ошибка при получении структуры таблицы:', columnsError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('Колонки в таблице quiz_questions:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('Таблица quiz_questions не найдена или не содержит колонок.');
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
}

checkSchema(); 