-- Añadir campo para preferencias de visualización de columnas
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS columnas_visibles_incidencias jsonb DEFAULT '["categoria", "sistema", "manual"]';
