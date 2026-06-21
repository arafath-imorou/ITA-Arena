const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://eqqdjqdbbwmshllqesdt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWRqcWRiYndtc2hsbHFlc2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDEwMjcsImV4cCI6MjA5MTc3NzAyN30._DzQtFyU5Hz8trB1b86cxxHarmy5t35kZHdg2_2a4_o');

async function run() {
  const { data, error } = await supabase.from('events_with_stats').select('id, is_closed').ilike('title', '%CAMARADERIE LES MERVEILLES DU MANIOC%');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}
run();
