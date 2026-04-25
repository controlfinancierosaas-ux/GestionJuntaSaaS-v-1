-- Script para mejorar el control del catálogo de inventario
-- Añade columna de estado para permitir archivar, suspender o desactivar artículos

ALTER TABLE articulos_inventario 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Activo';

-- Índices para mejorar el rendimiento de las consultas por estado
CREATE INDEX IF NOT EXISTS idx_articulos_inventario_estado ON articulos_inventario(estado);
