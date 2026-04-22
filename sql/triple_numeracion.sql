-- Añadir campos para los 3 tipos de numeración
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS numero_sistema text; -- yyyymmddhhmmss
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS codigo_manual text;   -- Para que el usuario lo llene si quiere

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_incidencias_numero_sistema ON public.incidencias(numero_sistema);
CREATE INDEX IF NOT EXISTS idx_incidencias_codigo_manual ON public.incidencias(codigo_manual);
