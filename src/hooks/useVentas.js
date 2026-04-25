import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';
import { fetchExpensesTotal } from './useExpenses';
import { getBusinessDayStart, getBusinessDayDate, fetchScheduleOnce } from './useSchedule';

const SALE_STATUSES = ['confirmed', 'printed'];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_KEYS  = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/* Devuelve la fecha de sesión de negocio para una orden.
   Si la orden cae en el tramo post-medianoche de la sesión anterior
   (ej: 00:30 del sábado pertenece al viernes 20:30→01:00), retrocede un día. */
function getSessionDate(orderDate, schedule) {
    if (!schedule) return orderDate;
    const prevDayIdx = (orderDate.getDay() + 6) % 7;
    const prevSlot   = schedule[DAY_KEYS[prevDayIdx]];
    if (prevSlot?.open) {
        const from = toMinutes(prevSlot.from);
        const to   = toMinutes(prevSlot.to);
        const mins = orderDate.getHours() * 60 + orderDate.getMinutes();
        if (to < from && mins < to) {
            const d = new Date(orderDate);
            d.setDate(d.getDate() - 1);
            return d;
        }
    }
    return orderDate;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ── Date ranges per period ── */
function getRange(period, schedule = null) {
    const now = new Date();

    // Specific business date: "YYYY-MM-DD"
    // Uses business hours from schedule so 24/04 = 24/04 20:30 → 25/04 01:00
    if (DATE_RE.test(period)) {
        const [y, m, d] = period.split('-').map(Number);

        if (schedule) {
            const dow  = new Date(y, m - 1, d).getDay();
            const slot = schedule[DAY_KEYS[dow]];
            if (slot?.open) {
                const from = toMinutes(slot.from);
                const to   = toMinutes(slot.to);
                const start = new Date(y, m - 1, d, Math.floor(from / 60), from % 60, 0, 0);
                // Cross-midnight (e.g. 20:30 → 01:00): closing time is next calendar day
                const end = to < from
                    ? new Date(y, m - 1, d + 1, Math.floor(to / 60), to % 60, 0, 0)
                    : new Date(y, m - 1, d, Math.floor(to / 60), to % 60, 0, 0);
                const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
                const prevEnd   = new Date(end);   prevEnd.setDate(prevEnd.getDate() - 1);
                return { start, end, prevStart, prevEnd };
            }
        }

        // Fallback sin schedule: día calendario
        const start     = new Date(y, m - 1, d, 0, 0, 0, 0);
        const end       = new Date(y, m - 1, d, 23, 59, 59, 999);
        const prevStart = new Date(y, m - 1, d - 1, 0, 0, 0, 0);
        const prevEnd   = new Date(y, m - 1, d - 1, 23, 59, 59, 999);
        return { start, end, prevStart, prevEnd };
    }

    if (period === 'today') {
        const start     = getBusinessDayStart(schedule);
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
function aggregate(orders, period, schedule = null) {
    const totalDelivery = orders.reduce((s, o) => s + Number(o.delivery_fee || 0), 0);
    const totalRevenue  = orders.reduce((s, o) => s + Number(o.total) - Number(o.delivery_fee || 0), 0);
    const orderCount    = orders.length;
    const avgTicket     = orderCount > 0 ? totalRevenue / orderCount : 0;

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

    if (period === 'today' || DATE_RE.test(period)) {
        const hMap = {};
        orders.forEach(o => {
            const h = new Date(o.created_at).getHours();
            if (!hMap[h]) hMap[h] = { label: `${h}:00`, revenue: 0, count: 0 };
            hMap[h].revenue += Number(o.total) - Number(o.delivery_fee || 0);
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
            const key = getSessionDate(new Date(o.created_at), schedule).toDateString();
            if (dMap[key]) { dMap[key].revenue += Number(o.total) - Number(o.delivery_fee || 0); dMap[key].count++; }
        });
        byTime = Object.values(dMap);
    } else {
        const now     = new Date();
        const today   = now.getDate();
        const daysInM = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dMap    = {};
        for (let d = 1; d <= Math.min(today, daysInM); d++) {
            dMap[d] = { label: String(d), revenue: 0, count: 0 };
        }
        orders.forEach(o => {
            const sessionD = getSessionDate(new Date(o.created_at), schedule);
            const d = sessionD.getDate();
            if (dMap[d]) { dMap[d].revenue += Number(o.total) - Number(o.delivery_fee || 0); dMap[d].count++; }
        });
        byTime = Object.values(dMap);
    }

    return { totalRevenue, totalDelivery, orderCount, avgTicket, topProducts, deliveryCount, efectivoCount, byTime };
}

/* ── Hook ── */
export function useVentas(period) {
    const [data, setData]   = useState(null);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const schedule = (period === 'today' || DATE_RE.test(period)) ? await fetchScheduleOnce() : null;
        const { start, end, prevStart, prevEnd } = getRange(period, schedule);

        // Fecha de sesión para filtrar gastos (evita mezcla con día calendario)
        const businessDate = period === 'today'
            ? getBusinessDayDate(schedule)
            : DATE_RE.test(period) ? period : null;

        const [{ data: cur }, { data: prev }, totalExpenses] = await Promise.all([
            supabase.from('orders').select('*')
                .eq('business_id', BUSINESS_ID).in('status', SALE_STATUSES)
                .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
            supabase.from('orders').select('total, delivery_fee')
                .eq('business_id', BUSINESS_ID).in('status', SALE_STATUSES)
                .gte('created_at', prevStart.toISOString()).lte('created_at', prevEnd.toISOString()),
            fetchExpensesTotal(period, businessDate),
        ]);

        const agg  = aggregate(cur ?? [], period, schedule);
        // Comparación vs período anterior también excluye delivery
        const pRev = (prev ?? []).reduce((s, o) => s + Number(o.total) - Number(o.delivery_fee || 0), 0);
        const pct  = pRev > 0 ? ((agg.totalRevenue - pRev) / pRev) * 100 : null;

        setData({ ...agg, pct, pRev, totalExpenses, netProfit: agg.totalRevenue - totalExpenses });
        setLoading(false);
    }, [period]);

    useEffect(() => { fetch(); }, [fetch]);

    return { data, loading, refetch: fetch };
}
