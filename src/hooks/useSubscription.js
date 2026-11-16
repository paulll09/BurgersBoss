import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DEFAULT_SUBSCRIPTION = {
    due_day: 5,
    last_paid_period: '',
    payment_info: {
        cvu: '0000003100045782936295',
        holder: 'Carlos Paul Aquino',
    },
};

function isSupabaseConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return Boolean(url && url !== 'https://tu-proyecto.supabase.co');
}

export function useSubscription() {
    const [subData, setSubData] = useState(DEFAULT_SUBSCRIPTION);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    const fetchSubscription = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured() || !BUSINESS_ID) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('settings')
                .select('subscription')
                .eq('business_id', BUSINESS_ID)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.subscription && typeof data.subscription === 'object') {
                setSubData({
                    due_day: data.subscription.due_day ?? DEFAULT_SUBSCRIPTION.due_day,
                    last_paid_period: data.subscription.last_paid_period ?? '',
                    payment_info: {
                        cvu: data.subscription.payment_info?.cvu || DEFAULT_SUBSCRIPTION.payment_info.cvu,
                        holder: data.subscription.payment_info?.holder || DEFAULT_SUBSCRIPTION.payment_info.holder,
                    },
                });
            }
        } catch (err) {
            console.error('Error fetching subscription settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    /* ── Calculate subscription status ── */
    const now           = new Date();
    const currentYear   = now.getFullYear();
    const currentMonth  = String(now.getMonth() + 1).padStart(2, '0');
    const currentPeriod = `${currentYear}-${currentMonth}`; // e.g. "2026-08"
    const currentDay    = now.getDate();
    const monthName     = MONTH_NAMES[now.getMonth()];

    const isPaid = subData.last_paid_period === currentPeriod;

    let status = 'PAID'; // 'PAID' | 'UPCOMING' | 'OVERDUE'
    if (!isPaid) {
        if (currentDay <= subData.due_day) {
            status = 'UPCOMING';
        } else {
            status = 'OVERDUE';
        }
    }

    const daysUntilDue = subData.due_day - currentDay;
    const daysOverdue  = currentDay - subData.due_day;

    return {
        status,             // 'PAID' | 'UPCOMING' | 'OVERDUE'
        isPaid,
        dueDay: subData.due_day,
        monthName,
        currentPeriod,
        paymentInfo: subData.payment_info,
        daysUntilDue,
        daysOverdue,
        loading,
        error,
        refetch: fetchSubscription,
    };
}
