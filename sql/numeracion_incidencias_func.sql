-- Función para obtener y aumentar el siguiente número de incidencia de un edificio de forma atómica
CREATE OR REPLACE FUNCTION public.get_and_increment_incidencia_number(p_edificio_id uuid)
RETURNS TABLE (prefijo text, siguiente_numero integer) AS $$
DECLARE
    v_prefijo text;
    v_numero integer;
BEGIN
    -- Bloquear la fila del edificio para evitar condiciones de carrera
    UPDATE public.edificio_config
    SET siguiente_numero_incidencia = siguiente_numero_incidencia + 1
    WHERE edificio_id = p_edificio_id
    RETURNING prefijo_incidencias, siguiente_numero_incidencia - 1 INTO v_prefijo, v_numero;
    
    -- Si no existe configuración, crear una por defecto
    IF NOT FOUND THEN
        INSERT INTO public.edificio_config (edificio_id, prefijo_incidencias, siguiente_numero_incidencia)
        VALUES (p_edificio_id, 'INC', 2)
        RETURNING prefijo_incidencias, 1 INTO v_prefijo, v_numero;
    END IF;

    RETURN QUERY SELECT v_prefijo, v_numero;
END;
$$ LANGUAGE plpgsql;
