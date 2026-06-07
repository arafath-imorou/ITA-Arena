import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// We need an isolated client to not mess up SSR if they don't have it setup correctly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: { slug: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;

  const { data: campaign } = await supabaseAdmin
    .from('support_campaigns')
    .select('title, description, frame_image')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    return {
      title: 'Campagne non trouvée | ITA ARENA',
      description: 'Cette campagne de soutien n\'existe pas.'
    };
  }

  return {
    title: `${campaign.title} | ITA ARENA Soutien`,
    description: campaign.description || `Rejoignez la campagne de soutien "${campaign.title}" sur ITA ARENA.`,
    openGraph: {
      title: campaign.title,
      description: campaign.description || `Participez à la campagne ${campaign.title}.`,
      images: [
        {
          url: campaign.frame_image, // Use the frame as OG image
          width: 1080,
          height: 1080,
          alt: campaign.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: campaign.description || `Participez à la campagne ${campaign.title}.`,
      images: [campaign.frame_image],
    },
  };
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
