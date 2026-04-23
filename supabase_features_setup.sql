-- ============================================================
-- FEATURES SETUP — sistema de feature flags por negocio
-- Ejecutar en Supabase Dashboard > SQL Editor
-- (aplica para ambos proyectos — mismo Supabase)
-- ============================================================

-- PASO 1: Agregar columna features a settings
ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- PASO 2: Setear features base para cada negocio
-- Reemplazá los UUIDs con los valores de VITE_BUSINESS_ID
-- ============================================================

-- burgers-boss (sin reservas)
UPDATE settings SET features = '{
    "products":    true,
    "categories":  true,
    "hours":       true,
    "qr":          true,
    "promotions":  true,
    "reservations": false
}'::jsonb
WHERE business_id = 'BURGERS_BOSS_BUSINESS_ID';

-- Bar_app (con reservas)
UPDATE settings SET features = '{
    "products":    true,
    "categories":  true,
    "hours":       true,
    "qr":          true,
    "promotions":  true,
    "reservations": true
}'::jsonb
WHERE business_id = 'BAR_APP_BUSINESS_ID';

-- ============================================================
-- Para agregar una feature premium a un negocio en el futuro:
-- UPDATE settings
--   SET features = features || '{"analytics": true}'::jsonb
-- WHERE business_id = 'UUID_DEL_NEGOCIO';
-- ============================================================
