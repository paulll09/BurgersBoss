-- ============================================================
-- SUBSCRIPTION SETUP — Recordatorio de suscripción mensual
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- PASO 1: Agregar la columna 'subscription' a la tabla 'settings' (si aún no existe)
ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS subscription JSONB NOT NULL DEFAULT '{}'::jsonb;

-- PASO 2: Configurar los datos de suscripción del negocio
-- (Reemplazá 'REEMPLAZAR_CON_TU_BUSINESS_ID' con el valor de VITE_BUSINESS_ID de tu .env)
UPDATE settings SET subscription = '{
    "due_day": 5,
    "last_paid_period": "",
    "payment_info": {
        "cvu": "0000003100045782936295",
        "holder": "Carlos Paul Aquino"
    }
}'::jsonb
WHERE business_id = '4be060e0-fb71-4fd2-a3b0-51c7d669cc5e';


-- ============================================================
-- 📜 CÓDIGO SQL PARA MARCAR EL MES COMO ABONADO (Oculta la alerta)
-- Copiar y ejecutar en Supabase SQL Editor cada vez que el cliente te transfiera.
-- ============================================================

-- OPCIÓN A: Marcar automáticamente el mes actual como abonado (Recomendado)
UPDATE settings 
SET subscription = jsonb_set(
    COALESCE(subscription, '{}'::jsonb), 
    '{last_paid_period}', 
    to_jsonb(to_char(CURRENT_DATE, 'YYYY-MM'))
)
WHERE business_id = '4be060e0-fb71-4fd2-a3b0-51c7d669cc5e';

-- OPCIÓN B: Marcar un mes y año específico (ej. Agosto 2026)
-- UPDATE settings 
-- SET subscription = jsonb_set(
--     COALESCE(subscription, '{}'::jsonb), 
--     '{last_paid_period}', 
--     '"2026-08"'
-- )
-- WHERE business_id = '4be060e0-fb71-4fd2-a3b0-51c7d669cc5e';
