-- ==============================================================================
-- BEN DAOUD RÉPARATION - CONFIGURATION SUPABASE (Base de Données & Stockage)
-- ==============================================================================
-- Copiez tout ce script et collez-le dans l'éditeur SQL de votre projet Supabase :
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Table des Ateliers (les ateliers de sous-traitance et réparation)
CREATE TABLE IF NOT EXISTS public.ateliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    telephone TEXT,
    specialite TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les ateliers par défaut demandés
INSERT INTO public.ateliers (nom, specialite) VALUES
    ('Brahim', 'Réparation générale'),
    ('Oro', 'Bijouterie / Or & Argent'),
    ('Bouchaib', 'Horlogerie / Mécanique'),
    ('Youssef', 'Électronique / Précision'),
    ('Miyara', 'Polissage / Finition'),
    ('Aissam', 'Soudure & Ajustement'),
    ('Hamza', 'Diagnostic & Restauration')
ON CONFLICT (nom) DO NOTHING;

-- 2. Table des Articles / Réparations
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_recu TEXT NOT NULL UNIQUE,
    client_nom TEXT NOT NULL,
    client_prenom TEXT NOT NULL,
    client_telephone TEXT,
    description_article TEXT NOT NULL,
    photo_url TEXT,
    recu_demande BOOLEAN DEFAULT FALSE,
    prix_estime NUMERIC(10, 2) DEFAULT 0,
    avance NUMERIC(10, 2) DEFAULT 0,
    reste NUMERIC(10, 2) DEFAULT 0,
    date_reception TIMESTAMPTZ DEFAULT NOW(),
    date_envoi_atelier TIMESTAMPTZ,
    date_pret TIMESTAMPTZ,
    date_livraison TIMESTAMPTZ,
    atelier_id UUID REFERENCES public.ateliers(id) ON DELETE SET NULL,
    atelier_nom TEXT,
    statut TEXT DEFAULT 'recu' CHECK (statut IN ('recu', 'en_atelier', 'pret', 'livre')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les recherches par client, téléphone, statut et atelier
CREATE INDEX IF NOT EXISTS idx_articles_client ON public.articles(client_nom, client_prenom);
CREATE INDEX IF NOT EXISTS idx_articles_telephone ON public.articles(client_telephone);
CREATE INDEX IF NOT EXISTS idx_articles_statut ON public.articles(statut);
CREATE INDEX IF NOT EXISTS idx_articles_atelier ON public.articles(atelier_nom);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);

-- Trigger pour mettre à jour la colonne updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_articles_updated_at ON public.articles;
CREATE TRIGGER trigger_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Activation de Row Level Security (RLS) et Politiques d'Accès
ALTER TABLE public.ateliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture, l'insertion, la mise à jour et la suppression avec la clé anon (pour l'application de travail)
CREATE POLICY "Acces complet aux ateliers (anon)" ON public.ateliers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acces complet aux articles (anon)" ON public.articles
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Création du Bucket de Stockage pour les Photos des Articles
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-photos', 'article-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de sécurité pour le stockage des photos
CREATE POLICY "Photos publiques en lecture" ON storage.objects
    FOR SELECT USING (bucket_id = 'article-photos');

CREATE POLICY "Upload photos autorise" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'article-photos');

CREATE POLICY "Update photos autorise" ON storage.objects
    FOR UPDATE USING (bucket_id = 'article-photos');

CREATE POLICY "Suppression photos autorisee" ON storage.objects
    FOR DELETE USING (bucket_id = 'article-photos');
