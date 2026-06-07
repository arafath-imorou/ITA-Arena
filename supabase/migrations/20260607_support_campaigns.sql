-- ==============================================================================
-- MODULE CADRES DE SOUTIEN - MIGRATION SQL
-- Veuillez exécuter ce script dans le SQL Editor de votre projet Supabase.
-- ==============================================================================

-- 1. Création de la table `support_campaigns`
CREATE TABLE IF NOT EXISTS public.support_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    frame_image TEXT NOT NULL,
    cover_image TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    allow_download BOOLEAN DEFAULT true,
    allow_share BOOLEAN DEFAULT true,
    show_counter BOOLEAN DEFAULT true,
    show_logo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Création de la table `support_participations`
CREATE TABLE IF NOT EXISTS public.support_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.support_campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Activation de la RLS (Row Level Security)
ALTER TABLE public.support_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_participations ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour `support_campaigns`
-- Tout le monde peut voir les campagnes publiées
CREATE POLICY "Public profiles are viewable by everyone."
ON public.support_campaigns FOR SELECT
USING (status = 'active');

-- Seuls les utilisateurs authentifiés (organisateurs) peuvent insérer/modifier leurs propres campagnes
CREATE POLICY "Users can insert their own campaigns."
ON public.support_campaigns FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own campaigns."
ON public.support_campaigns FOR UPDATE
USING (auth.uid() = created_by);

-- 5. Politiques RLS pour `support_participations`
-- Tout le monde peut insérer une participation (même les utilisateurs anonymes)
CREATE POLICY "Anyone can insert a participation."
ON public.support_participations FOR INSERT
WITH CHECK (true);

-- Seul le créateur de la campagne peut voir les participations de sa campagne (pour les statistiques)
CREATE POLICY "Campaign owners can view participations."
ON public.support_participations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.support_campaigns
        WHERE id = public.support_participations.campaign_id
        AND created_by = auth.uid()
    )
);

-- 6. Création du Storage Bucket pour les images (frames et covers)
-- Si cette partie renvoie une erreur (dépend des permissions), vous pouvez le créer manuellement
-- depuis l'interface Supabase Storage : Bucket "campaign_frames" (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign_frames', 'campaign_frames', true)
ON CONFLICT (id) DO NOTHING;

-- Autoriser le téléchargement public des fichiers dans ce bucket
CREATE POLICY "Images des campagnes sont publiques"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign_frames');

-- Autoriser l'upload aux utilisateurs authentifiés dans ce bucket
CREATE POLICY "Organisateurs peuvent uploader des images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'campaign_frames' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Organisateurs peuvent modifier leurs images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'campaign_frames' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Organisateurs peuvent supprimer leurs images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'campaign_frames' 
    AND auth.role() = 'authenticated'
);
