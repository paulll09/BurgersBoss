import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID;

/**
 * Fetches promotions from Supabase.
 * @param {boolean} adminMode - If true, fetches ALL promos. Otherwise only active + today's day.
 */
export function usePromotions(adminMode = false) {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('promotions').select('*').eq('business_id', BUSINESS_ID).order('display_order');

            if (!adminMode) {
                const todayKey = DAY_KEYS[new Date().getDay()];
                query = query.eq('active', true).contains('days', [todayKey]);
            }

            const { data, error: err } = await query;
            if (err) throw err;
            setPromotions(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [adminMode]);

    return { promotions, loading, error, refetch: fetchData };
}
