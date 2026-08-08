import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        // On FedaPay Webhook, payload.name is the event type
        const eventType = payload.name;
        const entity = payload.entity;

        if (eventType === 'transaction.approved' && entity && entity.status === 'approved') {
            const transactionId = entity.id;
            const customMetadata = entity.custom_metadata;

            if (customMetadata && customMetadata.vote_id) {
                const voteId = customMetadata.vote_id;
                
                // Update the vote
                const { error } = await supabase.from('votes_cast')
                    .update({
                        transaction_id: transactionId,
                        status: 'valid'
                    })
                    .eq('id', voteId)
                    .eq('status', 'pending'); // Only update if pending

                if (error) {
                    console.error('Webhook: Error updating vote', error);
                } else {
                    console.log(`Webhook: Vote ${voteId} validated via FedaPay webhook.`);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
