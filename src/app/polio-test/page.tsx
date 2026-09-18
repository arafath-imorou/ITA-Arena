"use client";
import React from 'react';
import OuidahPolioFlow from '@/components/Support/OuidahPolioFlow';
export default function PolioTestPage() {
    const fakeCampaign = {
        id: 'e4eff096-52dc-45e5-8fca-6ba274db8d13',
        title: 'Ouidah Sans Polio',
        slug: 'ouidah-sans-polio',
        price_per_unit: 500
    };
    return <OuidahPolioFlow campaign={fakeCampaign} />;
}
