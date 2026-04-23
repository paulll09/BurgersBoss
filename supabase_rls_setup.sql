-- ============================================================
-- RLS SETUP — burgers-boss / Bar_app (multi-tenant)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================
-- PASO 1: Agregar business_id al user metadata del admin
-- (ejecutar una sola vez por negocio)
-- ============================================================

-- Reemplazá 'TU_BUSINESS_ID_AQUI' con el valor de VITE_BUSINESS_ID
-- y 'admin@email.com' con el email del admin de ese negocio.

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{business_id}',
    '"TU_BUSINESS_ID_AQUI"'
)
WHERE email = 'admin@email.com';

-- Verificar que quedó bien:
-- SELECT id, email, raw_user_meta_data->>'business_id' FROM auth.users;

-- ============================================================
-- PASO 2: Habilitar RLS en todas las tablas
-- ============================================================

ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 3: Eliminar políticas anteriores (si ya las aplicaste)
-- Ejecutar solo si ya corriste la versión anterior del SQL
-- ============================================================

DROP POLICY IF EXISTS "products_read_public"   ON products;
DROP POLICY IF EXISTS "products_write_admin"   ON products;
DROP POLICY IF EXISTS "variants_read_public"   ON product_variants;
DROP POLICY IF EXISTS "variants_write_admin"   ON product_variants;
DROP POLICY IF EXISTS "categories_read_public" ON categories;
DROP POLICY IF EXISTS "categories_write_admin" ON categories;
DROP POLICY IF EXISTS "promotions_read_public" ON promotions;
DROP POLICY IF EXISTS "promotions_write_admin" ON promotions;
DROP POLICY IF EXISTS "settings_read_public"   ON settings;
DROP POLICY IF EXISTS "settings_write_admin"   ON settings;

-- ============================================================
-- PASO 4: Políticas para PRODUCTS
-- ============================================================

CREATE POLICY "products_read_public" ON products
    FOR SELECT USING (true);

-- auth.jwt() lee el token del usuario sin acceder a auth.users
-- Si business_id no está en el token (metadata no seteado), permite acceso
-- Si está seteado y no coincide, rechaza
CREATE POLICY "products_write_admin" ON products
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    );

-- ============================================================
-- PASO 5: Políticas para PRODUCT_VARIANTS
-- ============================================================

CREATE POLICY "variants_read_public" ON product_variants
    FOR SELECT USING (true);

CREATE POLICY "variants_write_admin" ON product_variants
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR (
                SELECT p.business_id::text FROM products p
                WHERE p.id = product_variants.product_id
            ) = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR (
                SELECT p.business_id::text FROM products p
                WHERE p.id = product_variants.product_id
            ) = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    );

-- ============================================================
-- PASO 6: Políticas para CATEGORIES
-- ============================================================

CREATE POLICY "categories_read_public" ON categories
    FOR SELECT USING (true);

CREATE POLICY "categories_write_admin" ON categories
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    );

-- ============================================================
-- PASO 7: Políticas para PROMOTIONS
-- ============================================================

CREATE POLICY "promotions_read_public" ON promotions
    FOR SELECT USING (true);

CREATE POLICY "promotions_write_admin" ON promotions
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    );

-- ============================================================
-- PASO 8: Políticas para SETTINGS
-- ============================================================

CREATE POLICY "settings_read_public" ON settings
    FOR SELECT USING (true);

CREATE POLICY "settings_write_admin" ON settings
    FOR ALL
    USING (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
            (auth.jwt() -> 'user_metadata' ->> 'business_id') IS NULL
            OR business_id::text = (auth.jwt() -> 'user_metadata' ->> 'business_id')
        )
    );
