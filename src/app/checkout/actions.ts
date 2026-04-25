"use server";

export async function createFedaPayTransaction(amount: number, email: string, firstname: string, lastname: string, phone: string) {
    const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
    
    try {
        const response = await fetch("https://api.fedapay.com/v1/transactions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${FEDAPAY_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description: "Achat de ticket sur ITA Arena",
                amount: amount,
                currency: { iso: "XOF" },
                customer: {
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    phone_number: {
                        number: phone,
                        country: "BJ" // Default or dynamic
                    }
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Erreur FedaPay");
        }

        return { success: true, transaction: data.v1_transaction };
    } catch (error: any) {
        console.error("FedaPay Error:", error);
        return { success: false, error: error.message };
    }
}
