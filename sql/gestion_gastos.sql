-- Tabla central de Gastos y Control de Facturas
CREATE TABLE IF NOT EXISTS public.gastos_facturas (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    edificio_id uuid REFERENCES public.edificios(id) ON DELETE CASCADE,
    proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE SET NULL,
    incidencia_id uuid REFERENCES public.incidencias(id) ON DELETE SET NULL,
    
    -- Datos de la Factura/Nota
    fecha_registro timestamp with time zone DEFAULT now(),
    fecha_factura date,
    numero_comprobante text, -- Factura o Nota de Entrega
    concepto_descripcion text,
    
    -- Montos y Tasa
    monto_usd numeric DEFAULT 0,
    monto_bs numeric DEFAULT 0,
    tasa_bcv_factura numeric DEFAULT 0,
    
    -- Clasificación
    categoria_gasto text, -- Mantenimiento Recurrente, Reparación, Insumos, etc.
    tipo_mantenimiento text DEFAULT 'Correctivo', -- Preventivo, Correctivo, Otro
    metodo_pago_sugerido text, -- Administradora, Caja Chica, etc.
    
    -- Control de Pago
    estatus_pago text DEFAULT 'Pendiente', -- Pendiente, Enviado a Administradora, Pagado
    fecha_pago date,
    monto_pagado_bs numeric DEFAULT 0,
    responsable_autoriza text,
    
    -- Datos de Mantenimiento Preventivo (solo si aplica)
    hallazgos_anomalias text,
    fecha_proximo_mantenimiento date,
    
    -- Otros
    observaciones text,
    documentos_urls jsonb DEFAULT '[]', -- Facturas escaneadas, fotos, etc.
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para reportes rápidos
CREATE INDEX IF NOT EXISTS idx_gastos_edificio ON public.gastos_facturas(edificio_id);
CREATE INDEX IF NOT EXISTS idx_gastos_proveedor ON public.gastos_facturas(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_gastos_estatus ON public.gastos_facturas(estatus_pago);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON public.gastos_facturas(fecha_factura);

-- Habilitar RLS
ALTER TABLE public.gastos_facturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access gastos_facturas" ON public.gastos_facturas;
CREATE POLICY "Public access gastos_facturas" ON public.gastos_facturas FOR ALL USING (true) WITH CHECK (true);
