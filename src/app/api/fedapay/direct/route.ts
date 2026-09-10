import { NextResponse } from 'next/server';
import { FedaPay, Transaction } from 'fedapay';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { amount, description, customer, method, custom_metadata } = payload;
        
        const isSandbox = (process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY || '').includes('sandbox');
        FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
        FedaPay.setEnvironment(isSandbox ? 'sandbox' : 'live');

        const transaction = await Transaction.create({
            description: description || 'Paiement',
            amount: amount,
            currency: { iso: 'XOF' },
            customer: customer,
            custom_metadata: custom_metadata || {}
        });

        const methodLower = (method || 'mtn').toLowerCase();
        
        const res = await transaction.sendNow(methodLower);
        
        return NextResponse.json({ success: true, transactionId: transaction.id, status: res ? res.status : transaction.status });

    } catch (error: any) {
        console.error('Direct Payment Error:', error.message);
        console.error(error.hasErrors ? error.getErrors() : error);
        
        let errorMessage = "Erreur lors du déclenchement du paiement mobile.";
        if (error.hasErrors && error.getErrors()) {
            errorMessage = JSON.stringify(error.getErrors());
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }
}
