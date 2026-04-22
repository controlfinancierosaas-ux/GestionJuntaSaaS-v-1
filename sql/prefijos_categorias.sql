-- Añadir mapa de prefijos por categoría a la configuración del edificio
ALTER TABLE public.edificio_config ADD COLUMN IF NOT EXISTS prefijos_por_categoria jsonb DEFAULT '{
  "Ascensor": "ASC",
  "Bomba de Agua": "BOM",
  "Portón de Estacionamiento": "POR",
  "Sistema Eléctrico": "ELE",
  "Plomería": "PLO",
  "CCTV / Cámaras": "CAM",
  "Control de Accesos": "ACC",
  "Jardinería": "JAR",
  "Pintura": "PIN",
  "Áreas Comunes": "ARC",
  "Otro": "INC"
}';
