-- ============================================================
-- CONFIGURACIÓN DE WHATSAPP PARA PROVEEDORES
-- ============================================================

-- 1. Habilitar campo de notificación en la tabla de proveedores
ALTER TABLE public.proveedores ADD COLUMN IF NOT EXISTS notificar_whatsapp BOOLEAN DEFAULT FALSE;

-- 2. Asegurar campos de credenciales en edificio_config (si no existen)
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS whatsapp_service TEXT DEFAULT 'GREENAPI';
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS greenapi_id_instance TEXT;
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS greenapi_api_token TEXT;
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS whapi_token TEXT;

-- 3. Tabla de cola/log de WhatsApp (para auditoría de envíos)
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.edificios(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_building ON public.whatsapp_queue(building_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON public.whatsapp_queue(status);
