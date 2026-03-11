import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://krtzszpeftpqogqzlmey.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydHpzenBlZnRwcW9ncXpsbWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTA1NzcsImV4cCI6MjA4ODY2NjU3N30.382sw8cjeoZ4wddou-8OMoFZntQYwGgt4Qlp3ExcGYo'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching events:', error)
    } else {
        console.log('Events Schema (columns):', Object.keys(data[0] || {}))
    }
}

checkSchema()
