-- Vincular incidencias con proveedores de forma estructural
ALTER TABLE public.incidencias ADD COLUMN IF NOT EXISTS proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_incidencias_proveedor_id ON public.incidencias(proveedor_id);
