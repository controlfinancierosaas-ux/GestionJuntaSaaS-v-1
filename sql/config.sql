-- Tabla de configuración por edificio
CREATE TABLE IF NOT EXISTS public.edificio_config (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  edificio_id uuid REFERENCES public.edificios(id) ON DELETE CASCADE,
  
  -- Configuración de Email
  smtp_user text,
  smtp_pass text,
  email_junta text,
  email_notificaciones boolean DEFAULT true,
  
  -- Configuración de WhatsApp
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_service text DEFAULT 'GREENAPI',
  greenapi_id_instance text,
  greenapi_api_token text,
  whapi_token text,
  callmebot_apikey text,
  
  -- Técnicos por tipo de incidencia (JSON)
  tecnicos jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.edificio_config ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Public access edificio_config" ON public.edificio_config;
CREATE POLICY "Public access edificio_config" ON public.edificio_config FOR ALL USING (true) WITH CHECK (true);