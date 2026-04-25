import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

export function useOrders() {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        const now = new Date().toISOString();
        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('business_id', BUSINESS_ID)
            .in('status', ACTIVE_STATUSES)
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .order('created_at', { ascending: false });

        setOrders(data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel(`orders-active-${Math.random()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, fetchOrders)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [fetchOrders]);

    const confirmOrder = useCallback(async (id, deliveryFee = 0) => {
        const updates = {
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            expires_at: null,
        };
        if (deliveryFee > 0) {
            const { data: current } = await supabase
                .from('orders').select('total').eq('id', id).single();
            updates.delivery_fee = deliveryFee;
            updates.total = (current?.total ?? 0) + deliveryFee;
        }
        const { error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', id);
        return !error;
    }, []);

    const cancelOrder = useCallback(async (id) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', id);
        return !error;
    }, []);

    const deleteOrder = useCallback(async (id) => {
        const { data, error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .select('id');
        if (error) return false;
        return Array.isArray(data) && data.length > 0;
    }, []);

    const markPrinted = useCallback(async (id) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed', printed_at: new Date().toISOString() })
            .eq('id', id);
        return !error;
    }, []);

    const createManualOrder = useCallback(async (payload) => {
        const { data, error } = await supabase
            .from('orders')
            .insert({
                business_id: BUSINESS_ID,
                source: 'manual',
                status: 'confirmed',
                confirmed_at: new Date().toISOString(),
                expires_at: null,
                ...payload,
            })
            .select('*')
            .single();
        return { data, error };
    }, []);

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const confirmedCount = orders.filter(o => o.status === 'confirmed').length;

    return {
        orders, loading,
        pendingCount, confirmedCount,
        activeCount: orders.length,
        confirmOrder, cancelOrder, markPrinted, createManualOrder, deleteOrder,
        refetch: fetchOrders,
    };
}

/* ── Lightweight hook just for the sidebar badge ── */
export function useOrdersCount() {
    const [count, setCount] = useState(0);

    const fetchCount = useCallback(async () => {
        const now = new Date().toISOString();
        const { count: c } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', BUSINESS_ID)
            .eq('status', 'pending')
            .or(`expires_at.is.null,expires_at.gt.${now}`);
        setCount(c ?? 0);
    }, []);

    useEffect(() => {
        fetchCount();
        const channel = supabase
            .channel(`orders-count-${Math.random()}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, fetchCount)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchCount]);

    return count;
}
