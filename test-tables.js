const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('Connected to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    'profiles', 
    'levels', 
    'videos', 
    'quiz_questions', 
    'artifacts', 
    'user_progress', 
    'user_video_progress', 
    'user_artifacts'
  ];
  
  console.log('Checking tables for data...');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error(`Error checking table ${table}:`, error);
        continue;
      }
      
      console.log(`Table '${table}': ${data.length > 0 ? 'has data' : 'empty'}`);
      if (data.length > 0) {
        console.log(`Sample data:`, data[0]);
      }
    } catch (err) {
      console.error(`Unexpected error with table ${table}:`, err);
    }
  }
}

checkTables(); 