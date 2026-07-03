const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://eqqdjqdbbwmshllqesdt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxcWRqcWRiYndtc2hsbHFlc2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDEwMjcsImV4cCI6MjA5MTc3NzAyN30._DzQtFyU5Hz8trB1b86cxxHarmy5t35kZHdg2_2a4_o');

supabase.from('events').update({
    price: "Salon First Class (06 Personnes x 150.000 = 900 000), 70.000 F CFA : Business Class & 30.000 F CFA"
}).ilike('title', '%SILLAGE COUTURE%').then(({data, error}) => {
    console.log(error || "Success");
});
