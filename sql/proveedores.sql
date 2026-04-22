-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  edificio_id uuid REFERENCES public.edificios(id) ON DELETE CASCADE,
  
  nombre text NOT NULL,
  rif_cedula text,
  persona_contacto text,
  categoria text, -- ascensores, bombas, jardineria, plomeria, etc.
  
  telefono text,
  email text,
  direccion text,
  
  banco text,
  numero_cuenta text,
  tipo_cuenta text,
  
  estatus text DEFAULT 'Activo', -- Activo, Inactivo
  observaciones text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas (Acceso total por ahora, siguiendo el patrón de config.sql)
DROP POLICY IF EXISTS "Public access proveedores" ON public.proveedores;
CREATE POLICY "Public access proveedores" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON public.proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_rif ON public.proveedores(rif_cedula);
CREATE INDEX IF NOT EXISTS idx_proveedores_categoria ON public.proveedores(categoria);
CREATE INDEX IF NOT EXISTS idx_proveedores_edificio ON public.proveedores(edificio_id);
