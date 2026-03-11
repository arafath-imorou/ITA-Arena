import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krtzszpeftpqogqzlmey.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydHpzenBlZnRwcW9ncXpsbWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTA1NzcsImV4cCI6MjA4ODY2NjU3N30.382sw8cjeoZ4wddou-8OMoFZntQYwGgt4Qlp3ExcGYo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkEvents() {
    console.log('Searching for events...')
    
    const { data: events, error: findError } = await supabase
        .from('events')
        .select('id, title')
        .or('title.ilike.%FOUINE%,title.ilike.%DIDI B%')

    if (findError) {
        console.error('Error searching for events:', findError.message)
        return
    }

    if (!events || events.length === 0) {
        console.log('No matching events found in the database.')
        return
    }

    console.log(`Found ${events.length} events:`)
    events.forEach(e => console.log(`- ${e.title} (ID: ${e.id})`))
}

checkEvents()
