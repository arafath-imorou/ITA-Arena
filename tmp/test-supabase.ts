import { supabase } from '../src/lib/supabase'

async function testConnection() {
    console.log('Testing Supabase connection...')
    try {
        const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true })

        if (error) {
            console.error('Error connecting to Supabase:', error.message)
            process.exit(1)
        }

        console.log('Successfully connected to Supabase!')
        console.log('Event count HEAD check successful.')
    } catch (err) {
        console.error('Failed to execute test query:', err)
        process.exit(1)
    }
}

testConnection()
