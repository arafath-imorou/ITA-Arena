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

        let customMetadata = entity?.custom_metadata || payload?.custom_metadata;
        if (typeof customMetadata === 'string') {
            try {
                customMetadata = JSON.parse(customMetadata);
            } catch (e) {
                console.warn('Webhook: Unable to parse stringified custom_metadata');
            }
        }

        if (eventType === 'transaction.approved' && entity && (entity.status === 'approved' || entity.status === 'successful')) {
            const transactionId = entity.id;
            const voteId = customMetadata?.vote_id;

            if (voteId) {
                const { error } = await supabase.from('votes_cast')
                    .update({
                        transaction_id: transactionId ? transactionId.toString() : null,
                        status: 'valid'
                    })
                    .eq('id', voteId);

                if (error) {
                    console.error('Webhook: Error updating vote by vote_id', error);
                } else {
                    console.log(`Webhook: Vote ${voteId} validated via FedaPay webhook.`);
                }
            } else if (transactionId) {
                await supabase.from('votes_cast')
                    .update({ status: 'valid' })
                    .eq('transaction_id', transactionId.toString());
                console.log(`Webhook: Vote transaction ${transactionId} validated.`);
            }
        } else if (['transaction.canceled', 'transaction.refunded'].includes(eventType) || (entity && ['canceled', 'refunded'].includes(entity.status))) {
            const transactionId = entity?.id;
            const voteId = customMetadata?.vote_id;

            if (voteId) {
                await supabase.from('votes_cast')
                    .update({ status: 'cancelled' })
                    .eq('id', voteId);
                console.log(`Webhook: Vote ${voteId} marked as cancelled.`);
            } else if (transactionId) {
                await supabase.from('votes_cast')
                    .update({ status: 'cancelled' })
                    .eq('transaction_id', transactionId.toString());
                console.log(`Webhook: Transaction ${transactionId} marked as cancelled.`);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
