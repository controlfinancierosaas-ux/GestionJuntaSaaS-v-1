-- Función mejorada para obtener prefijo según categoría y número secuencial
CREATE OR REPLACE FUNCTION public.get_friendly_incident_number(p_edificio_id uuid, p_categoria text)
RETURNS TABLE (v_prefijo text, v_numero integer) AS $$
DECLARE
    v_prefijos_json jsonb;
    v_prefijo_final text;
    v_seq_numero integer;
BEGIN
    -- 1. Obtener la configuración y bloquear la fila
    SELECT prefijos_por_categoria, siguiente_numero_incidencia 
    INTO v_prefijos_json, v_seq_numero
    FROM public.edificio_config
    WHERE edificio_id = p_edificio_id
    FOR UPDATE;

    -- 2. Determinar el prefijo (buscar en el JSON o usar 'INC' por defecto)
    IF v_prefijos_json IS NOT NULL AND v_prefijos_json ? p_categoria THEN
        v_prefijo_final := v_prefijos_json->>p_categoria;
    ELSE
        v_prefijo_final := 'INC';
    END IF;

    -- 3. Aumentar el contador global de incidencias del edificio
    UPDATE public.edificio_config
    SET siguiente_numero_incidencia = siguiente_numero_incidencia + 1
    WHERE edificio_id = p_edificio_id;

    -- 4. Retornar los datos
    RETURN QUERY SELECT v_prefijo_final, v_seq_numero;
END;
$$ LANGUAGE plpgsql;
