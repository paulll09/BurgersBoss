import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

export function useAdminStats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        const [
            { count: totalProducts },
            { count: visibleProducts },
            { count: totalCategories },
            { count: totalExtras },
        ] = await Promise.all([
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID),
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID).eq('visible', true),
            supabase.from('categories').select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID),
            supabase.from('extras').select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID),
        ]);

        setStats({
            totalProducts:   totalProducts   ?? 0,
            visibleProducts: visibleProducts ?? 0,
            hiddenProducts:  (totalProducts  ?? 0) - (visibleProducts ?? 0),
            totalCategories: totalCategories ?? 0,
            totalExtras:     totalExtras     ?? 0,
        });
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
}
