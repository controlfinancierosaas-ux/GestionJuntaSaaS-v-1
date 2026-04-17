ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS carpeta_drive text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]';
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS estado_whatsapp text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS id_mensaje_whatsapp text;