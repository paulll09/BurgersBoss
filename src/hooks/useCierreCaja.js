import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';
import { fetchExpensesTotal } from './useExpenses';
import { getBusinessDayStart, getBusinessDayDate, fetchScheduleOnce } from './useSchedule';

/* Kept for backwards-compat — components should prefer the hook's businessDate field */
export function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useCierreCaja() {
    const [summary,      setSummary]      = useState(null);
    const [cierreHoy,    setCierreHoy]    = useState(null);
    const [history,      setHistory]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [businessDate, setBusinessDate] = useState(todayStr);

    const fetch = useCallback(async () => {
        setLoading(true);
        const schedule = await fetchScheduleOnce();
        const start    = getBusinessDayStart(schedule);
        const fecha    = getBusinessDayDate(schedule);
        setBusinessDate(fecha);
        const end      = new Date().toISOString();

        const [
            { data: orders },
            totalGastos,
            { data: cierreData },
            { data: historyData },
        ] = await Promise.all([
            supabase
                .from('orders')
                .select('total, delivery_fee, payment_method')
                .eq('business_id', BUSINESS_ID)
                .in('status', ['confirmed', 'printed'])
                .gte('created_at', start.toISOString())
                .lte('created_at', end),
            fetchExpensesTotal('today', fecha),
            supabase
                .from('cierres_caja')
                .select('*')
                .eq('business_id', BUSINESS_ID)
                .eq('fecha', fecha)
                .maybeSingle(),
            supabase
                .from('cierres_caja')
                .select('*')
                .eq('business_id', BUSINESS_ID)
                .order('fecha', { ascending: false })
                .limit(30),
        ]);

        const ords = orders ?? [];
        const productoTotal = o => Number(o.total) - Number(o.delivery_fee || 0);
        const ventas_efectivo      = ords.filter(o => o.payment_method === 'efectivo').reduce((s, o) => s + productoTotal(o), 0);
        const ventas_transferencia = ords.filter(o => o.payment_method === 'transferencia').reduce((s, o) => s + productoTotal(o), 0);

        setSummary({
            ventas_efectivo,
            ventas_transferencia,
            total_ventas:   ventas_efectivo + ventas_transferencia,
            total_gastos:   totalGastos,
            saldo_efectivo: ventas_efectivo - totalGastos,
            pedidos_count:  ords.length,
        });
        setCierreHoy(cierreData);
        setHistory(historyData ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const createCierre = async (notas) => {
        const payload = {
            business_id:          BUSINESS_ID,
            fecha:                businessDate,
            ventas_efectivo:      summary.ventas_efectivo,
            ventas_transferencia: summary.ventas_transferencia,
            total_ventas:         summary.total_ventas,
            total_gastos:         summary.total_gastos,
            saldo_efectivo:       summary.saldo_efectivo,
            pedidos_count:        summary.pedidos_count,
            notas:                notas?.trim() || null,
        };
        const { data, error } = await supabase
            .from('cierres_caja')
            .insert(payload)
            .select()
            .single();
        if (!error) {
            setCierreHoy(data);
            setHistory(prev => [data, ...prev]);
        }
        return { data, error };
    };

    const deleteCierre = async (id) => {
        const { error } = await supabase
            .from('cierres_caja')
            .delete()
            .eq('id', id);
        if (!error) {
            setCierreHoy(null);
            setHistory(prev => prev.filter(c => c.id !== id));
        }
        return { error };
    };

    return { summary, cierreHoy, history, loading, refetch: fetch, createCierre, deleteCierre, businessDate };
}
