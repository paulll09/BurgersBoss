import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { BUSINESS_ID } from '../lib/config';

const uniqueId = () => Math.random().toString(36).slice(2);

const ACTIVE_STATUSES = ['pending', 'confirmed'];

const isActive = (o) =>
    ACTIVE_STATUSES.includes(o?.status) &&
    (o?.expires_at == null || new Date(o.expires_at).getTime() > Date.now());

export function useOrders() {
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(true);
    const channelIdRef = useRef(`orders-active-${uniqueId()}`);

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
            .channel(channelIdRef.current)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ new: row }) => {
                if (!isActive(row)) return;
                setOrders(prev => prev.some(o => o.id === row.id) ? prev : [row, ...prev]);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ new: row }) => {
                setOrders(prev => {
                    const idx = prev.findIndex(o => o.id === row.id);
                    if (!isActive(row)) return idx === -1 ? prev : prev.filter(o => o.id !== row.id);
                    if (idx === -1) return [row, ...prev];
                    const next = prev.slice();
                    next[idx] = row;
                    return next;
                });
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ old: row }) => {
                setOrders(prev => prev.filter(o => o.id !== row.id));
            })
            .subscribe((status) => {
                // Resync on (re)connect — recovers any events missed during disconnect
                if (status === 'SUBSCRIBED') fetchOrders();
            });

        // Resync when the tab becomes visible again (laptop wake, mobile bg→fg)
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchOrders();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', onVisible);
        };
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

/* ── Lightweight hook just for the sidebar badge ──
   Uses local payload diff; falls back to head-count only when state drifts. */
export function useOrdersCount() {
    const [count, setCount] = useState(0);
    const channelIdRef = useRef(`orders-count-${uniqueId()}`);

    const fetchCount = useCallback(async () => {
        const now = new Date().toISOString();
        const { count: c } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', BUSINESS_ID)
            .eq('status', 'pending')
            .or(`expires_at.is.null,expires_at.gt.${now}`);
        setCount(c ?? 0);
    }, []);

    useEffect(() => {
        fetchCount();
        const channel = supabase
            .channel(channelIdRef.current)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ new: row }) => {
                if (isActive(row) && row.status === 'pending') {
                    setCount(c => c + 1);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ new: newRow, old: oldRow }) => {
                const wasPending = oldRow?.status === 'pending';
                const isPending  = newRow?.status === 'pending' && isActive(newRow);
                if (wasPending === isPending) return;
                setCount(c => Math.max(0, c + (isPending ? 1 : -1)));
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'orders',
                filter: `business_id=eq.${BUSINESS_ID}`,
            }, ({ old: row }) => {
                if (row?.status === 'pending') {
                    setCount(c => Math.max(0, c - 1));
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') fetchCount();
            });

        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchCount();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [fetchCount]);

    return count;
}
