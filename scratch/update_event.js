const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAndUpdateEvents() {
  console.log('Fetching all events...');
  
  // Try to list all events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching events:', error);
    
    // Try without filters
    const { data: events2, error: error2 } = await supabase
      .from('events')
      .select('id, title, date, time, location, created_at')
      .limit(10);
    
    if (error2) {
      console.error('Error fetching events (attempt 2):', error2);
    } else {
      console.log('Events (attempt 2):', JSON.stringify(events2, null, 2));
    }
    return;
  }
  
  console.log(`Found ${events.length} events:`);
  events.forEach((event, index) => {
    console.log(`\n--- Event ${index + 1} ---`);
    console.log('ID:', event.id);
    console.log('Title:', event.title);
    console.log('Date:', event.date);
    console.log('Time:', event.time);
    console.log('Location:', event.location);
    console.log('Created at:', event.created_at);
  });
  
  if (events.length >= 3) {
    const thirdEvent = events[2];
    console.log(`\nUpdating event ID: ${thirdEvent.id}...`);
    
    const { data: updated, error: updateError } = await supabase
      .from('events')
      .update({
        title: '4ième Edition du forum National des jeunes sur la Gouvernance de l\'internet au Bénin',
        date: '2026-07-18',
        time: '08:00',
        location: 'Parakou'
      })
      .eq('id', thirdEvent.id)
      .select();
    
    if (updateError) {
      console.error('Error updating event:', updateError);
    } else {
      console.log('Event updated successfully:', JSON.stringify(updated, null, 2));
    }
  }
}

listAndUpdateEvents().catch(console.error);
