-- 1. SQL à exécuter dans le SQL Editor de Supabase pour activer le multi-ticket
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checkout_session_id UUID;
CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(checkout_session_id);

-- 2. Commande pour déployer la Edge Function (si vous avez le CLI)
-- supabase functions deploy generate-ticket-email --project-ref krtzszpeftpqogqzlmey

-- 3. Rappel des secrets à configurer dans Supabase (Settings -> API -> Edge Functions)
-- RESEND_API_KEY: [Votre clé Resend]
-- SUPABASE_URL: [URL de votre projet]
-- SUPABASE_SERVICE_ROLE_KEY: [Clé Service Role]
