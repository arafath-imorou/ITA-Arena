import EventDetailClient from "./EventDetailClient";

export const revalidate = 60;


export function generateStaticParams() {
    return [];
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <EventDetailClient slug={slug} />;
}
