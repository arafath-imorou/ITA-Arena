-- ==========================================
-- ITA FORMS - DATABASE MIGRATION SCRIPT
-- ==========================================

-- 1. Create table for Forms
CREATE TABLE forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, draft, closed
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create table for Form Fields
CREATE TABLE form_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- text, email, phone, select, radio, checkbox, file, photo
    label TEXT NOT NULL,
    required BOOLEAN DEFAULT false,
    options JSONB, -- For select, radio, checkbox
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create table for Form Submissions
CREATE TABLE form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null if guest
    status TEXT DEFAULT 'valid',
    qr_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create table for Form Responses
CREATE TABLE form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
    field_id UUID REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT, -- For simple text, files URLs
    value_json JSONB, -- For multiple choices, complex data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. RLS Policies (Row Level Security)

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Forms Policies
-- Anyone can read active forms
CREATE POLICY "Public can view active forms" ON forms FOR SELECT USING (status = 'active');
-- Organizers can manage their own forms
CREATE POLICY "Organizers manage their forms" ON forms FOR ALL USING (auth.uid() = organizer_id);

-- Form Fields Policies
-- Anyone can view fields
CREATE POLICY "Public can view form fields" ON form_fields FOR SELECT USING (true);
-- Organizers can manage fields of their forms
CREATE POLICY "Organizers manage their form fields" ON form_fields FOR ALL USING (
    form_id IN (SELECT id FROM forms WHERE organizer_id = auth.uid())
);

-- Form Submissions Policies
-- Anyone can insert submissions (since guests can participate)
CREATE POLICY "Anyone can insert submissions" ON form_submissions FOR INSERT WITH CHECK (true);
-- Participants can view their own submission if logged in
CREATE POLICY "Users can view own submission" ON form_submissions FOR SELECT USING (user_id = auth.uid());
-- Organizers can view submissions for their forms
CREATE POLICY "Organizers can view submissions" ON form_submissions FOR SELECT USING (
    form_id IN (SELECT id FROM forms WHERE organizer_id = auth.uid())
);

-- Form Responses Policies
-- Anyone can insert responses
CREATE POLICY "Anyone can insert responses" ON form_responses FOR INSERT WITH CHECK (true);
-- Participants can view their own responses
CREATE POLICY "Users can view own responses" ON form_responses FOR SELECT USING (
    submission_id IN (SELECT id FROM form_submissions WHERE user_id = auth.uid())
);
-- Organizers can view responses for their forms
CREATE POLICY "Organizers can view responses" ON form_responses FOR SELECT USING (
    submission_id IN (SELECT id FROM form_submissions WHERE form_id IN (SELECT id FROM forms WHERE organizer_id = auth.uid()))
);


-- 6. Storage Bucket for Form Uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('form_uploads', 'form_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for form_uploads
-- Anyone can upload files to form_uploads
CREATE POLICY "Anyone can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'form_uploads');
-- Anyone can view files from form_uploads
CREATE POLICY "Public can view uploaded files" ON storage.objects FOR SELECT USING (bucket_id = 'form_uploads');
