-- Tabla para guardar proyectos completos
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  productora_id TEXT,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para guardar perfiles/productoras
CREATE TABLE IF NOT EXISTS productoras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_projects_productora ON projects(productora_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);