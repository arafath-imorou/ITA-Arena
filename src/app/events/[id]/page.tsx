import EventDetailClient from "./EventDetailClient";

export function generateStaticParams() {
    return [];
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <EventDetailClient id={id} />;
}
