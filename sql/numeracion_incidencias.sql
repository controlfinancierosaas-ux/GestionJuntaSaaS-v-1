-- Añadir campos para numeración amigable en incidencias
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS numero_secuencia integer;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS codigo_personalizado text;

-- Añadir configuración de prefijos al edificio
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS prefijo_incidencias text DEFAULT 'INC';
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS siguiente_numero_incidencia integer DEFAULT 1;

-- Índices para búsqueda por código
CREATE INDEX IF NOT EXISTS idx_incidencias_codigo_personalizado ON public.incidencias(codigo_personalizado);
