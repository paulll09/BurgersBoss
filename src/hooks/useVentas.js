import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';
import { fetchExpensesTotal } from './useExpenses';

const SALE_STATUSES = ['confirmed', 'printed'];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/* ── Date ranges per period ── */
function getRange(period) {
    const now = new Date();

    if (period === 'today') {
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const prevStart = new Date(start); prevStart.setDate(start.getDate() - 1);
        const prevEnd   = new Date(start); prevEnd.setMilliseconds(-1);
        return { start, end: now, prevStart, prevEnd };
    }

    if (period === 'week') {
        const dow = now.getDay();
        const daysFromMon = dow === 0 ? 6 : dow - 1;
        const start = new Date(now);
        start.setDate(now.getDate() - daysFromMon); start.setHours(0, 0, 0, 0);
        const prevEnd   = new Date(start); prevEnd.setMilliseconds(-1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevEnd.getDate() - 6); prevStart.setHours(0, 0, 0, 0);
        return { start, end: now, prevStart, prevEnd };
    }

    // month
    const start     = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end: now, prevStart, prevEnd };
}

/* ── Aggregate orders into metrics ── */
function aggregate(orders, period) {
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const orderCount   = orders.length;
    const avgTicket    = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Top products
    const pMap = {};
    orders.forEach(o => {
        (o.items ?? []).forEach(item => {
            const key = item.variantName ? `${item.name} (${item.variantName})` : item.name;
            if (!pMap[key]) pMap[key] = { name: key, qty: 0, revenue: 0 };
            pMap[key].qty     += Number(item.quantity) || 1;
            pMap[key].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
        });
    });
    const topProducts = Object.values(pMap).sort((a, b) => b.qty - a.qty).slice(0, 8);

    // Split
    const deliveryCount  = orders.filter(o => o.order_type === 'delivery').length;
    const efectivoCount  = orders.filter(o => o.payment_method === 'efectivo').length;

    // By time
    let byTime = [];

    if (period === 'today') {
        const hMap = {};
        orders.forEach(o => {
            const h = new Date(o.created_at).getHours();
            if (!hMap[h]) hMap[h] = { label: `${h}:00`, revenue: 0, count: 0 };
            hMap[h].revenue += Number(o.total);
            hMap[h].count++;
        });
        byTime = Object.values(hMap).sort((a, b) => parseInt(a.label) - parseInt(b.label));
    } else if (period === 'week') {
        const dMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toDateString();
            dMap[key] = { label: `${DAY_NAMES[d.getDay()]} ${d.getDate()}`, revenue: 0, count: 0 };
        }
        orders.forEach(o => {
            const key = new Date(o.created_at).toDateString();
            if (dMap[key]) { dMap[key].revenue += Number(o.total); dMap[key].count++; }
        });
        byTime = Object.values(dMap);
    } else {
        const now      = new Date();
        const today    = now.getDate();
        const daysInM  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dMap     = {};
        for (let d = 1; d <= Math.min(today, daysInM); d++) {
            dMap[d] = { label: String(d), revenue: 0, count: 0 };
        }
        orders.forEach(o => {
            const d = new Date(o.created_at).getDate();
            if (dMap[d]) { dMap[d].revenue += Number(o.total); dMap[d].count++; }
        });
        byTime = Object.values(dMap);
    }

    return { totalRevenue, orderCount, avgTicket, topProducts, deliveryCount, efectivoCount, byTime };
}

/* ── Hook ── */
export function useVentas(period) {
    const [data, setData]           = useState(null);
    const [prevRevenue, setPrev]    = useState(null);
    const [loading, setLoading]     = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { start, end, prevStart, prevEnd } = getRange(period);

        const [{ data: cur }, { data: prev }, totalExpenses] = await Promise.all([
            supabase.from('orders').select('*')
                .eq('business_id', BUSINESS_ID).in('status', SALE_STATUSES)
                .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
            supabase.from('orders').select('total')
                .eq('business_id', BUSINESS_ID).in('status', SALE_STATUSES)
                .gte('created_at', prevStart.toISOString()).lte('created_at', prevEnd.toISOString()),
            fetchExpensesTotal(period),
        ]);

        const agg  = aggregate(cur ?? [], period);
        const pRev = (prev ?? []).reduce((s, o) => s + Number(o.total), 0);
        const pct  = pRev > 0 ? ((agg.totalRevenue - pRev) / pRev) * 100 : null;

        setData({ ...agg, pct, pRev, totalExpenses, netProfit: agg.totalRevenue - totalExpenses });
        setPrev(pRev);
        setLoading(false);
    }, [period]);

    useEffect(() => { fetch(); }, [fetch]);

    return { data, loading, refetch: fetch };
}
