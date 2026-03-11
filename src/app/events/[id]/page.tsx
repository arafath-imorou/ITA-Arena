import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
    return [
        { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
        { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' },
        { id: '9' }, { id: '10' }, { id: '11' }, { id: '12' },
        { id: 'seed-1' }, { id: 'seed-2' }, { id: 'seed-3' }
    ];
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EventDetailClient id={id} />;
}
