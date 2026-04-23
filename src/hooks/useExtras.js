import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

export function useExtras(adminMode = false) {
    const [extras, setExtras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchExtras = async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('extras')
                .select('*')
                .eq('business_id', BUSINESS_ID)
                .order('display_order');
            if (!adminMode) query = query.eq('visible', true);
            const { data, error } = await query;
            if (error) throw error;
            setExtras(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExtras(); }, [adminMode]);

    return { extras, loading, error, refetch: fetchExtras };
}
