import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { dummyProducts, dummyCategories } from '../data/dummyMenu';

import { BUSINESS_ID } from '../lib/config';

const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return url && url !== 'https://tu-proyecto.supabase.co';
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];

/**
 * Fetches products (with optional variants) and categories from Supabase.
 * If the product_variants table doesn't exist yet, fetches products without variants.
 * Falls back to dummyMenu if Supabase is not configured.
 * Retries automatically on failure (up to 3 times).
 */
const _cache = { products: [], categories: [], populated: false };

export function useProducts(adminMode = false) {
    const [products, setProducts] = useState(_cache.products);
    const [categories, setCategories] = useState(_cache.categories);
    const [loading, setLoading] = useState(!_cache.populated);
    const [error, setError] = useState(null);
    const retryCount = useRef(0);
    const retryTimer = useRef(null);

    const fetchData = async (isRetry = false) => {
        if (!isRetry) {
            setLoading(true);
            retryCount.current = 0;
        }
        setError(null);

        if (!isSupabaseConfigured()) {
            const prods = adminMode ? dummyProducts : dummyProducts.filter(p => p.visible !== false);
            if (!adminMode) { _cache.products = prods; _cache.categories = dummyCategories; _cache.populated = true; }
            setCategories(dummyCategories);
            setProducts(prods);
            setLoading(false);
            return;
        }

        try {
            // Fetch categories
            const catRes = await supabase.from('categories').select('*').eq('business_id', BUSINESS_ID).order('display_order');
            if (catRes.error) throw catRes.error;

            // Try fetching products with variants first
            const prodQuery = adminMode
                ? supabase.from('products').select('*, product_variants(*)').eq('business_id', BUSINESS_ID).order('created_at')
                : supabase.from('products').select('*, product_variants(*)').eq('business_id', BUSINESS_ID).eq('visible', true).order('created_at');

            let prodRes = await prodQuery;

            // If variants table doesn't exist, fetch products without variants
            if (prodRes.error) {
                const fallbackQuery = adminMode
                    ? supabase.from('products').select('*').eq('business_id', BUSINESS_ID).order('created_at')
                    : supabase.from('products').select('*').eq('business_id', BUSINESS_ID).eq('visible', true).order('created_at');

                prodRes = await fallbackQuery;
                if (prodRes.error) throw prodRes.error;
            }

            // If Supabase returns empty data, fall back to dummy menu for local testing
            if (catRes.data.length === 0 && prodRes.data.length === 0) {
                setCategories(dummyCategories);
                setProducts(adminMode ? dummyProducts : dummyProducts.filter(p => p.visible !== false));
                setLoading(false);
                retryCount.current = 0;
                return;
            }

            const cats = catRes.data;
            const prods = prodRes.data.map(p => ({
                ...p,
                product_variants: (p.product_variants || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
            }));
            if (!adminMode) {
                _cache.products = prods;
                _cache.categories = cats;
                _cache.populated = true;
            }
            setCategories(cats);
            setProducts(prods);
            setLoading(false);
            retryCount.current = 0;
        } catch (err) {
            if (retryCount.current < MAX_RETRIES) {
                const delay = RETRY_DELAYS[retryCount.current] || 8000;
                retryCount.current += 1;
                retryTimer.current = setTimeout(() => fetchData(true), delay);
            } else {
                setError(err.message || 'Error al cargar el menú');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
        return () => { if (retryTimer.current) clearTimeout(retryTimer.current); };
    }, [adminMode]);

    return { products, categories, loading, error, refetch: () => fetchData(false) };
}
