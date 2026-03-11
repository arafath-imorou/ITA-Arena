-- Sequence table to manage ticket numbers per event
CREATE TABLE IF NOT EXISTS public.ticket_sequences (
    event_id UUID PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
    last_number INTEGER DEFAULT 0
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    ticket_number INTEGER,
    qr_code_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'valid',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to handle sequential numbering
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    INSERT INTO public.ticket_sequences (event_id, last_number)
    VALUES (NEW.event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET last_number = ticket_sequences.last_number + 1
    RETURNING last_number INTO next_num;
    
    NEW.ticket_number := next_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON public.tickets;
CREATE TRIGGER trigger_generate_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();
