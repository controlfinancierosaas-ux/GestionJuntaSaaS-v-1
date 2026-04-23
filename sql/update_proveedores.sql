-- Actualización de la tabla proveedores
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS tipo_relacion text DEFAULT 'Eventual';
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS servicio_contratado text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS fecha_inicio_contrato date;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS fecha_vencimiento_contrato date;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS monto_canon_usd numeric;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS monto_canon_bs numeric;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS dia_pago integer;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS documento_contrato_url text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS copia_rif_url text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS clausula_ajuste text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS aviso_finalizacion text;

-- Nuevos campos para Pago Móvil y Contacto Adicional
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS pm_banco text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS pm_documento_identidad text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS pm_telefono_movil text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS telefono_fijo text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS email2 text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS pagina_web text;
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS documentos_adicionales jsonb DEFAULT '[]';

-- Tabla de historial de evaluaciones
CREATE TABLE IF NOT EXISTS public.evaluaciones_proveedores (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE CASCADE,
    puntaje INTEGER CHECK (puntaje >= 1 AND puntaje <= 5),
    criterio_resumido text, -- Ej: Puntualidad, Calidad de materiales
    comentarios text,
    evaluado_por text, -- Nombre del vocal o administrador
    fecha_evaluacion DATE DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.evaluaciones_proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Public access evaluaciones_proveedores" ON public.evaluaciones_proveedores;
CREATE POLICY "Public access evaluaciones_proveedores" ON public.evaluaciones_proveedores FOR ALL USING (true) WITH CHECK (true);

-- Índice para rapidez al buscar historial de un proveedor específico
CREATE INDEX IF NOT EXISTS idx_evaluaciones_proveedor_id ON public.evaluaciones_proveedores(proveedor_id);
