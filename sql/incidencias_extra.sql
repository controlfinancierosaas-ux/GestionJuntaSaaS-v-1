-- Campos adicionales para gestión de incidencias
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS responsable_gestion text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS estatus text DEFAULT 'Activa';
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS observaciones text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS fecha_asignacion timestamp with time zone;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS proveedor_asignado text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS fecha_resolucion timestamp with time zone;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS observaciones_resolucion text;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS monto_bs numeric DEFAULT 0;
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS documentos_junta jsonb DEFAULT '[]';
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS enviar_email_resuelto boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_incidencias_estatus ON public.incidencias(estatus);
CREATE INDEX IF NOT EXISTS idx_incidencias_edificio ON public.incidencias(edificio_id);
