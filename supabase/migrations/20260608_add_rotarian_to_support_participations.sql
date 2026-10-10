-- Migration: Ajout des informations Rotarien / Rotaractien et Club
ALTER TABLE public.support_participations 
ADD COLUMN IF NOT EXISTS is_rotarian BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS club_name TEXT;
