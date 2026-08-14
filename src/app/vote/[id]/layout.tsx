import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const campaignId = resolvedParams?.id;

  if (!campaignId) {
    return {
      title: 'Vote introuvable | ITA ARENA',
      description: 'Cette campagne de vote n\'existe pas.'
    };
  }

  const { data: campaign } = await supabaseAdmin
    .from('votes_campaigns')
    .select('title, description, cover_image, category')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return {
      title: 'Vote non trouvé | ITA ARENA',
      description: 'Cette campagne de vote n\'existe pas.'
    };
  }

  return {
    title: `${campaign.title} | ITA ARENA Vote`,
    description: campaign.description || `Votez pour votre candidat préféré dans "${campaign.title}" sur ITA ARENA.`,
    openGraph: {
      title: campaign.title,
      description: campaign.description || `Votez en ligne pour ${campaign.title} sur ITA ARENA.`,
      images: campaign.cover_image
        ? [
            {
              url: campaign.cover_image,
              width: 1200,
              height: 630,
              alt: campaign.title,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: campaign.description || `Votez pour ${campaign.title}.`,
      images: campaign.cover_image ? [campaign.cover_image] : [],
    },
  };
}

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
