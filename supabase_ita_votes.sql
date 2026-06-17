-- ==========================================
-- ITA VOTES & SONDAGES - DATABASE MIGRATION SCRIPT
-- ==========================================

-- 1. Create table for Vote Campaigns
CREATE TABLE votes_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- Miss, Concours, etc.
    cover_image TEXT,
    status TEXT DEFAULT 'active', -- active, draft, closed
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_paid BOOLEAN DEFAULT false,
    price_per_vote INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'FCFA',
    vote_limit_per_user INTEGER DEFAULT 0, -- 0 = unlimited
    show_results BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create table for Vote Candidates
CREATE TABLE vote_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES votes_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    number TEXT,
    description TEXT,
    photo_url TEXT,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create table for Cast Votes
CREATE TABLE votes_cast (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES votes_campaigns(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES vote_candidates(id) ON DELETE CASCADE,
    voter_email TEXT,
    voter_phone TEXT,
    vote_count INTEGER DEFAULT 1,
    amount_paid INTEGER DEFAULT 0,
    transaction_id TEXT UNIQUE, -- for FedaPay
    status TEXT DEFAULT 'valid', -- valid, pending_payment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Extend 'forms' table to support Polls
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_type TEXT DEFAULT 'form'; -- 'form' or 'poll'
ALTER TABLE forms ADD COLUMN IF NOT EXISTS show_public_results BOOLEAN DEFAULT false;

-- 5. Enable RLS
ALTER TABLE votes_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes_cast ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- votes_campaigns
CREATE POLICY "Public can view active campaigns" ON votes_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Organizers manage their campaigns" ON votes_campaigns FOR ALL USING (auth.uid() = organizer_id);

-- vote_candidates
CREATE POLICY "Public can view candidates" ON vote_candidates FOR SELECT USING (true);
CREATE POLICY "Organizers manage their candidates" ON vote_candidates FOR ALL USING (
    campaign_id IN (SELECT id FROM votes_campaigns WHERE organizer_id = auth.uid())
);

-- votes_cast
CREATE POLICY "Anyone can insert votes" ON votes_cast FOR INSERT WITH CHECK (true);
CREATE POLICY "Organizers can view votes for their campaigns" ON votes_cast FOR SELECT USING (
    campaign_id IN (SELECT id FROM votes_campaigns WHERE organizer_id = auth.uid())
);

-- 7. Storage Bucket for Vote Uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('vote_uploads', 'vote_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for vote_uploads
CREATE POLICY "Anyone can upload files to vote_uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vote_uploads');
CREATE POLICY "Public can view uploaded files from vote_uploads" ON storage.objects FOR SELECT USING (bucket_id = 'vote_uploads');
CREATE POLICY "Organizers can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'vote_uploads');
CREATE POLICY "Organizers can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'vote_uploads');
