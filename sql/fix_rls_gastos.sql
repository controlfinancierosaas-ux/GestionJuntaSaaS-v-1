-- FIX PARA ERROR RLS EN GASTOS_FACTURAS
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Asegurar que RLS esté habilitado pero con políticas permisivas
ALTER TABLE public.gastos_facturas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política previa que pueda estar restringiendo
DROP POLICY IF EXISTS "Public access gastos_facturas" ON public.gastos_facturas;
DROP POLICY IF EXISTS "Permitir todo a todos" ON public.gastos_facturas;

-- 3. Crear una política que permita TODO (SELECT, INSERT, UPDATE, DELETE) a todos los roles
CREATE POLICY "Public access gastos_facturas" 
ON public.gastos_facturas 
FOR ALL 
TO anon, authenticated, service_role
USING (true) 
WITH CHECK (true);

-- 4. Otorgar permisos explícitos a los roles anon y authenticated (PostgREST los usa)
GRANT ALL ON TABLE public.gastos_facturas TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Repetir para tablas relacionadas por si acaso
ALTER TABLE public.caja_chica ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access caja_chica" ON public.caja_chica;
CREATE POLICY "Public access caja_chica" ON public.caja_chica FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.caja_chica TO anon, authenticated, service_role;

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access movimientos_inventario" ON public.movimientos_inventario;
CREATE POLICY "Public access movimientos_inventario" ON public.movimientos_inventario FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.movimientos_inventario TO anon, authenticated, service_role;
