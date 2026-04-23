import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';
import { fetchExpensesTotal } from './useExpenses';

export function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayRange() {
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end   = new Date(now); end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
}

export function useCierreCaja() {
    const [summary,   setSummary]   = useState(null);
    const [cierreHoy, setCierreHoy] = useState(null);
    const [history,   setHistory]   = useState([]);
    const [loading,   setLoading]   = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { start, end } = todayRange();
        const fecha = todayStr();

        const [
            { data: orders },
            totalGastos,
            { data: cierreData },
            { data: historyData },
        ] = await Promise.all([
            supabase
                .from('orders')
                .select('total, payment_method')
                .eq('business_id', BUSINESS_ID)
                .in('status', ['confirmed', 'printed'])
                .gte('created_at', start)
                .lte('created_at', end),
            fetchExpensesTotal('today'),
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
        const ventas_efectivo       = ords.filter(o => o.payment_method === 'efectivo').reduce((s, o) => s + Number(o.total), 0);
        const ventas_transferencia  = ords.filter(o => o.payment_method === 'transferencia').reduce((s, o) => s + Number(o.total), 0);

        setSummary({
            ventas_efectivo,
            ventas_transferencia,
            total_ventas:  ventas_efectivo + ventas_transferencia,
            total_gastos:  totalGastos,
            saldo_efectivo: ventas_efectivo - totalGastos,
            pedidos_count: ords.length,
        });
        setCierreHoy(cierreData);
        setHistory(historyData ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const createCierre = async (notas) => {
        const payload = {
            business_id:          BUSINESS_ID,
            fecha:                todayStr(),
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

    return { summary, cierreHoy, history, loading, refetch: fetch, createCierre };
}
