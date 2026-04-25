import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

/* ── Date range helpers ── */
function localStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function periodRange(period) {
    const now = new Date();
    if (period === 'today') {
        const today = localStr(now);
        return { from: today, to: today };
    }
    if (period === 'week') {
        const dow = now.getDay();
        const d = new Date(now);
        d.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
        return { from: localStr(d), to: localStr(now) };
    }
    if (period === 'month') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: localStr(first), to: localStr(now) };
    }
    return { from: null, to: null }; // 'all'
}

/* ════════════════════════════════════════════
   CATEGORIES
════════════════════════════════════════════ */
export function useExpenseCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]       = useState(true);

    const fetch = useCallback(async () => {
        const { data } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('business_id', BUSINESS_ID)
            .order('created_at');
        setCategories(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const createCategory = async ({ name, color }) => {
        const { error } = await supabase.from('expense_categories')
            .insert({ business_id: BUSINESS_ID, name: name.trim(), color });
        if (!error) fetch();
        return { error };
    };

    const updateCategory = async (id, { name, color }) => {
        const { error } = await supabase.from('expense_categories')
            .update({ name: name.trim(), color }).eq('id', id);
        if (!error) fetch();
        return { error };
    };

    const deleteCategory = async (id) => {
        const { error } = await supabase.from('expense_categories').delete().eq('id', id);
        if (!error) fetch();
        return { error };
    };

    return { categories, loading, createCategory, updateCategory, deleteCategory, refetch: fetch };
}

/* ════════════════════════════════════════════
   EXPENSES
════════════════════════════════════════════ */
export function useExpenses(period = 'month') {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading]   = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        const { from, to } = periodRange(period);
        let q = supabase
            .from('expenses')
            .select('*, category:expense_categories(id, name, color)')
            .eq('business_id', BUSINESS_ID)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (from) q = q.gte('date', from);
        if (to)   q = q.lte('date', to);

        const { data } = await q;
        setExpenses(data ?? []);
        setLoading(false);
    }, [period]);

    useEffect(() => { fetch(); }, [fetch]);

    const createExpense = async ({ amount, description, category_id, date }) => {
        const { error } = await supabase.from('expenses').insert({
            business_id: BUSINESS_ID,
            amount: parseFloat(amount),
            description: description?.trim() || null,
            category_id: category_id || null,
            date,
        });
        if (!error) fetch();
        return { error };
    };

    const updateExpense = async (id, { amount, description, category_id, date }) => {
        const { error } = await supabase.from('expenses').update({
            amount: parseFloat(amount),
            description: description?.trim() || null,
            category_id: category_id || null,
            date,
        }).eq('id', id);
        if (!error) fetch();
        return { error };
    };

    const deleteExpense = async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) fetch();
        return { error };
    };

    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return { expenses, loading, total, createExpense, updateExpense, deleteExpense, refetch: fetch };
}

/* ── Lightweight: total expenses for a period (used in Ventas/Cierre) ──
   businessDate: si se pasa, filtra por esa fecha exacta (fecha de sesión).
   Útil para que 'hoy' use la fecha de la sesión del negocio, no el día calendario. */
export async function fetchExpensesTotal(period, businessDate = null) {
    let q = supabase.from('expenses').select('amount').eq('business_id', BUSINESS_ID);

    if (businessDate) {
        q = q.eq('date', businessDate);
    } else {
        const { from, to } = periodRange(period);
        if (from) q = q.gte('date', from);
        if (to)   q = q.lte('date', to);
    }

    const { data } = await q;
    return (data ?? []).reduce((s, e) => s + Number(e.amount), 0);
}
